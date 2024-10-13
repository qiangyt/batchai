package batchai

import (
	"strings"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type TestResultT struct {
	Skipped bool
	Failed  bool
	Report  TestReport
}

type TestResult = *TestResultT

type TestAgentT struct {
	SymbolAwareAgentT

	reportManager   TestReportManager
	codeFileManager CodeFileManager
	file            string
}

type TestAgent = *TestAgentT

func NewTestAgent(reportManager TestReportManager,
	codeFileManager CodeFileManager,
	symbolManager SymbolManager,
	modelService ModelService,
	codeFile string,
) TestAgent {
	return &TestAgentT{
		SymbolAwareAgentT: newSymbolAwareAgent(symbolManager, modelService),
		codeFileManager:   codeFileManager,
		reportManager:     reportManager,
		file:              codeFile,
	}
}

func (me TestAgent) Run(x Kontext, testArgs TestArgs, resultChan chan<- TestResult, wg *sync.WaitGroup) {
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
				resultChan <- &TestResultT{Failed: true}
			}
		}()

		result := me.generateTest(x, testArgs, c)

		resultChan <- result
	}()
}

func (me TestAgent) generateTest(x Kontext, testArgs TestArgs, c comm.Console) TestResult {
	c.NewLine().Green("--------------------")
	c.NewLine().Greenln(me.file)

	cachedReport := me.reportManager.LoadReport(x, me.file)

	code := me.codeFileManager.Load(x, me.file)
	if !code.IsChanged() {
		if cachedReport != nil {
			if !x.Args.Force {
				c.NewLine().Default("no code changes, skipped")
				return &TestResultT{Skipped: true}
			}
		}
	}

	r := me.generateTestCode(x, c, testArgs, code.Latest, cachedReport)
	r.Print(c)

	me.codeFileManager.Save(x, r.TestFilePath, r.TestCode)

	reportFile := me.reportManager.SaveReport(x, me.file, r)
	c.NewLine().Blue("report: ").Default(reportFile)

	return &TestResultT{Report: r, Skipped: false}
}

func (me TestAgent) generateTestCode(x Kontext, c comm.Console, testArgs TestArgs, code string, cachedReport TestReport) TestReport {
	verbose := x.Args.Verbose

	exstingTestCode := ""
	if cachedReport != nil && testArgs.Update {
		exstingTestCode = cachedReport.TestCode
	}

	sysPrompt := x.Config.Test.RenderPrompt(testArgs.Libraries, code, me.file, exstingTestCode)
	mem := me.memory
	mem.AddSystemMessage(sysPrompt)

	if x.Args.EnableSymbolCollection {
		// TODO: merge metrics
		me.provideSymbols(x, c, me.file)
	}

	mem.AddUserMessage("generates tests")
	if verbose {
		c.NewLine().Gray("chat: ").Default("generates tests")
	}

	answer, metrics := me.modelService.Chat(x, x.Config.Test.ModelId, mem)
	if verbose {
		c.NewLine().Gray("answer: ").Default(mem.Format())
	}

	testCode, remainedAnswer := ExtractTestCode(answer)
	r := ExtractTestReport(remainedAnswer, strings.HasSuffix(me.file, ".go"))
	r.ModelUsageMetrics = metrics
	r.TestCode = testCode
	r.Path = me.file
	return r
}
