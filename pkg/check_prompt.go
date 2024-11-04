package batchai

import (
	"fmt"
	"strings"

	"github.com/qiangyt/batchai/comm"
)

type CheckPromptVariablesT struct {
	Data map[string]any
}

type CheckPromptVariables = *CheckPromptVariablesT

const (
	FIX_BEGIN      = "!!!!fix_begin!!!!"
	FIX_BEGIN_LINE = FIX_BEGIN + "\n"
	FIX_END        = "!!!!fix_end!!!!"
	FIX_END_LINE   = /*"\n" + */ FIX_END
)

func NewCheckPromptVariables() CheckPromptVariables {
	return &CheckPromptVariablesT{Data: map[string]any{
		"fix_begin":                FIX_BEGIN,
		"fix_end":                  FIX_END,
		"check_report_json_format": CHECK_REPORT_JSON_FORMAT,
	}}
}

func (me CheckPromptVariables) WithSeverity(severity string) CheckPromptVariables {
	if len(severity) == 0 {
		severity = "minor"
	}
	me.Data["severity"] = severity
	return me
}

func (me CheckPromptVariables) WithCodeToCheck(codeToCheck string) CheckPromptVariables {
	me.Data["code_to_check"] = codeToCheck
	return me
}

func (me CheckPromptVariables) WithLang(lang string) CheckPromptVariables {
	me.Data["lang"] = lang
	return me
}

func (me CheckPromptVariables) WithPath(path string) CheckPromptVariables {
	me.Data["path"] = path
	return me
}

type CheckPromptT struct {
	Rules    []string `mapstructure:"rules"`
	Template string   `mapstructure:"template"`
}

type CheckPrompt = *CheckPromptT

func (me CheckPrompt) Init(config AppConfig) {
	me.Rules = comm.StringArrayTrimSpace(me.Rules)
	for i, rule := range me.Rules {
		me.Rules[i] = fmt.Sprintf("%d) %s.", i, rule)
	}

	me.Template = strings.TrimSpace(me.Template)
}

func (me CheckPrompt) Generate(vars CheckPromptVariables) string {
	data := vars.Data

	rules := comm.RenderAsTemplateArrayP(me.Rules, data)
	if len(rules) > 0 {
		data["check_rules"] = strings.Join(rules, "\n")
	}

	return comm.RenderAsTemplateP(me.Template, data)
}
