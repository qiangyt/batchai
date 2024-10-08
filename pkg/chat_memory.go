package batchai

import (
	"strings"

	"github.com/openai/openai-go"
)

type ChatMemoryT struct {
	msgs []ChatMessage
}

type ChatMemory = *ChatMemoryT

func NewChatMemory() ChatMemory {
	return &ChatMemoryT{
		msgs: []ChatMessage{},
	}
}

func (me ChatMemory) AddSystemMessage(content string) ChatMemory {
	me.msgs = append(me.msgs, NewSystemMessage(content))
	return me
}

func (me ChatMemory) AddAssistantMessage(content string) ChatMemory {
	me.msgs = append(me.msgs, NewAssistantMessage(content))
	return me
}

func (me ChatMemory) AddUserMessage(content string) ChatMemory {
	me.msgs = append(me.msgs, NewUserMessage(content))
	return me
}

func (me ChatMemory) ToChatCompletionMessageParamUnion() []openai.ChatCompletionMessageParamUnion {
	r := make([]openai.ChatCompletionMessageParamUnion, len(me.msgs))
	for i, msg := range me.msgs {
		r[i] = msg.ToChatCompletionMessageParamUnion()
	}
	return r
}

func (me ChatMemory) Format() string {
	r := make([]string, len(me.msgs))
	for i, msg := range me.msgs {
		r[i] = msg.Format()
	}
	return strings.Join(r, "\n")
}
