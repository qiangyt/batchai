package batchai

import (
	"strings"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type CheckResultT struct {
	Report  CheckReport
	Skipped bool
	Failed  bool
}

type CheckResult = *CheckResultT

type CheckAgentT struct {
	SymbolAwareAgentT

	reportManager   CheckReportManager
	codeFileManager CodeFileManager

	file string
}

type CheckAgent = *CheckAgentT

func NewCheckAgent(reportManager CheckReportManager,
	codeFileManager CodeFileManager,
	symbolManager SymbolManager,
	modelService ModelService,
	codeFile string,
) CheckAgent {
	return &CheckAgentT{
		SymbolAwareAgentT: newSymbolAwareAgent(symbolManager, modelService),
		codeFileManager:   codeFileManager,
		reportManager:     reportManager,

		file: codeFile,
	}
}

func (me CheckAgent) Run(x Kontext, checkArgs CheckArgs, resultChan chan<- CheckResult, wg *sync.WaitGroup) {
	wg.Add(1)

	go func() {
		defer wg.Done()

		c := comm.NewConsole(x.Args.Concurrent == 1)

		c.Greenf("▹▹▹▹▹ processing: %s\n", me.file)
		c.Begin()
		defer c.End()

		defer func() {
			if e := recover(); e != nil {
				c.NewLine().Red("failed: ").Defaultf("%v, %+v", me.file, e)
				resultChan <- &CheckResultT{Failed: true}
			}
		}()

		result := me.checkFile(x, checkArgs, c)

		resultChan <- result
	}()
}

func (me CheckAgent) checkFile(x Kontext, checkArgs CheckArgs, c comm.Console) CheckResult {
	c.NewLine().Green("--------------------")
	c.NewLine().Greenln(me.file)

	code := me.codeFileManager.Load(x, me.file)
	if !code.IsChanged() {
		cachedReport := me.reportManager.LoadReport(x, me.file)
		if cachedReport != nil {
			if !x.Args.Force {
				c.NewLine().Default("✔ no code changes, skipped")
				return &CheckResultT{Report: cachedReport, Skipped: true}
			}
		}
	}

	r := me.checkCode(x, c, code.Latest)
	r.Print(c, code.Original)

	if r.HasIssue {
		if checkArgs.Fix {
			// replace the original code file with checked code
			me.codeFileManager.Save(x, me.file, r.FixedCode)
		}
	}

	reportFile := me.reportManager.SaveReport(x, me.file, r)
	c.NewLine().Blue("✔ report: ").Default(reportFile)

	return &CheckResultT{Report: r, Skipped: false}
}

func (me CheckAgent) checkCode(x Kontext, c comm.Console, code string) CheckReport {
	verbose := x.Args.Verbose

	sysPrompt := x.Config.Check.RenderPrompt(code, me.file)
	mem := me.memory
	mem.AddSystemMessage(sysPrompt)

	if x.Args.EnableSymbolReference {
		// TODO: merge metrics
		me.provideSymbols(x, c, me.file)
		mem.AddUserMessage("check the code, with provided symbols as references")
	} else {
		mem.AddUserMessage("check the code")
	}
	if verbose {
		c.NewLine().Gray("chat: ").Default("check the code")
	}

	answer, metrics := me.modelService.Chat(x, x.Config.Check.ModelId, mem)
	if verbose {
		c.NewLine().Gray("answer: ").Default(mem.Format())
	}

	fixeCode, remainedAnswer := ExtractFixedCode(answer)
	r := ExtractCheckReport(remainedAnswer, strings.HasSuffix(me.file, ".go"))
	r.ModelUsageMetrics = metrics
	r.FixedCode = fixeCode

	if r.HasIssue {
		trimmedOriginalCode := strings.TrimSpace(code)
		trimmedFixedCode := strings.TrimSpace(fixeCode)

		if trimmedFixedCode == trimmedOriginalCode {
			r.HasIssue = false
			r.Issues = []CheckIssue{}
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
