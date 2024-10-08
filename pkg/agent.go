package batchai

type AgentT struct {
	modelService ModelService
	memory       ChatMemory
}

type Agent = *AgentT

func newAgent(modelService ModelService) AgentT {
	return AgentT{
		modelService: modelService,
		memory:       NewChatMemory(),
	}
}
