package batchai

import (
	"time"
)

type ModelConfigT struct {
	Id                      string        `mapstructure:"id,omitempty"`
	Name                    string        `mapstructure:"name,omitempty"`
	Temperature             float64       `mapstructure:"temperature,omitempty"`
	MaxCompletionTokens     int64         `mapstructure:"max_completion_tokens"`
	ContextWindow           int           `mapstructure:"context_window"`
	TikTokenEnabled         bool          `mapstructure:"tik_token_enabled"`
	ApiKey                  string        `mapstructure:"api_key"`
	BaseUrl                 string        `mapstructure:"base_url"`
	Timeout                 time.Duration `mapstructure:"timeout,omitempty" default:"10s"`
	ProxyUrl                string        `mapstructure:"proxy_url,omitempty"`
	ProxyUser               string        `mapstructure:"proxy_user,omitempty"`
	ProxyPass               string        `mapstructure:"proxy_pass,omitempty"`
	ProxyInsecureSkipVerify bool          `mapstructure:"proxy_insecure_skip_verify" default:"false"`
	CheckPrompt             CheckPrompt   `mapstructure:"check_prompt"`
	TestPrompt              TestPrompt    `mapstructure:"test_prompt"`
}

type ModelConfig = *ModelConfigT

func (me ModelConfig) Init(config AppConfig) {
	if me.CheckPrompt != nil {
		me.CheckPrompt.Init(config)
	}
}
