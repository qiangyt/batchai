package batchai

import (
	"strings"
	"testing"
)

func TestNewReviewPromptVariables(t *testing.T) {
	variables := NewReviewPromptVariables()
	if variables.Data["fix_begin"] != FIX_BEGIN {
		t.Errorf("Expected fix_begin to be %s, got %s", FIX_BEGIN, variables.Data["fix_begin"])
	}
	if variables.Data["fix_end"] != FIX_END {
		t.Errorf("Expected fix_end to be %s, got %s", FIX_END, variables.Data["fix_end"])
	}
}

func TestWithSeverity(t *testing.T) {
	variables := NewReviewPromptVariables()
	variables = variables.WithSeverity("high")
	if variables.Data["severity"] != "high" {
		t.Errorf("Expected severity to be 'high', got %s", variables.Data["severity"])
	}
}

func TestWithSeverityDefault(t *testing.T) {
	variables := NewReviewPromptVariables()
	variables = variables.WithSeverity("")
	if variables.Data["severity"] != "minor" {
		t.Errorf("Expected severity to be 'minor', got %s", variables.Data["severity"])
	}
}

func TestWithCodeToReview(t *testing.T) {
	variables := NewReviewPromptVariables()
	code := "package main"
	variables = variables.WithCodeToReview(code)
	if variables.Data["code_to_review"] != code {
		t.Errorf("Expected code_to_review to be '%s', got '%s'", code, variables.Data["code_to_review"])
	}
}

func TestWithLang(t *testing.T) {
	variables := NewReviewPromptVariables()
	lang := "go"
	variables = variables.WithLang(lang)
	if variables.Data["lang"] != lang {
		t.Errorf("Expected lang to be '%s', got '%s'", lang, variables.Data["lang"])
	}
}

func TestWithPath(t *testing.T) {
	variables := NewReviewPromptVariables()
	path := "/path/to/review"
	variables = variables.WithPath(path)
	if variables.Data["path"] != path {
		t.Errorf("Expected path to be '%s', got '%s'", path, variables.Data["path"])
	}
}

func TestInit(t *testing.T) {
	prompt := &ReviewPromptT{Rules: []string{"Rule 1", "Rule 2"}, Template: "Template"}
	prompt.Init(&AppConfigT{})
	if len(prompt.Rules) != 2 {
		t.Errorf("Expected 2 rules, got %d", len(prompt.Rules))
	}
	if prompt.Rules[0] != "0) Rule 1." {
		t.Errorf("Expected first rule to be '0) Rule 1.', got '%s'", prompt.Rules[0])
	}
}

func TestGenerate(t *testing.T) {
	variables := NewReviewPromptVariables().WithSeverity("high").WithCodeToReview("package main").WithLang("go")
	prompt := &ReviewPromptT{Rules: []string{"Rule 1", "Rule 2"}, Template: "{{.review_rules}}"}
	result := prompt.Generate(variables)
	if !strings.Contains(result, "0) Rule 1.") {
		t.Errorf("Expected result to contain '0) Rule 1.', got '%s'", result)
	}
}
