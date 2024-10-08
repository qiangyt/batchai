package batchai

import (
	"fmt"
)

type ReviewConfigT struct {
	AppConfig AppConfig
	Branch    string       `mapstructure:"branch"`
	ModelId   string       `mapstructure:"model_id"`
	Severity  string       `mapstructure:"severity"`
	Prompt    ReviewPrompt `mapstructure:"prompt"`
}

type ReviewConfig = *ReviewConfigT

func (me ReviewConfig) Init(config AppConfig) {
	me.AppConfig = config

	model := config.LoadModel(me.ModelId)

	if me.Prompt == nil {
		if model.ReviewPrompt == nil {
			panic(fmt.Errorf("missing code review prompt for model: %s", me.ModelId))
		}
		me.Prompt = model.ReviewPrompt
	} else {
		me.Prompt.Init(config)
	}
}

func (me ReviewConfig) RenderPrompt(codeToReview string, codeFile string) string {
	vars := NewReviewPromptVariables().
		WithSeverity(me.Severity).
		WithPath(codeFile).
		WithLang(me.AppConfig.Lang).
		WithCodeToReview(codeToReview)
	return me.Prompt.Generate(vars)
}
