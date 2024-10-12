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

type TestReportT struct {
	TestPath          string            `json:"test_path"`
	ModelUsageMetrics ModelUsageMetrics `json:"model_usage_metrics"`
	TestCases         int               `json:"test_cases"`
	TestCode          string            `json:"test_code"`
}

type TestReport = *TestReportT

func (me TestReport) Print(console comm.Console) {
	me.ModelUsageMetrics.Print(console, comm.DEFAULT_COLOR)

	console.NewLine().Printf("Test Path: %s", me.TestPath)
	console.NewLine().Printf("Test Cases: %d", me.TestCases)
}

type TestResult = *TestResultT

type TestAgentT struct {
	SymbolAwareAgentT

	codeFileManager CodeFileManager
	file            string
}

type TestAgent = *TestAgentT

func NewTestAgent(
	codeFileManager CodeFileManager,
	symbolManager SymbolManager,
	modelService ModelService,
	codeFile string,
) TestAgent {
	return &TestAgentT{
		SymbolAwareAgentT: newSymbolAwareAgent(symbolManager, modelService),
		codeFileManager:   codeFileManager,
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

		result := me.testFile(x, testArgs, c)

		resultChan <- result
	}()
}

func (me TestAgent) generateTestFile(x Kontext, testArgs TestArgs, c comm.Console) TestResult {
	c.NewLine().Green("--------------------")
	c.NewLine().Greenln(me.file)

	code := me.codeFileManager.Load(x, me.file)
	if !code.IsChanged() {
		if !x.Args.Force {
			c.NewLine().Default("no code changes, skipped")
			return &TestResultT{Skipped: true}
		}
	}

	r := me.generateTestCode(x, c, code.Latest)
	r.Print(c)

	me.codeFileManager.Save(x, r.TestPath, r.TestCode)

	return &TestResultT{Report: r, Skipped: false}
}

func (me TestAgent) generateTestCode(x Kontext, c comm.Console, code string) TestReport {
	verbose := x.Args.Verbose

	mem := me.memory
	mem.AddSystemMessage(`
As an developer expert, you're requested to write unit tests for provided code.
1. Each test case should be in a separate method/function. The test cases should be in a separate file.
2. 
}
`)

	if x.Args.EnableSymbolCollection {
		// TODO: merge metrics
		me.provideSymbols(x, c, me.file)
	}

	mem.AddUserMessage("test the code")
	if verbose {
		c.NewLine().Gray("chat: ").Default("test the code")
	}

	answer, metrics := me.modelService.Chat(x, x.Config.Test.ModelId, mem)
	if verbose {
		c.NewLine().Gray("answer: ").Default(mem.Format())
	}

	fixeCode, remainedAnswer := ExtractFixedCode(answer)
	r := ExtractTestReport(remainedAnswer)
	r.ModelUsageMetrics = metrics
	r.FixedCode = fixeCode

	if r.HasIssue {
		trimmedOriginalCode := strings.TrimSpace(code)
		trimmedFixedCode := strings.TrimSpace(fixeCode)

		if trimmedFixedCode == trimmedOriginalCode {
			r.HasIssue = false
			r.Issues = []TestIssue{}
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
