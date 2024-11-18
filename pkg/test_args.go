package batchai

import (
	"github.com/urfave/cli/v2"
)

type TestArgsT struct {
	Libraries []string
	Update    bool
}

type TestArgs = *TestArgsT

func (me TestArgs) WithCliContext(x Kontext, cliContext *cli.Context) error {
	me.Libraries = cliContext.StringSlice("library")
	me.Update = cliContext.Bool("update")
	return nil
}

func TestUrfaveCommand(x Kontext) *cli.Command {
	return &cli.Command{
		Name:  "test",
		Usage: "Generate unit test code",
		Flags: []cli.Flag{
			&cli.StringSliceFlag{Name: "library", Usage: "the test library to use, by default it will be detected automatically", DefaultText: "auto"},
			&cli.BoolFlag{Name: "update", Usage: "update previously generated test code, if available"},
		},
		Action: TestFunc(x),
	}
}

func TestFunc(x Kontext) func(*cli.Context) error {
	return func(cliContext *cli.Context) error {
		x.Config.Init("test")

		a := &AppArgsT{}
		if err := a.WithCliContext(x, cliContext); err != nil {
			return err
		}
		x.Args = a

		ta := &TestArgsT{}
		if err := ta.WithCliContext(x, cliContext); err != nil {
			return err
		}

		NewTestCommand(x).Test(x, ta)

		return nil
	}
}
