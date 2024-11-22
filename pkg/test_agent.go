package batchai

import (
	"path"
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

	reportManager TestReportManager

	file         string
	relativeFile string
}

type TestAgent = *TestAgentT

func NewTestAgent(reportManager TestReportManager,
	symbolManager SymbolManager,
	modelService ModelService,
	codeFile string,
) TestAgent {
	return &TestAgentT{
		SymbolAwareAgentT: newSymbolAwareAgent(symbolManager, modelService),
		reportManager:     reportManager,
		file:              codeFile,
	}
}

func (me TestAgent) run(x Kontext, testArgs TestArgs, resultChan chan<- TestResult) {
	c := comm.NewConsole(!x.Args.Concurrent)
	me.relativeFile = me.file[len(x.Args.Repository)+1:]

	c.Greenf("\n\n▹▹▹▹▹ processing: %s\n", me.relativeFile)
	c.Begin()
	defer c.End()

	defer func() {
		if e := recover(); e != nil {
			c.NewLine().Red("failed: ").Defaultf("%v, %+v", me.relativeFile, e)
			resultChan <- &TestResultT{Failed: true}
		}
	}()

	result := me.generateTest(x, testArgs, c)

	resultChan <- result
}

func (me TestAgent) Run(x Kontext, testArgs TestArgs, resultChan chan<- TestResult, wg *sync.WaitGroup) {
	if !x.Args.Concurrent {
		me.run(x, testArgs, resultChan)
		return
	}

	wg.Add(1)

	go func() {
		defer wg.Done()

		me.run(x, testArgs, resultChan)
	}()
}

func (me TestAgent) generateTest(x Kontext, testArgs TestArgs, c comm.Console) TestResult {
	c.NewLine().Green("--------------------")
	c.NewLine().Greenln(me.relativeFile)

	newCode := comm.ReadFileCodeP(x.Fs, me.file)

	lastReport := me.reportManager.LoadReport(x, me.file)
	if lastReport != nil {
		noCodeChanges := (newCode == lastReport.OriginalCode)
		if noCodeChanges {
			if !x.Args.Force {
				c.NewLine().Default("✔ no code changes since last execution, skipped")
				return &TestResultT{Skipped: true}
			}
		}
	}

	existingTestCode := ""
	if lastReport != nil && lastReport.TestFilePath != "" {
		absTestFilePath := path.Join(x.Args.Repository, lastReport.TestFilePath)
		if comm.FileExistsP(x.Fs, absTestFilePath) {
			existingTestCode = comm.ReadFileCodeP(x.Fs, absTestFilePath)
		}
	}

	newReport := me.generateTestCode(x, c, testArgs, newCode, existingTestCode)
	newReport.Print(c)

	comm.WriteFileTextP(x.Fs, path.Join(x.Args.Repository, newReport.TestFilePath), newReport.TestCode)

	reportFile := me.reportManager.SaveReport(x, me.file, newReport)
	c.NewLine().Blue("✔ report: ").Default(reportFile[len(x.Args.Repository)+1:])

	return &TestResultT{Report: newReport, Skipped: false}
}

type TestCodeWriterT struct {
	console    comm.Console
	inTestCode bool
}

type TestCodeWriter = *TestCodeWriterT

func NewTestCodeWriter(console comm.Console) TestCodeWriter {
	return &TestCodeWriterT{
		console:    console,
		inTestCode: false,
	}
}

// Write method to implement io.Writer
func (me TestCodeWriter) Write(p []byte) (n int, err error) {
	s := string(p)

	if me.inTestCode {
		if strings.Contains(s, TEST_END) {
			me.inTestCode = false
		} else {
			me.console.Default(s)
		}
	} else {
		if strings.Contains(s, TEST_BEGIN) {
			me.inTestCode = true
		}
	}

	return len(p), nil
}

func (me TestAgent) generateTestCode(x Kontext, c comm.Console, testArgs TestArgs, code string, existingTestCode string) TestReport {
	verbose := x.Args.Verbose

	inputExistingTestCode := existingTestCode
	contextWindowSize := me.modelService.GetContextWindowSize(x.Config.Test.ModelId)
	if len(inputExistingTestCode) > contextWindowSize-len(code)-1000 {
		inputExistingTestCode = ""
	}

	sysPrompt := x.Config.Test.RenderPrompt(testArgs.Libraries, code, me.relativeFile, inputExistingTestCode)
	mem := me.memory
	mem.AddSystemMessage(sysPrompt)

	if x.Args.EnableSymbolReference {
		// TODO: merge metrics
		me.provideSymbols(x, c, me.file)
		mem.AddUserMessage("generates tests, with provided symbols as references")
	} else {
		mem.AddUserMessage("generates tests")
	}

	if verbose {
		c.NewLine().Gray("chat: ").Default("generates tests")
	}

	answer, metrics := me.modelService.Chat(x, x.Config.Test.ModelId, true, mem, NewTestCodeWriter(c))
	if verbose {
		c.NewLine().Gray("answer: ").Default(mem.Format())
	}

	r, remainedAnswer := ExtractTestReport(answer, strings.HasSuffix(me.file, ".go"))
	r.ModelUsageMetrics = metrics
	r.Path = me.relativeFile
	r.OriginalCode = code
	r.ExistingTestCode = existingTestCode

	testCode, _ := comm.ExtractMarkdownCodeBlocksP(remainedAnswer)
	r.TestCode = comm.NormalizeCode(testCode)

	return r
}
