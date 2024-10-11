package batchai

import (
	"path"
	"strings"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type ReviewCommandT struct {
	modelService    ModelService
	reportManager   ReviewReportManager
	codeFileManager CodeFileManager
	symbolManager   SymbolManager
}

type ReviewCommand = *ReviewCommandT

func NewReviewCommand(modelService ModelService) ReviewCommand {
	return &ReviewCommandT{
		modelService:    modelService,
		reportManager:   NewReviewReportManager(),
		codeFileManager: NewCodeFileManager(),
		symbolManager:   NewSymbolManager(),
	}
}

func (me ReviewCommand) List(x Kontext) {
	c := comm.NewConsole()

	targetFiles, _, _, _ := me.CollectWorkingFiles(x, c)
	for _, f := range targetFiles {
		c.Println(f)
	}
}

// launch symbol agents and wait for them
func (me ReviewCommand) launchSymbolAgents(x Kontext, repoFiles []string) {
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

func (me ReviewCommand) launchReviewAgents(x Kontext, reviewArgs ReviewArgs, targetFiles []string, metrics ReviewMetrics) {
	// launch review agents and wait for them
	wg := &sync.WaitGroup{}
	resultChan := make(chan ReviewResult, len(targetFiles))

	for _, f := range targetFiles {
		metrics.Processed++

		agent := NewReviewAgent(me.reportManager, me.codeFileManager, me.symbolManager, me.modelService, f)
		agent.Run(x, reviewArgs, resultChan, wg)
	}

	wg.Wait()
	close(resultChan)

	for r := range resultChan {
		if r.Failed {
			metrics.Failed++
		} else if r.Skipped {
			metrics.Skipped++
		} else {
			metrics.Succeeded++

			report := r.Report
			metrics.ModelUsageMetricsT.IncreaseUsage(report.ModelUsageMetrics)

			if report.HasIssue {
				metrics.HasIssue++
				metrics.TotalIssue += len(report.Issues)
			}
		}
	}
}

func (me ReviewCommand) Review(x Kontext, reviewArgs ReviewArgs) {
	metrics := NewReviewMetrics()
	c := comm.NewConsole()

	targetFiles, _, _, repoFiles := me.CollectWorkingFiles(x, c)
	if len(targetFiles) > 0 {
		if x.Args.EnableSymbolCollection {
			me.launchSymbolAgents(x, repoFiles)
		}
		me.launchReviewAgents(x, reviewArgs, targetFiles, metrics)
	}

	// c.NewLine()
	// metrics.Print(c)
}

func (me ReviewCommand) CollectWorkingFiles(x Kontext, c comm.Console) ([]string, int, int, []string) {
	var targetFiles []string

	repoFiles, ignored, failed := me.CollectFiles(x, c, x.Args.Repository)

	if len(x.Args.TargetPaths) > 0 {
		targetFiles, ignored, failed = me.CollectTargetFiles(x, c)
	} else {
		targetFiles = repoFiles
	}

	return targetFiles, ignored, failed, repoFiles
}

func (me ReviewCommand) CollectTargetFiles(x Kontext, c comm.Console) ([]string, int, int) {
	ignored := 0
	failed := 0

	r := []string{}
	for _, p := range x.Args.TargetPaths {
		// replace := false
		// if len(gitDir) == 0 {
		// 	replace = x.ReviewArgs.Fix && x.ReviewArgs.Force
		// } else {
		// 	replace = x.ReviewArgs.Fix && (x.ReviewArgs.Force || comm.IsGitInited(x.Fs, gitDir))
		// }
		if !strings.HasPrefix(p, x.Args.Repository) {
			c.NewLine().Yellow("ignored: ").Default(p)
			continue
		}

		if comm.IsDirP(x.Fs, p) {
			candidates, ignored_, failed_ := me.CollectFiles(x, c, p)
			r = append(r, candidates...)
			ignored += ignored_
			failed += failed_
		} else {
			r = append(r, p)
		}
	}

	return r, ignored, failed
}

func (me ReviewCommand) CollectFiles(x Kontext, c comm.Console, dirPath string) ([]string, int, int) {
	fs := x.Fs

	exclude := x.Config.GetExclude()
	exclude = comm.CompileMatchFile(fs, exclude, path.Join(dirPath, ".gitignore"))
	exclude = comm.CompileMatchFile(fs, exclude, path.Join(dirPath, ".batchai_ignore"))

	ignored := 0
	failed := 0
	candidates := []string{}

	comm.WalkDir(fs,
		[]string{".gitignore", ".batchai_ignore"},
		dirPath,
		x.Config.GetInclude(),
		exclude,
		func(codeFile string) {
			candidates = append(candidates, codeFile)
		},
		func(codeFile string) {
			ignored++
			if x.Args.Verbose {
				c.NewLine().Gray("ignored: ").Default(codeFile)
			}
		},
		func(codeFile string, err error) {
			failed++
			c.NewLine().Red("error: ").Defaultf("%s, %+v", codeFile, err)
		})

	return candidates, ignored, failed
}
