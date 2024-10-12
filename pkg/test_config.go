package batchai

import "fmt"

type TestConfigT struct {
	AppConfig AppConfig
	ModelId   string       `mapstructure:"model_id"`
	Prompt    ReviewPrompt `mapstructure:"prompt"`
}

type TestConfig = *TestConfigT

func (me TestConfig) Init(config AppConfig) {
	me.AppConfig = config

	model := config.LoadModel(me.ModelId)

	if me.Prompt == nil {
		if model.ReviewPrompt == nil {
			panic(fmt.Errorf("missing test prompt for model: %s", me.ModelId))
		}
		me.Prompt = model.ReviewPrompt
	} else {
		me.Prompt.Init(config)
	}
}

func (me TestConfig) RenderPrompt(codeToTest string, codeFile string) string {
	vars := NewReviewPromptVariables().
		WithPath(codeFile).
		WithLang(me.AppConfig.Lang).
		WithCodeToReview(codeToTest)
	return me.Prompt.Generate(vars)
}
