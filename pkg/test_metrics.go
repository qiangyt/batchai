package batchai

import (
	"github.com/qiangyt/batchai/comm"
)

type TestMetricsT struct {
	BaseMetricsT

	TotalTestCases int
}

type TestMetrics = *TestMetricsT

func NewTestMetrics() TestMetrics {
	return &TestMetricsT{
		BaseMetricsT: *NewBaseMetrics(),
	}
}

func (me TestMetrics) Print(console comm.Console) {
	me.PreparePrint(console)

	console.NewLine().Greenf("Files: %d, Processed: %d, Ignored: %d, Failed: %d, Total Test Cases: %d, Skipped: %d",
		me.Files,
		me.Processed,
		me.Ignored,
		me.Failed,
		me.TotalTestCases,
		me.Skipped,
	)
}
