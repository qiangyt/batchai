package batchai

import "fmt"

type TestConfigT struct {
	AppConfig AppConfig
	ModelId   string     `mapstructure:"model_id"`
	Prompt    TestPrompt `mapstructure:"prompt"`
}

type TestConfig = *TestConfigT

func (me TestConfig) Init(config AppConfig) {
	me.AppConfig = config

	model := config.LoadModel(me.ModelId)

	if me.Prompt == nil {
		if model.ReviewPrompt == nil {
			panic(fmt.Errorf("missing test prompt for model: %s", me.ModelId))
		}
		me.Prompt = model.TestPrompt
	} else {
		me.Prompt.Init(config)
	}
}

func (me TestConfig) RenderPrompt(libraries []string, codeToTest string, codeFile string, exstingTestCode string) string {
	vars := NewTestPromptVariables().
		WithCodeToTest(codeToTest).
		WithLang(me.AppConfig.Lang).
		WithPath(codeFile).
		WithLibraries(libraries).
		WithExistingTestCode(exstingTestCode)
	return me.Prompt.Generate(vars)
}
