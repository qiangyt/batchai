package main

import (
	"fmt"
	"os"

	"github.com/qiangyt/batchai/comm"
	batchai "github.com/qiangyt/batchai/pkg"
	cli "github.com/urfave/cli/v2"
)

// go build -ldflags "-X main.Version=x.y.z -X main.CommitId=abcdefg"
var (
	// Version is the version of the compiled software.
	Version string

	// CommitId is the commit id of the compiled software.
	CommitId string
)

func main() {
	fs := comm.AppFs
	batchai.LoadAngineerEnv(fs)

	x := batchai.NewKontext(fs)
	x.Config = batchai.ConfigWithYaml(fs)

	review := batchai.ReviewUrfaveCommand(x)

	explain := &cli.Command{
		Name:  "explain (TODO)",
		Usage: "Explains the code, output result to console or as comment",
		Flags: []cli.Flag{
			&cli.BoolFlag{Name: "inline", Usage: "Explains as code comment", DefaultText: "false"},
		},
		Action: func(ctx *cli.Context) error {
			fmt.Println("to be implemented")
			return nil
		},
	}

	refactor := &cli.Command{
		Name:  "refactor (TODO)",
		Usage: "Refactors the code",
		Action: func(ctx *cli.Context) error {
			fmt.Println("to be implemented")
			return nil
		},
	}

	comment := &cli.Command{
		Name:  "comment (TODO)",
		Usage: "Comments the code",
		Flags: []cli.Flag{
			&cli.BoolFlag{Name: "level", Usage: "Level of detail (detailed, simple)"},
		},
		Action: func(ctx *cli.Context) error {
			fmt.Println("to be implemented")
			return nil
		},
	}

	list := batchai.ListUrfaveCommand(x)
	test := batchai.TestUrfaveCommand(x)

	app := &cli.App{
		Version:                fmt.Sprintf("%s (%s)", Version, CommitId),
		UseShortOptionHandling: true,
		Commands:               []*cli.Command{review, list, test, explain, comment, refactor},
		Name:                   "batchai",
		Usage:                  "utilizes AI for batch processing of project codes",
		Flags: []cli.Flag{
			&cli.BoolFlag{Name: "enable-symbol-reference", Usage: "Enables symbol collection to examine code references across the entire project"},
			&cli.BoolFlag{Name: "force", DefaultText: "false", Usage: "Ignores the cache"},
			&cli.IntFlag{Name: "num", Aliases: []string{"n"}, DefaultText: "0", Usage: "Limits the number of file to process"},
			&cli.BoolFlag{Name: "verbose", Hidden: true},
			&cli.StringFlag{
				Name:        "lang",
				Aliases:     []string{"l"},
				DefaultText: os.Getenv("LANG"),
				Usage:       "language for generated text",
				EnvVars:     []string{"LANG"},
			},
		},
		Args:      true,
		ArgsUsage: "<repository directory>  [target files/directories in the repository]",
	}

	c := comm.NewConsole()
	if err := app.Run(os.Args); err != nil {
		c.Redf("%+v\n", err)
	}
	c.Defaultln(`
                 Thanks for using batchai 🙏
                 Please consider starring to my work: 
               🍷  https://github.com/qiangyt/batchai`)
}
