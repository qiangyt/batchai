package batchai

import (
	"fmt"
	"strings"

	"github.com/qiangyt/batchai/comm"
)

type SymbolAwareAgentT struct {
	BaseAgentT

	symbolManager SymbolManager
}

type SymbolAwareAgent = *SymbolAwareAgentT

func newSymbolAwareAgent(symbolManager SymbolManager,
	modelService ModelService,
) SymbolAwareAgentT {
	return SymbolAwareAgentT{
		BaseAgentT:    newBaseAgent(modelService),
		symbolManager: symbolManager,
	}
}

func (me SymbolAwareAgent) provideSymbols(x Kontext, c comm.Console, file string) ModelUsageMetrics {
	verbose := x.Args.Verbose
	mem := me.memory

	msg1 := `
1) list all referred non-standard symbols and all symbols which is missing and not defined or initialized in current file, includes: type, class,traits, enum, const, constant, literal, variable, interface, property, field, attributes, method, function;
2) return a json array of simple name of symbols, e.g. ["symbol1", "symbol2"]; 
3) output full-qualified symbol name excluding package name or module name
4) exclude any other words excepts the json array
5) if no symbol to check, return an empty array []
`
	mem.AddUserMessage(msg1)
	if verbose {
		c.NewLine().Gray("chat: ").Default(msg1)
	}

	modelId := x.Config.Check.ModelId
	answer, metrics := me.modelService.Chat(x, modelId, mem, nil)
	if verbose {
		c.NewLine().Gray("answer: ").Default(answer)
	}
	jsonAnswer, _ := comm.ExtractMarkdownJsonBlocksP(answer)

	symbolNames := []string{}
	comm.FromJsonP(jsonAnswer, false, &symbolNames)
	if len(symbolNames) == 0 {
		return metrics
	}
	symbolNames = comm.RemovePackageNames(symbolNames)

	symbols := me.symbolManager.Lookup(x, symbolNames, file)
	if verbose {
		c.NewLine().Default("search symbols: ").Defaultf("%v", symbols)
	}
	if len(symbols) == 0 {
		return metrics
	}

	symbolDetails := []string{}
	for _, s := range symbols {
		symbolDetails = append(symbolDetails, fmt.Sprintf("The symbol %s is defined and initialized in other files, %s. Must use this definition while checking and do not report anything related to it as an issue. See: %s", s.Name, s.Path, s.Lines))
	}
	msg2 := strings.Join(symbolDetails, "\n")
	mem.AddUserMessage(msg2)
	if verbose {
		c.NewLine().Gray("chat: ").Default(msg2)
	}

	// TODO：merge metrics
	answer, metrics = me.modelService.Chat(x, modelId, mem, nil)
	if verbose {
		c.NewLine().Gray("answer: ").Default(answer)
	}

	return metrics
}
