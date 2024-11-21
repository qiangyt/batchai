package batchai

import (
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type TestCommandT struct {
	BaseModelCommandT
	reportManager TestReportManager
}

type TestCommand = *TestCommandT

func NewTestCommand(x Kontext) TestCommand {
	return &TestCommandT{
		BaseModelCommandT: *NewBaseModelCommand(x),
		reportManager:     NewTestReportManager(),
	}
}

func (me TestCommand) launchTestAgents(x Kontext, testArgs TestArgs, targetFiles []string, metrics TestMetrics) {
	// launch test agents and wait for them
	wg := &sync.WaitGroup{}
	resultChan := make(chan TestResult, len(targetFiles))

	for _, f := range targetFiles {
		metrics.Processed++

		agent := NewTestAgent(me.reportManager, me.symbolManager, me.modelService, f)
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

			metrics.TotalTestCases += report.AmountOfGeneratedTestCases
		}
	}
}

func (me TestCommand) Test(x Kontext, testArgs TestArgs) {
	metrics := NewTestMetrics()
	c := comm.NewConsole(!x.Args.Concurrent)

	c.NewLine().Default("test command uses model ").Yellowf("'%s'\n\n", x.Config.Test.ModelId)

	targetFiles, _, _, repoFiles := me.listCommand.CollectWorkingFiles(x, c)
	if len(targetFiles) > 0 {
		if x.Args.EnableSymbolReference {
			me.launchSymbolAgents(x, repoFiles)
		}
		me.launchTestAgents(x, testArgs, targetFiles, metrics)
	}

	// c.NewLine()
	// metrics.Print(c)
}
