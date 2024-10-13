package batchai

import (
	"strings"
	"sync"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm"
)

const TEST_RESPONSE_JSON_FORMAT = `
{
  "test_file_path": "",
  "test_code": "",  
  "amount_of_generated_test_cases": 0
}`

type TestResultT struct {
	Skipped           bool
	Failed            bool
	Response          TestResponse
	ModelUsageMetrics ModelUsageMetrics
}

type TestResult = *TestResultT

type TestResponseT struct {
	TestFilePath               string `json:"test_file_path"`
	TestCode                   string `json:"test_code"`
	AmountOfGeneratedTestCases int    `json:"amount_of_generated_test_cases"`
}

type TestResponse = *TestResponseT

func (me TestResponse) Print(console comm.Console, metrics ModelUsageMetrics) {
	metrics.Print(console, comm.DEFAULT_COLOR)

	console.NewLine().Printf("Test File Path: %s", me.TestFilePath)
	console.NewLine().Printf("Amoutn of Generated Test Cases: %d", me.AmountOfGeneratedTestCases)
	console.NewLine().Printf("Test Code: %s", me.TestCode)
}

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

		result := me.generateTestFile(x, testArgs, c)

		resultChan <- result
	}()
}

func (me TestAgent) generateTestFile(x Kontext, testArgs TestArgs, c comm.Console) TestResult {
	c.NewLine().Green("--------------------")
	c.NewLine().Greenln(me.file)

	code := me.codeFileManager.Load(x, me.file)
	// if !code.IsChanged() {
	// 	if !x.Args.Force {
	// 		c.NewLine().Default("no code changes, skipped")
	// 		return &TestResultT{Skipped: true}
	// 	}
	// }

	r, metrics := me.generateTestCode(x, c, testArgs, code.Latest)
	r.Print(c, metrics)

	me.codeFileManager.Save(x, r.TestFilePath, r.TestCode)

	return &TestResultT{Response: r, Skipped: false}
}

func (me TestAgent) generateTestCode(x Kontext, c comm.Console, testArgs TestArgs, code string) (TestResponse, ModelUsageMetrics) {
	verbose := x.Args.Verbose

	sysPrompt := x.Config.Test.RenderPrompt(testArgs.Frameworks, code, me.file)
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

	r := ExtractTestResponse(answer)

	return r, metrics
}

func ExtractTestResponse(answer string) TestResponse {
	jsonStr, _ := comm.ExtractMarkdownJsonBlocksP(answer)

	indexOfLeftBrace := strings.Index(jsonStr, "{")
	if indexOfLeftBrace < 0 {
		panic(errors.New("invalid json format - missing left brace"))
	}
	jsonStr = jsonStr[indexOfLeftBrace:]

	indexOfRightBrace := strings.LastIndex(jsonStr, "}")
	if indexOfRightBrace <= 0 {
		panic(errors.New("invalid json format - missing right brace"))
	}
	jsonStr = jsonStr[:indexOfRightBrace+1]

	report := &TestResponseT{}
	comm.FromJsonP(jsonStr, false, report)
	return report
}
