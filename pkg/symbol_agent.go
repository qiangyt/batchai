package batchai

import (
	"strings"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type SymbolAgentT struct {
	BaseAgentT

	file            string
	symbolManager   SymbolManager
	codeFileManager CodeFileManager
}

type SymbolAgent = *SymbolAgentT

func NewSymbolAgent(symbolManager SymbolManager,
	codeFileManager CodeFileManager,
	modelService ModelService,
	file string,
) SymbolAgent {
	return &SymbolAgentT{
		BaseAgentT:      newBaseAgent(modelService),
		file:            file,
		symbolManager:   symbolManager,
		codeFileManager: codeFileManager,
	}
}

func (me SymbolAgent) Run(x Kontext, resultChan chan<- []Symbol, wg *sync.WaitGroup) {
	wg.Add(1)

	go func() {
		defer wg.Done()

		c := comm.NewConsole(!x.Args.Concurrent)

		c.Defaultf("\n\n▹▹▹▹▹ processing symbols: %s\n", me.file)
		c.Begin()
		defer c.End()

		defer func() {
			if e := recover(); e != nil {
				c.NewLine().Red("failed: ").Defaultf("%v, %+v", me.file, e)
				resultChan <- nil
			}
		}()

		symbols := me.collectSymbols(x, c)

		resultChan <- symbols
	}()
}

func (me SymbolAgent) collectSymbols(x Kontext, c comm.Console) []Symbol {
	verbose := x.Args.Verbose
	f := me.file

	code := me.codeFileManager.Load(x, f)
	if !code.IsChanged() {
		cachedSymbols := me.symbolManager.Load(x, f)
		if cachedSymbols != nil {
			if !x.Args.Force {
				return cachedSymbols
			}
		}
	}

	sysPrompt := []string{
		"Working on below code",
		"path: " + f,
		code.Latest,
	}

	mem := me.memory
	mem.AddSystemMessage(strings.Join(sysPrompt, "\n"))
	mem.AddUserMessage("extract any either visible or exposable symbols 1) includes: type, class, enum, const, constant, traits, literal, variable, interface, property, field, attributes, method, function 2) output them following below json format: \n[" + SYMBOL_JSON_FORMAT + "]. 3) don't output any other words except the json array 4) output symbol names with full-qualified names excluding package name or module name")

	if verbose {
		c.NewLine().Gray("chat: ").Default(mem.Format())
	}

	answer, _ := me.modelService.Chat(x, x.Config.Check.ModelId, true, mem, nil)
	if verbose {
		c.NewLine().Gray("answer: ").Default(answer)
	}

	jsonStr, _ := comm.ExtractMarkdownJsonBlocksP(answer)

	r := []Symbol{}
	comm.FromJsonP(jsonStr, false, &r)
	for _, s := range r {
		s.Path = f
		s.Lines = strings.TrimSpace(s.Lines)
	}

	me.symbolManager.Save(x, f, r)
	me.codeFileManager.Save(x, f, code.Latest)

	return r
}
