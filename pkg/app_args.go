package batchai

import (
	"fmt"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm"
	"github.com/urfave/cli/v2"
)

type AppArgsT struct {
	EnableSymbolReference  bool
	Verbose                bool
	Lang                   string
	TargetPaths            []string
	Repository             string
	Force                  bool
	NumberOfFilesToProcess int
	Concurrent             int
}

type AppArgs = *AppArgsT

func (me AppArgs) WithCliContext(x Kontext, cliContext *cli.Context) error {
	me.EnableSymbolReference = cliContext.IsSet("enable-symbol-reference")
	me.Force = cliContext.IsSet("force")
	me.Verbose = cliContext.IsSet("verbose")
	me.Lang = cliContext.String("lang")
	me.NumberOfFilesToProcess = cliContext.Int("num")
	me.Concurrent = cliContext.Int("concurrent")

	if len(me.Lang) > 0 {
		x.Config.Lang = me.Lang
	}

	if !cliContext.Args().Present() {
		return errors.New("please specifies the repository directory")
	}

	repoAndFiles := cliContext.Args().Slice()

	workDir := comm.WorkingDirectoryP()
	me.Repository = comm.AbsPathWithP(repoAndFiles[0], workDir)
	if !comm.IsGitInited(x.Fs, me.Repository) {
		return fmt.Errorf("%s is NOT a git repository directory", me.Repository)
	}

	me.TargetPaths = []string{}
	if len(repoAndFiles) > 1 {
		for _, f := range repoAndFiles[1:] {
			p := comm.AbsPathWithP(f, workDir)
			if err := comm.EnsurePathExists(x.Fs, p); err != nil {
				return err
			}
			me.TargetPaths = append(me.TargetPaths, p)
		}
	}

	return nil
}
