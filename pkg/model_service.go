package batchai

import (
	"fmt"
	"io"

	"github.com/qiangyt/batchai/comm"
)

type ModelServiceT struct {
	clients map[string]ModelClient
}

type ModelService = *ModelServiceT

func NewModelService(config AppConfig) ModelService {
	clients := map[string]ModelClient{}
	for _, m := range config.Models {
		clients[m.Id] = buildModelClient(config, m.Id)
	}

	return &ModelServiceT{
		clients: clients,
	}
}

func (me ModelService) loadClient(modelId string) ModelClient {
	r, exists := me.clients[modelId]
	if !exists {
		panic(fmt.Errorf("client for model ID %s not found", modelId))
	}
	return r
}

func (me ModelService) GetContextWindowSize(modelId string) int {
	modelClient := me.loadClient(modelId)
	return int(modelClient.config.ContextWindow)
}

func (me ModelService) Chat(x Kontext, c comm.Console, modelId string, saveIntoMemory bool, memory ChatMemory, writer io.Writer) (string, ModelUsageMetrics) {
	metrics := NewModelUsageMetrics()

	modelClient := me.loadClient(modelId)

	chatCompletion, duration := modelClient.Chat(x, c, saveIntoMemory, memory, writer)

	metrics.Duration = duration
	metrics.OpenAiUsage = &chatCompletion.Usage

	return chatCompletion.Choices[0].Message.Content, metrics
}
