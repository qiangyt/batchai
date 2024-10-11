package batchai

type BaseAgentT struct {
	modelService ModelService
	memory       ChatMemory
}

type BaseAgent = *BaseAgentT

func newBaseAgent(modelService ModelService) BaseAgentT {
	return BaseAgentT{
		modelService: modelService,
		memory:       NewChatMemory(),
	}
}
