package batchai

import (
	"fmt"

	"github.com/urfave/cli/v2"
)

type TestArgsT struct {
	Framework bool
}

type TestArgs = *TestArgsT

func (me TestArgs) WithCliContext(x Kontext, cliContext *cli.Context) error {
	me.Framework = cliContext.Bool("framework")
	return nil
}

func TestUrfaveCommand(x Kontext) *cli.Command {
	return &cli.Command{
		Name:  "test",
		Usage: fmt.Sprintf("Generate unit test code"),
		Flags: []cli.Flag{
			&cli.StringFlag{Name: "framework", Usage: "the test framework to use, by default it will be detected automatically"},
		},
		Action: TestFunc(x),
	}
}

func TestFunc(x Kontext) func(*cli.Context) error {
	return func(cliContext *cli.Context) error {
		a := &AppArgsT{}
		if err := a.WithCliContext(x, cliContext); err != nil {
			return err
		}
		x.Args = a

		ra := &TestArgsT{}
		if err := ra.WithCliContext(x, cliContext); err != nil {
			return err
		}

		NewTestCommand(x).Test(x, ra)

		return nil
	}
}
