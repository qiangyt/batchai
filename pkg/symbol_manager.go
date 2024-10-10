package batchai

import (
	"fmt"
	"path"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

const SYMBOL_JSON_FORMAT = `
{
	"name": name of this symbol,
	"lines": "content of lines that defines or initialize this symbol; don't include body of methods or functions"
}
`

type SymbolT struct {
	Name  string `json:"name"`
	Path  string `json:"path"`
	Lines string `json:"lines"`
}

type Symbol = *SymbolT

func (me Symbol) IsSame(that Symbol) bool {
	return me.Name == that.Name &&
		me.Path == that.Path &&
		me.Lines == that.Lines
}

type SymbolManagerT struct {
	symbolsByName map[string][]Symbol
	symbolsByFile map[string][]Symbol
	lock          sync.RWMutex
}

type SymbolManager = *SymbolManagerT

func NewSymbolManager() SymbolManager {
	return &SymbolManagerT{
		symbolsByName: map[string][]Symbol{},
		symbolsByFile: map[string][]Symbol{},
	}
}

func (me SymbolManager) Lookup(x Kontext, symbolNames []string, excludedFile string) []Symbol {
	me.lock.RLock()
	defer me.lock.RUnlock()

	r := []Symbol{}
	for _, s := range symbolNames {
		if matchedSymbols, has := me.symbolsByName[s]; has {
			for _, matchedSymbol := range matchedSymbols {
				if matchedSymbol.Path != excludedFile {
					r = append(r, matchedSymbol)
				}
			}
		}
	}

	return r
}

func (me SymbolManager) Load(x Kontext, file string) []Symbol {
	me.lock.Lock()
	defer me.lock.Unlock()

	r, _ := me.symbolsByFile[file]
	if r != nil {
		return r
	}

	fs := x.Fs

	symbolFile := ResolveSymbolFile(x.Config.CacheDir, x.ReviewArgs.Repository, file)
	if !comm.FileExistsP(fs, symbolFile) {
		return nil
	}

	r = []Symbol{}
	comm.FromJsonFileP(x.Fs, symbolFile, false, &r)
	me.symbolsByFile[file] = r

	// verify the symbols
	for _, s := range r {
		name := s.Name
		if file != s.Path {
			panic(fmt.Errorf("expect symbol.Path is %s but got %s", s.Path, file))
		}

		if existings, has := me.symbolsByName[name]; has {
			for _, existing := range existings {
				if !s.IsSame(existing) {
					me.symbolsByName[name] = append(existings, s)
				}
			}
		} else {
			me.symbolsByName[name] = []Symbol{s}
		}
	}

	return r
}

func (me SymbolManager) LoadAll(x Kontext, files []string) {
	for _, f := range files {
		me.Load(x, f)
	}
}

func (me SymbolManager) Save(x Kontext, file string, symbols []Symbol) {
	me.lock.Lock()
	defer me.lock.Unlock()

	me.symbolsByFile[file] = symbols

	for _, s := range symbols {
		name := s.Name
		if file != s.Path {
			panic(fmt.Errorf("expect symbol.Path is %s but got %s", s.Path, file))
		}

		if existings, has := me.symbolsByName[name]; has {
			for _, existing := range existings {
				if !s.IsSame(existing) {
					me.symbolsByName[name] = append(existings, s)
				}
			}
		} else {
			me.symbolsByName[name] = []Symbol{s}
		}
	}

	symbolFile := ResolveSymbolFile(x.Config.CacheDir, x.ReviewArgs.Repository, file)
	symbolText := comm.ToJsonP(symbols, true)

	comm.MkdirP(x.Fs, path.Dir(symbolFile))
	comm.WriteFileTextP(x.Fs, symbolFile, symbolText)
}

func ResolveSymbolFile(cacheDir string, repository string, file string) string {
	// the file is relative to working directory, so take the relative path
	relativePath := file[len(repository):]
	repoName := path.Base(repository)
	return path.Join(cacheDir, repoName, relativePath+".symbol.json")
}
