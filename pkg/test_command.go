package batchai

import (
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type TestCommandT struct {
	BaseModelCommandT
}

type TestCommand = *TestCommandT

func NewTestCommand(x Kontext) TestCommand {
	return &TestCommandT{
		BaseModelCommandT: *NewBaseModelCommand(x),
	}
}

func (me TestCommand) launchTestAgents(x Kontext, testArgs TestArgs, targetFiles []string, metrics TestMetrics) {
	// launch test agents and wait for them
	wg := &sync.WaitGroup{}
	resultChan := make(chan TestResult, len(targetFiles))

	for _, f := range targetFiles {
		metrics.Processed++

		agent := NewTestAgent(me.codeFileManager, me.symbolManager, me.modelService, f)
		agent.Run(x, testArgs, resultChan, wg)
	}

	wg.Wait()
	close(resultChan)

	for r := range resultChan {
		if r.Failed {
			metrics.Failed++
		} else if r.Skipped {
			metrics.Skipped++
		} else {
			metrics.Succeeded++

			report := r.Report
			metrics.ModelUsageMetricsT.IncreaseUsage(report.ModelUsageMetrics)

			metrics.TotalTestCases += report.TestCases
		}
	}
}

func (me TestCommand) Test(x Kontext, testArgs TestArgs) {
	metrics := NewTestMetrics()
	c := comm.NewConsole()

	targetFiles, _, _, repoFiles := me.listCommand.CollectWorkingFiles(x, c)
	if len(targetFiles) > 0 {
		if x.Args.EnableSymbolCollection {
			me.launchSymbolAgents(x, repoFiles)
		}
		me.launchTestAgents(x, testArgs, targetFiles, metrics)
	}

	// c.NewLine()
	// metrics.Print(c)
}
