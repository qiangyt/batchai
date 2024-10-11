package batchai

import (
	"path"
	"strings"

	"github.com/qiangyt/batchai/comm"
	"github.com/urfave/cli/v2"
)

type ListCommandT struct{}

type ListCommand = *ListCommandT

func NewListCommand() ListCommand {
	return &ListCommandT{}
}

func (me ListCommand) List(x Kontext) {
	c := comm.NewConsole()

	targetFiles, _, _, _ := me.CollectWorkingFiles(x, c)
	for _, f := range targetFiles {
		c.Println(f)
	}
}

func (me ListCommand) CollectWorkingFiles(x Kontext, c comm.Console) ([]string, int, int, []string) {
	var targetFiles []string

	repoFiles, ignored, failed := me.CollectFiles(x, c, x.Args.Repository)

	if len(x.Args.TargetPaths) > 0 {
		targetFiles, ignored, failed = me.CollectTargetFiles(x, c)
	} else {
		targetFiles = repoFiles
	}

	return targetFiles, ignored, failed, repoFiles
}

func (me ListCommand) CollectTargetFiles(x Kontext, c comm.Console) ([]string, int, int) {
	ignored := 0
	failed := 0

	r := []string{}
	for _, p := range x.Args.TargetPaths {
		// replace := false
		// if len(gitDir) == 0 {
		// 	replace = x.ListArgs.Fix && x.ListArgs.Force
		// } else {
		// 	replace = x.ListArgs.Fix && (x.ListArgs.Force || comm.IsGitInited(x.Fs, gitDir))
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

func (me ListCommand) CollectFiles(x Kontext, c comm.Console, dirPath string) ([]string, int, int) {
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

func ListFunc(x Kontext) func(*cli.Context) error {
	return func(cliContext *cli.Context) error {
		a := &AppArgsT{}
		if err := a.WithCliContext(x, cliContext); err != nil {
			return err
		}
		x.Args = a

		NewListCommand().List(x)

		return nil
	}
}

func ListUrfaveCommand(x Kontext) *cli.Command {
	return &cli.Command{
		Name:   "list",
		Usage:  "Lists files to process",
		Args:   true,
		Action: ListFunc(x),
	}
}
