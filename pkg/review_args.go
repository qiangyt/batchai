package batchai

import (
	"fmt"
	"strings"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm"
	"github.com/urfave/cli/v2"
)

type ReviewArgsT struct {
	Fix bool
}

type ReviewArgs = *ReviewArgsT

func (me ReviewArgs) WithCliContext(x Kontext, cliContext *cli.Context) error {
	me.Fix = cliContext.Bool("fix")
	return nil
}

func ReviewFunc(x Kontext) func(*cli.Context) error {
	return func(cliContext *cli.Context) error {
		a := &AppArgsT{}
		if err := a.WithCliContext(x, cliContext); err != nil {
			return err
		}
		x.Args = a

		ra := &ReviewArgsT{}
		if err := ra.WithCliContext(x, cliContext); err != nil {
			return err
		}

		if ra.Fix {
			unstagedFiles, err := comm.GetUnstagedFiles(x.Fs, a.Repository)
			if err != nil {
				return errors.Wrap(err, "failed to check unstaged files")
			}
			if len(unstagedFiles) > 0 {
				return fmt.Errorf("please stage your local changes before fix.\nunstaged files: \n%s", strings.Join(unstagedFiles, "\n"))
			}
		}

		NewReviewCommand(x).Review(x, ra)

		return nil
	}
}
