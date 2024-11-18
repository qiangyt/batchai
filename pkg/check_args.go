package batchai

import (
	"fmt"
	"os"
	"strings"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm"
	"github.com/urfave/cli/v2"
)

type CheckArgsT struct {
	Fix bool
}

type CheckArgs = *CheckArgsT

func (me CheckArgs) WithCliContext(x Kontext, cliContext *cli.Context) error {
	me.Fix = cliContext.Bool("fix")
	return nil
}

func CheckUrfaveCommand(x Kontext) *cli.Command {
	return &cli.Command{
		Name:  "check",
		Usage: fmt.Sprintf("Scans project codes to check issues. Report is outputed to console and also saved to '%s'", os.Getenv("BATCHAI_CACHE_DIR")),
		Flags: []cli.Flag{
			&cli.BoolFlag{Name: "fix", Aliases: []string{"f"}, DefaultText: "false", Usage: "Replaces the target files"},
		},
		Action: CheckFunc(x),
	}
}

func CheckFunc(x Kontext) func(*cli.Context) error {
	return func(cliContext *cli.Context) error {
		x.Config.Init("check")

		a := &AppArgsT{}
		if err := a.WithCliContext(x, cliContext); err != nil {
			return err
		}
		x.Args = a

		ca := &CheckArgsT{}
		if err := ca.WithCliContext(x, cliContext); err != nil {
			return err
		}

		if ca.Fix {
			unstagedFiles, err := comm.GetUnstagedFiles(x.Fs, a.Repository)
			if err != nil {
				return errors.Wrap(err, "failed to check unstaged files")
			}
			if len(unstagedFiles) > 0 {
				return fmt.Errorf("please stage your local changes before fix.\nunstaged files: \n%s", strings.Join(unstagedFiles, "\n"))
			}
		}

		NewCheckCommand(x).Check(x, ca)

		return nil
	}
}
