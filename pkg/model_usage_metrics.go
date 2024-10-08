package batchai

import (
	"time"

	"github.com/openai/openai-go"
	"github.com/qiangyt/batchai/comm"
)

type ModelUsageMetricsT struct {
	Duration              time.Duration
	EvaluatedPromptTokens int
	OpenAiUsage           *openai.CompletionUsage
}

type ModelUsageMetrics = *ModelUsageMetricsT

func NewModelUsageMetrics() ModelUsageMetrics {
	return &ModelUsageMetricsT{
		OpenAiUsage: &openai.CompletionUsage{},
	}
}

func (me ModelUsageMetrics) IncreaseUsage(usage ModelUsageMetrics) {
	if usage == nil {
		return
	}

	totalUsage := me.OpenAiUsage
	newUsage := usage.OpenAiUsage

	totalUsage.CompletionTokens += newUsage.CompletionTokens
	totalUsage.PromptTokens += newUsage.PromptTokens
	totalUsage.TotalTokens += newUsage.TotalTokens

	me.EvaluatedPromptTokens += usage.EvaluatedPromptTokens
	me.Duration += usage.Duration
}

func (me ModelUsageMetrics) Print(console comm.Console, color comm.Color) {
	console.NewLine().Colorf(color, "Duration: %v", comm.FormatDurationForConsole(me.Duration))
	console.NewLine().Colorf(color, "Evaluated prompt tokens: %v", me.EvaluatedPromptTokens)

	if usage := me.OpenAiUsage; usage != nil {
		console.NewLine().Colorf(color, "OpenAI prompt tokens: %v", usage.PromptTokens)
		console.NewLine().Colorf(color, "OpenAI completion tokens: %v", usage.CompletionTokens)
		console.NewLine().Colorf(color, "OpenAI total tokens: %v", usage.TotalTokens)
	}
}
