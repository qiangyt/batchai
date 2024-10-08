package batchai

import (
	"github.com/openai/openai-go"
)

type ChatMessageT struct {
	Role    string
	Content string
}

type ChatMessage = *ChatMessageT

func NewSystemMessage(content string) ChatMessage {
	return &ChatMessageT{
		Role:    "system",
		Content: content,
	}
}

func NewUserMessage(content string) ChatMessage {
	return &ChatMessageT{
		Role:    "user",
		Content: content,
	}
}

func NewAssistantMessage(content string) ChatMessage {
	return &ChatMessageT{
		Role:    "assistant",
		Content: content,
	}
}

func (me ChatMessage) ToChatCompletionMessageParamUnion() openai.ChatCompletionMessageParamUnion {
	switch me.Role {
	case "system":
		return openai.SystemMessage(me.Content)
	case "user":
		return openai.UserMessage(me.Content)
	case "assistant":
		return openai.AssistantMessage(me.Content)
	}
	return nil
}

func (me ChatMessage) Format() string {
	return me.Role + ": " + me.Content
}
