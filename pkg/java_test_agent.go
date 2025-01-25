package batchai

import (
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type JavaTestAgentT struct {
	BaseAgentT

	mainJavaFile         string
	mainJavaFileRelative string
	testJavaFile         string
	testJavaFileRelative string
}

type JavaTestAgent = *JavaTestAgentT

func NewJavaTestAgent(
	modelService ModelService,
	mainJavaFile string,
) JavaTestAgent {
	return &JavaTestAgentT{
		BaseAgentT:   newBaseAgent(modelService),
		mainJavaFile: mainJavaFile,
	}
}

func (me JavaTestAgent) run(x Kontext, testArgs TestArgs, resultChan chan<- TestResult) {
	c := comm.NewConsole(!x.Args.Concurrent)
	me.mainJavaFileRelative = me.mainJavaFile[len(x.Args.Repository)+1:]

	c.Greenf("\n\n▹▹▹▹▹ processing: %s\n", me.mainJavaFileRelative)
	c.Begin()
	defer c.End()

	defer func() {
		if e := recover(); e != nil {
			c.NewLine().Red("failed: ").Defaultf("%v, %+v", me.mainJavaFileRelative, e)
			resultChan <- &TestResultT{Failed: true}
		}
	}()

	// result := me.generateTest(x, testArgs, c)

	// resultChan <- result
}

func (me JavaTestAgent) Run(x Kontext, testArgs TestArgs, resultChan chan<- TestResult, wg *sync.WaitGroup) {
	if !x.Args.Concurrent {
		me.run(x, testArgs, resultChan)
		return
	}

	wg.Add(1)

	go func() {
		defer wg.Done()

		me.run(x, testArgs, resultChan)
	}()
}
