package batchai

import (
	"fmt"
	"strings"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm"
)

type TestPromptVariablesT struct {
	Data map[string]any
}

type TestPromptVariables = *TestPromptVariablesT

const (
	TEST_FILE_BEGIN      = "!!!!test_file_begin!!!!"
	TEST_FILE_BEGIN_LINE = TEST_FILE_BEGIN + "\n"
	TEST_FILE_END        = "!!!!test_file_end!!!!"
	TEST_FILE_END_LINE   = /*"\n" + */ TEST_FILE_END
)

func NewTestPromptVariables() TestPromptVariables {
	return &TestPromptVariablesT{Data: map[string]any{
		"fix_begin": TEST_FILE_BEGIN,
		"fix_end":   TEST_FILE_END,
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

func (me TestPrompt) Generate(variables TestPromptVariables) string {
	data := variables.Data

	rules := comm.RenderAsTemplateArrayP(me.Rules, data)
	if len(rules) > 0 {
		data["test_rules"] = strings.Join(rules, "\n")
	}

	return comm.RenderAsTemplateP(me.Template, data)
}

func ExtractTestFile(input string) (string, string) {
	begin := strings.Index(input, TEST_FILE_BEGIN_LINE)
	if begin < 0 {
		return "", input
	}
	block := input[begin+len(TEST_FILE_BEGIN_LINE):]

	end := strings.LastIndex(block, TEST_FILE_END_LINE)
	if end <= 0 {
		panic(errors.New("unmatched separator tag"))
	}
	result := block[:end]

	if strings.HasPrefix(strings.TrimSpace(result), "```") {
		result, _ = comm.ExtractMarkdownCodeBlocksP(result)
	}

	remained := input[:begin] + block[end+len(TEST_FILE_END_LINE):]
	return result, remained
}
