package batchai

import (
	"fmt"
	"strings"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type ReviewResultT struct {
	Report  ReviewReport
	Skipped bool
	Failed  bool
}

type ReviewResult = *ReviewResultT

type ReviewAgentT struct {
	AgentT

	reportManager   ReviewReportManager
	codeFileManager CodeFileManager
	symbolManager   SymbolManager
	file            string
}

type ReviewAgent = *ReviewAgentT

func NewReviewAgent(reportManager ReviewReportManager,
	codeFileManager CodeFileManager,
	symbolManager SymbolManager,
	modelService ModelService,
	codeFile string,
) ReviewAgent {
	return &ReviewAgentT{
		AgentT:          newAgent(modelService),
		codeFileManager: codeFileManager,
		reportManager:   reportManager,
		symbolManager:   symbolManager,
		file:            codeFile,
	}
}

func (me ReviewAgent) Run(x Kontext, reviewArgs ReviewArgs, resultChan chan<- ReviewResult, wg *sync.WaitGroup) {
	wg.Add(1)

	go func() {
		defer wg.Done()

		c := comm.NewConsole()

		c.Greenf("processing: %s\n", me.file)
		c.Begin()
		defer c.End()

		defer func() {
			if e := recover(); e != nil {
				c.NewLine().Red("failed: ").Defaultf("%v, %+v", me.file, e)
				resultChan <- &ReviewResultT{Failed: true}
			}
		}()

		result := me.reviewFile(x, reviewArgs, c)

		resultChan <- result
	}()
}

func (me ReviewAgent) reviewFile(x Kontext, reviewArgs ReviewArgs, c comm.Console) ReviewResult {
	c.NewLine().Green("--------------------")
	c.NewLine().Greenln(me.file)

	code := me.codeFileManager.Load(x, me.file)
	if !code.IsChanged() {
		cachedReport := me.reportManager.LoadReport(x, me.file)
		if cachedReport != nil {
			if !x.Args.Force {
				c.NewLine().Default("no code changes, skipped")
				return &ReviewResultT{Report: cachedReport, Skipped: true}
			}
		}
	}

	r := me.reviewCode(x, c, code.Latest)
	r.Print(c, code.Original)

	if r.HasIssue {
		if reviewArgs.Fix {
			// replace the original code file with reviewed code
			me.codeFileManager.Save(x, me.file, r.FixedCode)
		}
	}

	reportFile := me.reportManager.SaveReport(x, me.file, r)
	c.NewLine().Blue("report: ").Default(reportFile)

	return &ReviewResultT{Report: r, Skipped: false}
}

func (me ReviewAgent) provideSymbols(x Kontext, c comm.Console, file string) ModelUsageMetrics {
	verbose := x.Args.Verbose
	mem := me.memory

	msg1 := `
1) list all referred non-standard symbols and all symbols which is missing and not defined or initialized in current file, includes: type, class, enum, const, constant, literal, variable, interface, property, field, attributes, method, function;
2) return a json array of simple name of symbols, e.g. ["symbol1", "symbol2"]; 
3) excludes either package names or full qualified names
4) exclude any other words excepts the json array
5) if no symbol to check, return an empty array []
`
	mem.AddUserMessage(msg1)
	if verbose {
		c.NewLine().Gray("chat: ").Default(msg1)
	}

	modelId := x.Config.Review.ModelId
	answer, metrics := me.modelService.Chat(x, modelId, mem)
	if verbose {
		c.NewLine().Gray("answer: ").Default(answer)
	}
	jsonAnswer, _ := comm.ExtractMarkdownJsonBlocksP(answer)

	symbolNames := []string{}
	comm.FromJsonP(jsonAnswer, false, &symbolNames)
	if len(symbolNames) == 0 {
		return metrics
	}
	symbolNames = comm.RemovePackageNames(symbolNames)

	symbols := me.symbolManager.Lookup(x, symbolNames, file)
	if verbose {
		c.NewLine().Default("search symbols: ").Defaultf("%v", symbols)
	}
	if len(symbols) == 0 {
		return metrics
	}

	symbolDetails := []string{}
	for _, s := range symbols {
		symbolDetails = append(symbolDetails, fmt.Sprintf("The symbol %s is defined and initialized in another file, %s. Should use this definition while reviewing and do not report anything related to it as an issue. See: %s", s.Name, s.Path, s.Lines))
	}
	msg2 := strings.Join(symbolDetails, "\n")
	mem.AddUserMessage(msg2)
	if verbose {
		c.NewLine().Gray("chat: ").Default(msg2)
	}

	// TODO：merge metrics
	answer, metrics = me.modelService.Chat(x, modelId, mem)
	if verbose {
		c.NewLine().Gray("answer: ").Default(answer)
	}

	return metrics
}

func (me ReviewAgent) reviewCode(x Kontext, c comm.Console, code string) ReviewReport {
	verbose := x.Args.Verbose

	sysPrompt := x.Config.Review.RenderPrompt(code, me.file)
	mem := me.memory
	mem.AddSystemMessage(sysPrompt)

	if x.Args.EnableSymbolCollection {
		// TODO: merge metrics
		me.provideSymbols(x, c, me.file)
	}

	mem.AddUserMessage("review the code")
	if verbose {
		c.NewLine().Gray("chat: ").Default("review the code")
	}

	answer, metrics := me.modelService.Chat(x, x.Config.Review.ModelId, mem)
	if verbose {
		c.NewLine().Gray("answer: ").Default(mem.Format())
	}

	fixeCode, remainedAnswer := ExtractFixedCode(answer)
	r := ExtractReviewReport(remainedAnswer)
	r.ModelUsageMetrics = metrics
	r.FixedCode = fixeCode

	if r.HasIssue {
		trimmedOriginalCode := strings.TrimSpace(code)
		trimmedFixedCode := strings.TrimSpace(fixeCode)

		if trimmedFixedCode == trimmedOriginalCode {
			r.HasIssue = false
			r.Issues = []ReviewIssue{}
			r.FixedCode = code
			r.OverallSeverity = ""
		} else if len(trimmedFixedCode) == 0 {
			r.FixedCode = code
		} else if !strings.HasSuffix(fixeCode, "\n") {
			r.FixedCode = fixeCode + "\n"
		}
	}

	return r
}
