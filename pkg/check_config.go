package batchai

import (
	"fmt"
)

type CheckConfigT struct {
	AppConfig AppConfig
	ModelId   string      `mapstructure:"model_id"`
	Severity  string      `mapstructure:"severity"`
	Prompt    CheckPrompt `mapstructure:"prompt"`
}

type CheckConfig = *CheckConfigT

func (me CheckConfig) Init(config AppConfig) {
	me.AppConfig = config

	model := config.LoadModel(me.ModelId)

	if me.Prompt == nil {
		if model.CheckPrompt == nil {
			panic(fmt.Errorf("missing code check prompt for model: %s", me.ModelId))
		}
		me.Prompt = model.CheckPrompt
	} else {
		me.Prompt.Init(config)
	}
}

func (me CheckConfig) RenderPrompt(codeToCheck string, codeFile string) string {
	vars := NewCheckPromptVariables().
		WithSeverity(me.Severity).
		WithPath(codeFile).
		WithLang(me.AppConfig.Lang).
		WithCodeToCheck(codeToCheck)
	return me.Prompt.Generate(vars)
}
