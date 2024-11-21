package batchai

import (
	"strings"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type CheckResultT struct {
	Report  CheckReport
	Skipped bool
	Failed  bool
}

type CheckResult = *CheckResultT

type CheckAgentT struct {
	SymbolAwareAgentT

	reportManager CheckReportManager
	////codeFileManager CodeFileManager

	file         string
	relativeFile string
}

type CheckAgent = *CheckAgentT

func NewCheckAgent(reportManager CheckReportManager,
	//codeFileManager CodeFileManager,
	symbolManager SymbolManager,
	modelService ModelService,
	codeFile string,
) CheckAgent {
	return &CheckAgentT{
		SymbolAwareAgentT: newSymbolAwareAgent(symbolManager, modelService),
		//codeFileManager:   codeFileManager,
		reportManager: reportManager,

		file: codeFile,
	}
}

func (me CheckAgent) run(x Kontext, checkArgs CheckArgs, resultChan chan<- CheckResult) {
	c := comm.NewConsole(!x.Args.Concurrent)
	me.relativeFile = me.file[len(x.Args.Repository)+1:]

	c.Greenf("\n\n▹▹▹▹▹ processing: %s\n", me.relativeFile)
	c.Begin()
	defer c.End()

	defer func() {
		if e := recover(); e != nil {
			c.NewLine().Red("failed: ").Defaultf("%v, %+v", me.relativeFile, e)
			resultChan <- &CheckResultT{Failed: true}
		}
	}()

	result := me.checkFile(x, checkArgs, c)

	resultChan <- result
}

func (me CheckAgent) Run(x Kontext, checkArgs CheckArgs, resultChan chan<- CheckResult, wg *sync.WaitGroup) {
	if !x.Args.Concurrent {
		me.run(x, checkArgs, resultChan)
		return
	}

	wg.Add(1)

	go func() {
		defer wg.Done()

		me.run(x, checkArgs, resultChan)
	}()
}

func (me CheckAgent) checkFile(x Kontext, checkArgs CheckArgs, c comm.Console) CheckResult {
	c.NewLine().Green("--------------------")
	c.NewLine().Greenln(me.relativeFile)

	newCode := comm.ReadFileCodeP(x.Fs, me.file)

	lastReport := me.reportManager.LoadReport(x, me.file)
	if lastReport != nil {
		noCodeChanges := (newCode == lastReport.OriginalCode)
		if noCodeChanges {
			if !x.Args.Force {
				if !checkArgs.Fix || (newCode == lastReport.FixedCode) {
					c.NewLine().Default("✔ no code changes since last execution, skipped")
					return &CheckResultT{Report: lastReport, Skipped: true}
				}
			}
		}
	}

	newReport := me.checkCode(x, c, newCode)
	newReport.Print(c)

	if newReport.HasIssue {
		if checkArgs.Fix {
			// replace the original code file with checked code
			comm.WriteFileTextP(x.Fs, me.file, newReport.FixedCode)
		}
	}

	reportFile := me.reportManager.SaveReport(x, me.file, newReport)
	c.NewLine().Blue("✔ report: ").Default(reportFile[len(x.Args.Repository)+1:])

	return &CheckResultT{Report: newReport, Skipped: false}
}

type FixCodeWriterT struct {
	console   comm.Console
	inFixCode bool
}

type FixCodeWriter = *FixCodeWriterT

func NewFixCodeWriter(console comm.Console) FixCodeWriter {
	return &FixCodeWriterT{
		console:   console,
		inFixCode: false,
	}
}

// Write method to implement io.Writer
func (me FixCodeWriter) Write(p []byte) (n int, err error) {
	s := string(p)

	if me.inFixCode {
		if strings.Contains(s, FIX_END) {
			me.inFixCode = false
		} else {
			me.console.Default(s)
		}
	} else {
		if strings.Contains(s, FIX_BEGIN) {
			me.inFixCode = true
		}
	}

	return len(p), nil
}

func (me CheckAgent) checkCode(x Kontext, c comm.Console, code string) CheckReport {
	verbose := x.Args.Verbose

	sysPrompt := x.Config.Check.RenderPrompt(code, me.relativeFile)
	mem := me.memory
	mem.AddSystemMessage(sysPrompt)

	if x.Args.EnableSymbolReference {
		// TODO: merge metrics
		me.provideSymbols(x, c, me.file)
		mem.AddUserMessage("check the code, with provided symbols as references")
	} else {
		mem.AddUserMessage("check the code")
	}
	if verbose {
		c.NewLine().Gray("chat: ").Default("check the code")
	}

	answer, metrics := me.modelService.Chat(x, x.Config.Check.ModelId, mem, NewFixCodeWriter(c))
	if verbose {
		c.NewLine().Gray("answer: ").Default(mem.Format())
	}

	fixedCode, remainedAnswer := ExtractFixedCode(answer)
	fixedCode = comm.NormalizeCode(fixedCode)

	r := ExtractCheckReport(remainedAnswer, strings.HasSuffix(me.relativeFile, ".go"))
	r.ModelUsageMetrics = metrics
	r.FixedCode = fixedCode
	r.OriginalCode = code
	r.Path = me.relativeFile

	if !r.HasIssue {
		r.Issues = []CheckIssue{}
		r.FixedCode = code
		r.OverallSeverity = ""
	} else {
		if fixedCode == code || len(fixedCode) == 0 {
			r.HasIssue = false
			r.Issues = []CheckIssue{}
			r.FixedCode = code
			r.OverallSeverity = ""
		}
	}

	return r
}
