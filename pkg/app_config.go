package batchai

import (
	"fmt"
	"path"
	"path/filepath"
	"strings"

	"github.com/qiangyt/batchai/comm"
	"github.com/qiangyt/batchai/res"
	"github.com/spf13/afero"
)

var configConfig = comm.DynamicConfigConfig()

func DefaultConfigDir() string {
	return comm.ExpandHomePathP(filepath.Join("~", "batchai"))
}

func LoadAngineerEnv(fs afero.Fs) {
	batchaiEnvText := res.FromPath("/batchai.env").ReadText()
	batchaiEnvMap, _ := comm.ParseEnv(strings.NewReader(batchaiEnvText))
	comm.LoadEnvMap(batchaiEnvMap, true)

	comm.OverloadEnv(fs)
}

type AppConfigT struct {
	Includes []string      `mapstructure:"includes"`
	Excludes []string      `mapstructure:"excludes"`
	CacheDir string        `mapstructure:"cache_dir"`
	Lang     string        `mapstructure:"lang"`
	Test     TestConfig    `mapstructure:"test"`
	Review   ReviewConfig  `mapstructure:"review"`
	Models   []ModelConfig `mapstructure:"models"`

	include comm.FileMatch
	exclude comm.FileMatch
}

type AppConfig = *AppConfigT

func DefaultConfigMap() map[string]any {
	y := res.FromPath("/batchai.yaml").ReadText()

	r := map[string]any{}
	comm.DecodeWithYamlP(true, y, configConfig, &r, nil)
	return r
}

func ConfigWithYaml(fs afero.Fs) AppConfig {
	devault := DefaultConfigMap()
	r := AppConfigT{}

	p := filepath.Join(DefaultConfigDir(), "batchai.yaml")

	if !comm.FileExistsP(fs, p) {
		comm.DecodeWithMapP(devault, configConfig, &r, devault)
	} else {
		y := comm.ReadFileTextP(fs, p)
		comm.DecodeWithYamlP(true, y, configConfig, &r, devault)
	}

	r.init()

	return &r
}

func (me AppConfig) init() {
	me.include = comm.CompileMatchLines(nil, me.Includes...)
	me.exclude = comm.CompileMatchLines(nil, me.Excludes...)

	workDir := comm.WorkingDirectoryP()
	if len(me.CacheDir) == 0 {
		me.CacheDir = path.Join(workDir, "build", "batchai")
	} else {
		me.CacheDir = comm.AbsPathWithP(me.CacheDir, workDir)
	}

	if me.Test == nil {
		me.Test = &TestConfigT{}
	}
	me.Test.Init(me)

	if me.Review == nil {
		me.Review = &ReviewConfigT{}
	}
	me.Review.Init(me)
}

func (me AppConfig) LoadModel(modelId string) ModelConfig {
	for _, m := range me.Models {
		if modelId == m.Id {
			return m
		}
	}
	panic(fmt.Errorf("model '%s' not configured", modelId))
}

func (me AppConfig) GetInclude() comm.FileMatch {
	return me.include
}

func (me AppConfig) GetExclude() comm.FileMatch {
	return me.exclude
}
