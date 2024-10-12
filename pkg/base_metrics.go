package batchai

import (
	"time"

	"github.com/qiangyt/batchai/comm"
)

type BaseMetricsT struct {
	ModelUsageMetricsT

	Files     int
	Processed int
	Succeeded int
	Ignored   int
	Failed    int
	Skipped   int
}

type BaseMetrics = *BaseMetricsT

func NewBaseMetrics() BaseMetrics {
	return &BaseMetricsT{
		ModelUsageMetricsT: *NewModelUsageMetrics(),
	}
}

func (me BaseMetrics) PreparePrint(console comm.Console) {
	me.ModelUsageMetricsT.Print(console, comm.GREEN)

	if me.Processed == 0 {
		console.NewLine().Green("Average time: 0")
	} else {
		console.NewLine().Greenf("Average time: %v", me.Duration/time.Duration(me.Processed))
	}

	console.NewLine()
}
