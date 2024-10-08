package batchai

import (
	"fmt"
	"strings"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm"
	"github.com/urfave/cli/v2"
)

type ReviewArgsT struct {
	AppArgsT

	Fix   bool
	Force bool
}

type ReviewArgs = *ReviewArgsT

func (me ReviewArgs) WithCliContext(x Kontext, cliContext *cli.Context) error {
	if err := me.AppArgsT.WithCliContext(x, cliContext); err != nil {
		return err
	}

	me.Fix = cliContext.Bool("fix")
	me.Force = cliContext.Bool("force")

	return nil
}

func ReviewOrListFunc(x Kontext, list bool) func(*cli.Context) error {
	modelService := NewModelService(x.Config)
	reviewService := NewReviewService(modelService)

	return func(cliContext *cli.Context) error {
		a := &ReviewArgsT{}
		if err := a.WithCliContext(x, cliContext); err != nil {
			return err
		}

		if a.Fix {
			unstagedFiles, err := comm.GetUnstagedFiles(x.Fs, a.Repository)
			if err != nil {
				return errors.Wrap(err, "failed to check unstaged files")
			}
			if len(unstagedFiles) > 0 {
				return fmt.Errorf("please stage your local changes before fix.\nunstaged files: %s", strings.Join(unstagedFiles, "\n"))
			}
		}

		if len(a.Lang) > 0 {
			x.Config.Lang = a.Lang
		}

		x.ReviewArgs = a

		if list {
			reviewService.List(x)
		} else {
			reviewService.Review(x)
		}

		return nil
	}
}
