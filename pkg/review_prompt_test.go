package batchai

import (
	"testing"
)

// TestNewReviewPromptVariables tests the NewReviewPromptVariables function.
func TestNewReviewPromptVariables(t *testing.T) {
	variables := NewReviewPromptVariables()

	// Check if the Data map is initialized correctly.
	if variables.Data["fix_begin"] != FIX_BEGIN {
		t.Errorf("Expected fix_begin to be %s, got %s", FIX_BEGIN, variables.Data["fix_begin"])
	}
	if variables.Data["fix_end"] != FIX_END {
		t.Errorf("Expected fix_end to be %s, got %s", FIX_END, variables.Data["fix_end"])
	}
}

// TestWithSeverity tests the WithSeverity method.
func TestWithSeverity(t *testing.T) {
	variables := NewReviewPromptVariables()

	// Test with a specific severity level.
	variables = variables.WithSeverity("critical")
	if variables.Data["severity"] != "critical" {
		t.Errorf("Expected severity to be critical, got %s", variables.Data["severity"])
	}

	// Test with an empty severity, should default to "minor".
	variables = variables.WithSeverity("")
	if variables.Data["severity"] != "minor" {
		t.Errorf("Expected severity to be minor, got %s", variables.Data["severity"])
	}
}

// TestWithCodeToReview tests the WithCodeToReview method.
func TestWithCodeToReview(t *testing.T) {
	variables := NewReviewPromptVariables()
	code := "package main\nfunc main() {}"
	variables = variables.WithCodeToReview(code)

	// Check if the code_to_review is set correctly.
	if variables.Data["code_to_review"] != code {
		t.Errorf("Expected code_to_review to be %s, got %s", code, variables.Data["code_to_review"])
	}
}

// TestWithLang tests the WithLang method.
func TestWithLang(t *testing.T) {
	variables := NewReviewPromptVariables()
	lang := "go"
	variables = variables.WithLang(lang)

	// Check if the lang is set correctly.
	if variables.Data["lang"] != lang {
		t.Errorf("Expected lang to be %s, got %s", lang, variables.Data["lang"])
	}
}

// TestWithPath tests the WithPath method.
func TestWithPath(t *testing.T) {
	variables := NewReviewPromptVariables()
	path := "/path/to/code"
	variables = variables.WithPath(path)

	// Check if the path is set correctly.
	if variables.Data["path"] != path {
		t.Errorf("Expected path to be %s, got %s", path, variables.Data["path"])
	}
}

// TestInit tests the Init method of ReviewPrompt.
func TestInit(t *testing.T) {
	prompt := &ReviewPromptT{
		Rules:    []string{"Rule 1", "Rule 2"},
		Template: "Template text",
	}
	
	// Initialize the prompt.
	prompt.Init(AppConfig{})

	// Check if the rules are formatted correctly.
	if prompt.Rules[0] != "0) Rule 1." {
		t.Errorf("Expected first rule to be formatted correctly, got %s", prompt.Rules[0])
	}
	if prompt.Rules[1] != "1) Rule 2." {
		t.Errorf("Expected second rule to be formatted correctly, got %s", prompt.Rules[1])
	}

	// Check if the template is trimmed.
	if prompt.Template != "Template text" {
		t.Errorf("Expected template to be trimmed, got %s", prompt.Template)
	}
}

// TestGenerate tests the Generate method of ReviewPrompt.
func TestGenerate(t *testing.T) {
	variables := NewReviewPromptVariables()
	variables = variables.WithSeverity("high").WithCodeToReview("code").WithLang("go").WithPath("/path")

	prompt := &ReviewPromptT{
		Rules:    []string{"Rule 1", "Rule 2"},
		Template: "Review Rules: {{.review_rules}}\nSeverity: {{.severity}}",
	}
	
	// Generate the output string.
	output := prompt.Generate(variables)

	// Check if the output contains the expected severity.
	if !strings.Contains(output, "Severity: high") {
		t.Errorf("Expected output to contain severity high, got %s", output)
	}
	
	// Check if the output contains the review rules.
	if !strings.Contains(output, "Review Rules:") {
		t.Errorf("Expected output to contain review rules, got %s", output)
	}
}
