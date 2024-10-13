package batchai

import (
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
	SymbolAwareAgentT

	reportManager   ReviewReportManager
	codeFileManager CodeFileManager

	file string
}

type ReviewAgent = *ReviewAgentT

func NewReviewAgent(reportManager ReviewReportManager,
	codeFileManager CodeFileManager,
	symbolManager SymbolManager,
	modelService ModelService,
	codeFile string,
) ReviewAgent {
	return &ReviewAgentT{
		SymbolAwareAgentT: newSymbolAwareAgent(symbolManager, modelService),
		codeFileManager:   codeFileManager,
		reportManager:     reportManager,

		file: codeFile,
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

func (me ReviewAgent) reviewCode(x Kontext, c comm.Console, code string) ReviewReport {
	verbose := x.Args.Verbose

	sysPrompt := x.Config.Review.RenderPrompt(code, me.file)
	mem := me.memory
	mem.AddSystemMessage(sysPrompt)

	if x.Args.EnableSymbolReference {
		// TODO: merge metrics
		me.provideSymbols(x, c, me.file)
		mem.AddUserMessage("review the code, with provided symbols as references")
	} else {
		mem.AddUserMessage("review the code")
	}
	if verbose {
		c.NewLine().Gray("chat: ").Default("review the code")
	}

	answer, metrics := me.modelService.Chat(x, x.Config.Review.ModelId, mem)
	if verbose {
		c.NewLine().Gray("answer: ").Default(mem.Format())
	}

	fixeCode, remainedAnswer := ExtractFixedCode(answer)
	r := ExtractReviewReport(remainedAnswer, strings.HasSuffix(me.file, ".go"))
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
