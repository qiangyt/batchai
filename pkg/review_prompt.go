package batchai

import (
	"fmt"
	"strings"

	"github.com/qiangyt/batchai/comm"
)

type ReviewPromptVariablesT struct {
	Data map[string]any
}

type ReviewPromptVariables = *ReviewPromptVariablesT

const (
	FIX_BEGIN      = "!!!!fix_begin!!!!"
	FIX_BEGIN_LINE = FIX_BEGIN + "\n"
	FIX_END        = "!!!!fix_end!!!!"
	FIX_END_LINE   = /*"\n" + */ FIX_END
)

func NewReviewPromptVariables() ReviewPromptVariables {
	return &ReviewPromptVariablesT{Data: map[string]any{
		"fix_begin":                 FIX_BEGIN,
		"fix_end":                   FIX_END,
		"review_report_json_format": REVIEW_REPORT_JSON_FORMAT,
	}}
}

func (me ReviewPromptVariables) WithSeverity(severity string) ReviewPromptVariables {
	if len(severity) == 0 {
		severity = "minor"
	}
	me.Data["severity"] = severity
	return me
}

func (me ReviewPromptVariables) WithCodeToReview(codeToReview string) ReviewPromptVariables {
	me.Data["code_to_review"] = codeToReview
	return me
}

func (me ReviewPromptVariables) WithLang(lang string) ReviewPromptVariables {
	me.Data["lang"] = lang
	return me
}

func (me ReviewPromptVariables) WithPath(path string) ReviewPromptVariables {
	me.Data["path"] = path
	return me
}

type ReviewPromptT struct {
	Rules    []string `mapstructure:"rules"`
	Template string   `mapstructure:"template"`
}

type ReviewPrompt = *ReviewPromptT

func (me ReviewPrompt) Init(config AppConfig) {
	me.Rules = comm.StringArrayTrimSpace(me.Rules)
	for i, rule := range me.Rules {
		me.Rules[i] = fmt.Sprintf("%d) %s.", i, rule)
	}

	me.Template = strings.TrimSpace(me.Template)
}

func (me ReviewPrompt) Generate(vars ReviewPromptVariables) string {
	data := vars.Data

	rules := comm.RenderAsTemplateArrayP(me.Rules, data)
	if len(rules) > 0 {
		data["review_rules"] = strings.Join(rules, "\n")
	}

	return comm.RenderAsTemplateP(me.Template, data)
}
