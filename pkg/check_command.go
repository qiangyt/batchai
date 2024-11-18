package batchai

import (
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type CheckCommandT struct {
	BaseModelCommandT
	reportManager CheckReportManager
}

type CheckCommand = *CheckCommandT

func NewCheckCommand(x Kontext) CheckCommand {
	return &CheckCommandT{
		BaseModelCommandT: *NewBaseModelCommand(x),
		reportManager:     NewCheckReportManager(),
	}
}

func (me CheckCommand) launchCheckAgents(x Kontext, checkArgs CheckArgs, targetFiles []string, metrics CheckMetrics) {
	// launch check agents and wait for them
	wg := &sync.WaitGroup{}
	resultChan := make(chan CheckResult, len(targetFiles))

	for _, f := range targetFiles {
		metrics.Processed++

		agent := NewCheckAgent(me.reportManager, me.codeFileManager, me.symbolManager, me.modelService, f)
		agent.Run(x, checkArgs, resultChan, wg)
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

			if report.HasIssue {
				metrics.HasIssue++
				metrics.TotalIssue += len(report.Issues)
			}
		}
	}
}

func (me CheckCommand) Check(x Kontext, checkArgs CheckArgs) {
	metrics := NewCheckMetrics()
	c := comm.NewConsole(x.Args.Concurrent == 1)

	targetFiles, _, _, repoFiles := me.listCommand.CollectWorkingFiles(x, c)
	if len(targetFiles) > 0 {
		if x.Args.EnableSymbolReference {
			me.launchSymbolAgents(x, repoFiles)
		}
		me.launchCheckAgents(x, checkArgs, targetFiles, metrics)
	}

	// c.NewLine()
	// metrics.Print(✔ c)
}
