package batchai

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/tiktoken-go/tokenizer"
)

type ModelServiceT struct {
	clients map[string]ModelClient
	codec   tokenizer.Codec
}

type ModelService = *ModelServiceT

func NewModelService(config AppConfig) ModelService {
	clients := map[string]ModelClient{}
	for _, m := range config.Models {
		clients[m.Id] = buildModelClient(config, m.Id)
	}

	codec, err := tokenizer.Get(tokenizer.Cl100kBase)
	if err != nil {
		panic(errors.Wrap(err, "failed to initialize Cl100kBase tokenizer codec"))
	}

	return &ModelServiceT{
		clients: clients,
		codec:   codec,
	}
}

func (me ModelService) Encode(msg string) ([]uint, []string) {
	tokens, texts, err := me.codec.Encode(msg)
	if err != nil {
		panic(errors.Wrap(err, "failed to encode text"))
	}
	return tokens, texts
}

func (me ModelService) Decode(tokens []uint) string {
	text, err := me.codec.Decode(tokens)
	if err != nil {
		panic(errors.Wrap(err, "failed to decode tokens"))
	}
	return text
}

func (me ModelService) Chat(x Kontext, modelId string, memory ChatMemory) (string, ModelUsageMetrics) {
	metrics := NewModelUsageMetrics()

	modelClient, exists := me.clients[modelId]
	if !exists {
		panic(fmt.Errorf("client for model ID %s not found", modelId))
	}

	if modelClient.config.TikTokenEnabled {
		promptTokens, _ := me.Encode(memory.Format())

		metrics.EvaluatedPromptTokens = len(promptTokens)

		ctxWindow := modelClient.config.ContextWindow
		if metrics.EvaluatedPromptTokens >= ctxWindow {
			panic(fmt.Errorf("evaluated token count %d exceeds the maximum limit of %d",
				metrics.EvaluatedPromptTokens, ctxWindow))
		}
	}

	chatCompletion, duration := modelClient.Chat(x, memory)

	metrics.Duration = duration
	metrics.OpenAiUsage = &chatCompletion.Usage

	return chatCompletion.Choices[0].Message.Content, metrics
}
