package batchai

type JavaTestMemoryT struct {
	ChatMemoryT
}

type JavaTestMemory = *JavaTestMemoryT

func NewJavaTestMemory() JavaTestMemory {
	return &JavaTestMemoryT{
		ChatMemoryT: *NewChatMemory(),
	}
}
