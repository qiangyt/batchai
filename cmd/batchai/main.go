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

	review := &cli.Command{
		Name:  "review",
		Usage: fmt.Sprintf("Report issues to console, also saved to '%s'", os.Getenv("BATCHAI_CACHE_DIR")),
		Flags: []cli.Flag{
			&cli.BoolFlag{Name: "fix", Aliases: []string{"f"}, DefaultText: "false", Usage: "Replaces the target files"},
			&cli.BoolFlag{Name: "force", DefaultText: "false", Usage: "Ignores the cache"},
		},
		Action: batchai.ReviewOrListFunc(x, false),
	}

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

	list := &cli.Command{
		Name:  "list",
		Usage: "Lists files to process",
		Args:  true,
	}

	app := &cli.App{
		Version:                fmt.Sprintf("%s\ncommit id: %s", Version, CommitId),
		UseShortOptionHandling: true,
		Commands:               []*cli.Command{review, list, explain, comment, refactor},
		Name:                   "batchai",
		Usage:                  "uses AI to batch processing project files",
		Flags: []cli.Flag{
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
	c.Defaultln()
}
