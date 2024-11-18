package batchai

import (
	"strings"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm"
)

const TEST_REPORT_JSON_FORMAT = `
{
  "test_file_path": "",
  "amount_of_generated_test_cases": 0,
  "single_test_run_command": ""
}`

type TestReportT struct {
	Path              string `json:"path"`
	ModelUsageMetrics ModelUsageMetrics

	TestFilePath               string `json:"test_file_path"`
	TestCode                   string `json:"test_code"`
	AmountOfGeneratedTestCases int    `json:"amount_of_generated_test_cases"`
	SingleTestRunCommand       string `json:"single_test_run_command"`
}

type TestReport = *TestReportT

func (me TestReport) Print(console comm.Console) {
	me.ModelUsageMetrics.Print(console, comm.DEFAULT_COLOR)

	console.NewLine().Printf("Code Path: %s", me.Path)
	console.NewLine().Printf("Test File Path: %s", me.TestFilePath)
	console.NewLine().Printf("Amoutn of Generated Test Cases: %d", me.AmountOfGeneratedTestCases)
	console.NewLine().Printf("Test Code: %s", me.TestCode)
	console.NewLine().Printf("Test Command: %s", me.SingleTestRunCommand)
}

func ExtractTestReport(answer string, isGolang bool) (TestReport, string) {
	jsonStr, remained := comm.ExtractMarkdownJsonBlocksP(answer)

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

	report := &TestReportT{}
	if err := comm.FromJson(jsonStr, false, report); err != nil {
		jsonStr = comm.FixJson(jsonStr, isGolang)
		comm.FromJsonP(jsonStr, false, report)
	}
	return report, remained
}
