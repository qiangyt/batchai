package batchai

import (
	"time"

	"github.com/qiangyt/batchai/comm"
)

type ReviewMetricsT struct {
	ModelUsageMetricsT

	Files      int
	Processed  int
	Succeeded  int
	Ignored    int
	Failed     int
	HasIssue   int
	TotalIssue int
	Skipped    int
}

type ReviewMetrics = *ReviewMetricsT

func NewReviewMetrics() ReviewMetrics {
	return &ReviewMetricsT{
		ModelUsageMetricsT: *NewModelUsageMetrics(),
	}
}

func (me ReviewMetrics) Print(console comm.Console) {
	me.ModelUsageMetricsT.Print(console, comm.GREEN)

	if me.Processed == 0 {
		console.NewLine().Green("Average time: 0")
	} else {
		console.NewLine().Greenf("Average time: %v", me.Duration/time.Duration(me.Processed))
	}

	console.NewLine()
	console.NewLine().Greenf("Files: %d, Processed: %d, Ignored: %d, Failed: %d, Has Issued: %d, Total Issues: %d, Skipped: %d",
		me.Files,
		me.Processed,
		me.Ignored,
		me.Failed,
		me.HasIssue,
		me.TotalIssue,
		me.Skipped,
	)
}
