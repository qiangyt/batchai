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

const (
	TEST_BEGIN      = "!!!!test_begin!!!!"
	TEST_BEGIN_LINE = TEST_BEGIN + "\n"
	TEST_END        = "!!!!test_end!!!!"
	TEST_END_LINE   = /*"\n" + */ TEST_END + "\n"
)

func NewTestPromptVariables() TestPromptVariables {
	return &TestPromptVariablesT{Data: map[string]any{
		"test_begin":  TEST_BEGIN,
		"test_end":    TEST_END,
		"test_format": TEST_REPORT_JSON_FORMAT,
	}}
}

func (me TestPromptVariables) WithExistingTestCode(existingTestCode string) TestPromptVariables {
	me.Data["existing_test_code"] = existingTestCode
	return me
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

func (me TestPromptVariables) WithLibraries(libraries []string) TestPromptVariables {
	me.Data["libraries"] = libraries
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
		me.Rules[i] = fmt.Sprintf("## %s\n", rule)
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
