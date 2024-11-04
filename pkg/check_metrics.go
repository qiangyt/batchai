package batchai

import (
	"github.com/qiangyt/batchai/comm"
)

type CheckMetricsT struct {
	BaseMetricsT

	HasIssue   int
	TotalIssue int
}

type CheckMetrics = *CheckMetricsT

func NewCheckMetrics() CheckMetrics {
	return &CheckMetricsT{
		BaseMetricsT: *NewBaseMetrics(),
	}
}

func (me CheckMetrics) Print(console comm.Console) {
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
