package batchai

import (
	"fmt"
	"strings"

	"github.com/qiangyt/batchai/comm"
)

type TestPromptVariablesT struct {
	Data map[string]any
}

type TestPromptVariables = *TestPromptVariablesT

func NewTestPromptVariables() TestPromptVariables {
	return &TestPromptVariablesT{Data: map[string]any{
		"test_format": TEST_REPORT_JSON_FORMAT,
	}}
}

func (me TestPromptVariables) WithCodeToTest(codeToTest string) TestPromptVariables {
	me.Data["code_to_test"] = codeToTest
	return me
}

func (me TestPromptVariables) WithLang(lang string) TestPromptVariables {
	me.Data["lang"] = lang
	return me
}

func (me TestPromptVariables) WithPath(path string) TestPromptVariables {
	me.Data["path"] = path
	return me
}

func (me TestPromptVariables) WithFrameworks(frameworks []string) TestPromptVariables {
	me.Data["frameworks"] = frameworks
	return me
}

// TODO: test coverage
// TODO: example

type TestPromptT struct {
	Rules    []string `mapstructure:"rules"`
	Template string   `mapstructure:"template"`
}

type TestPrompt = *TestPromptT

func (me TestPrompt) Init(config AppConfig) {
	me.Rules = comm.StringArrayTrimSpace(me.Rules)
	for i, rule := range me.Rules {
		me.Rules[i] = fmt.Sprintf("%d) %s.", i, rule)
	}

	me.Template = strings.TrimSpace(me.Template)
}

func (me TestPrompt) Generate(vars TestPromptVariables) string {
	data := vars.Data

	rules := comm.RenderAsTemplateArrayP(me.Rules, data)
	if len(rules) > 0 {
		data["test_rules"] = strings.Join(rules, "\n")
	}

	return comm.RenderAsTemplateP(me.Template, data)
}
