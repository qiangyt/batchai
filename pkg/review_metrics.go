package batchai

import (
	"github.com/qiangyt/batchai/comm"
)

type ReviewMetricsT struct {
	BaseMetricsT

	HasIssue   int
	TotalIssue int
}

type ReviewMetrics = *ReviewMetricsT

func NewReviewMetrics() ReviewMetrics {
	return &ReviewMetricsT{
		BaseMetricsT: *NewBaseMetrics(),
	}
}

func (me ReviewMetrics) Print(console comm.Console) {
	me.PreparePrint(console)

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
