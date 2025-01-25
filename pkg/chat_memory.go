package batchai

import (
	"strconv"
	"strings"

	"github.com/openai/openai-go"
	"github.com/qiangyt/batchai/comm"
)

type ChatMemoryT struct {
	msgs *comm.OrderedMap[ChatMessage]
}

type ChatMemory = *ChatMemoryT

func NewChatMemory() ChatMemory {
	return &ChatMemoryT{
		msgs: comm.NewOrderedMap[ChatMessage](nil),
	}
}

func (me ChatMemory) AddSystemMessage(content string) ChatMemory {
	key := strconv.Itoa(me.msgs.Len())
	return me.PutSystemMessage(key, content)
}

func (me ChatMemory) PutSystemMessage(key string, content string) ChatMemory {
	me.msgs.Put(key, NewSystemMessage(content))
	return me
}

func (me ChatMemory) AddAssistantMessage(content string) ChatMemory {
	key := strconv.Itoa(me.msgs.Len())
	return me.PutAssistantMessage(key, content)
}

func (me ChatMemory) PutAssistantMessage(key string, content string) ChatMemory {
	me.msgs.Put(key, NewAssistantMessage(content))
	return me
}

func (me ChatMemory) AddUserMessage(content string) ChatMemory {
	key := strconv.Itoa(me.msgs.Len())
	return me.PutUserMessage(key, content)
}

func (me ChatMemory) PutUserMessage(key string, content string) ChatMemory {
	me.msgs.Put(key, NewUserMessage(content))
	return me
}

func (me ChatMemory) ToChatCompletionMessageParamUnion() []openai.ChatCompletionMessageParamUnion {
	r := make([]openai.ChatCompletionMessageParamUnion, me.msgs.Len())
	for i, msg := range me.msgs.Values() {
		r[i] = msg.ToChatCompletionMessageParamUnion()
	}
	return r
}

func (me ChatMemory) Format() string {
	r := make([]string, me.msgs.Len())
	for i, msg := range me.msgs.Values() {
		r[i] = msg.Format()
	}
	return strings.Join(r, "\n")
}
