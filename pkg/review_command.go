package batchai

import (
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type ReviewCommandT struct {
	BaseModelCommandT
	reportManager ReviewReportManager
}

type ReviewCommand = *ReviewCommandT

func NewReviewCommand(x Kontext) ReviewCommand {
	return &ReviewCommandT{
		BaseModelCommandT: *NewBaseModelCommand(x),
		reportManager:     NewReviewReportManager(),
	}
}

func (me ReviewCommand) launchReviewAgents(x Kontext, reviewArgs ReviewArgs, targetFiles []string, metrics ReviewMetrics) {
	// launch review agents and wait for them
	wg := &sync.WaitGroup{}
	resultChan := make(chan ReviewResult, len(targetFiles))

	for _, f := range targetFiles {
		metrics.Processed++

		agent := NewReviewAgent(me.reportManager, me.codeFileManager, me.symbolManager, me.modelService, f)
		agent.Run(x, reviewArgs, resultChan, wg)
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

func (me ReviewCommand) Review(x Kontext, reviewArgs ReviewArgs) {
	metrics := NewReviewMetrics()
	c := comm.NewConsole()

	targetFiles, _, _, repoFiles := me.listCommand.CollectWorkingFiles(x, c)
	if len(targetFiles) > 0 {
		if x.Args.EnableSymbolReference {
			me.launchSymbolAgents(x, repoFiles)
		}
		me.launchReviewAgents(x, reviewArgs, targetFiles, metrics)
	}

	// c.NewLine()
	// metrics.Print(✔ c)
}
