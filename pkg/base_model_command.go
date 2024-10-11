package batchai

import (
	"sync"
)

type BaseModelCommandT struct {
	modelService    ModelService
	listCommand     ListCommand
	codeFileManager CodeFileManager
	symbolManager   SymbolManager
}

type BaseModelCommand = *BaseModelCommandT

func NewBaseModelCommand(x Kontext) BaseModelCommand {
	return &BaseModelCommandT{
		modelService:    NewModelService(x.Config),
		listCommand:     NewListCommand(),
		codeFileManager: NewCodeFileManager(),
		symbolManager:   NewSymbolManager(),
	}
}

// launch symbol agents and wait for them
func (me BaseModelCommand) launchSymbolAgents(x Kontext, repoFiles []string) {
	me.symbolManager.LoadAll(x, repoFiles)

	wg := &sync.WaitGroup{}
	resultChan := make(chan []Symbol, len(repoFiles))

	for _, f := range repoFiles {
		agent := NewSymbolAgent(me.symbolManager, me.codeFileManager, me.modelService, f)
		agent.Run(x, resultChan, wg)
	}

	wg.Wait()
	close(resultChan)
}
