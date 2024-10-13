package batchai

import (
	"testing"
	"strings"

	"github.com/stretchr/testify/require"
)

// TestNewReviewPromptVariables tests the NewReviewPromptVariables function.
func TestNewReviewPromptVariables(t *testing.T) {
	vars := NewReviewPromptVariables()
	require.Equal(t, FIX_BEGIN, vars.Data["fix_begin"], "Expected fix_begin to be %s, got %s", FIX_BEGIN, vars.Data["fix_begin"])
	require.Equal(t, FIX_END, vars.Data["fix_end"], "Expected fix_end to be %s, got %s", FIX_END, vars.Data["fix_end"])
}

// TestWithSeverity tests the WithSeverity method with various inputs.
func TestWithSeverity(t *testing.T) {
	vars := NewReviewPromptVariables()

	// Happy path: setting severity to 'high'
	vars = vars.WithSeverity("high")
	require.Equal(t, "high", vars.Data["severity"], "Expected severity to be 'high', got %s", vars.Data["severity"])

	// Positive case: setting severity to 'minor' (default)
	vars = vars.WithSeverity("")
	require.Equal(t, "minor", vars.Data["severity"], "Expected severity to be 'minor', got %s", vars.Data["severity"])

	// Negative case: setting severity to a long string
	longSeverity := strings.Repeat("a", 100)
	vars = vars.WithSeverity(longSeverity)
	require.Equal(t, longSeverity, vars.Data["severity"], "Expected severity to be '%s', got %s", longSeverity, vars.Data["severity"])

	// Corner case: setting severity to a string with special characters
	specialSeverity := "!@#$%^&*()"
	vars = vars.WithSeverity(specialSeverity)
	require.Equal(t, specialSeverity, vars.Data["severity"], "Expected severity to be '%s', got %s", specialSeverity, vars.Data["severity"])
}

// TestWithCodeToReview tests the WithCodeToReview method.
func TestWithCodeToReview(t *testing.T) {
	vars := NewReviewPromptVariables()
	code := "print('Hello, World!')"
	vars = vars.WithCodeToReview(code)
	require.Equal(t, code, vars.Data["code_to_review"], "Expected code_to_review to be '%s', got '%s'", code, vars.Data["code_to_review"])

	// Negative case: setting code to an empty string
	vars = vars.WithCodeToReview("")
	require.Equal(t, "", vars.Data["code_to_review"], "Expected code_to_review to be '', got '%s'", vars.Data["code_to_review"])

	// Corner case: setting code to a very long string
	longCode := strings.Repeat("a", 1000)
	vars = vars.WithCodeToReview(longCode)
	require.Equal(t, longCode, vars.Data["code_to_review"], "Expected code_to_review to be '%s', got '%s'", longCode, vars.Data["code_to_review"])
}

// TestWithLang tests the WithLang method.
func TestWithLang(t *testing.T) {
	vars := NewReviewPromptVariables()
	lang := "python"
	vars = vars.WithLang(lang)
	require.Equal(t, lang, vars.Data["lang"], "Expected lang to be '%s', got '%s'", lang, vars.Data["lang"])

	// Negative case: setting lang to an empty string
	vars = vars.WithLang("")
	require.Equal(t, "", vars.Data["lang"], "Expected lang to be '', got '%s'", vars.Data["lang"])

	// Corner case: setting lang to a very long string
	longLang := strings.Repeat("a", 100)
	vars = vars.WithLang(longLang)
	require.Equal(t, longLang, vars.Data["lang"], "Expected lang to be '%s', got '%s'", longLang, vars.Data["lang"])
}

// TestWithPath tests the WithPath method.
func TestWithPath(t *testing.T) {
	vars := NewReviewPromptVariables()
	path := "/path/to/code"
	vars = vars.WithPath(path)
	require.Equal(t, path, vars.Data["path"], "Expected path to be '%s', got '%s'", path, vars.Data["path"])

	// Negative case: setting path to an empty string
	vars = vars.WithPath("")
	require.Equal(t, "", vars.Data["path"], "Expected path to be '', got '%s'", vars.Data["path"])

	// Corner case: setting path to a very long string
	longPath := strings.Repeat("/a", 100)
	vars = vars.WithPath(longPath)
	require.Equal(t, longPath, vars.Data["path"], "Expected path to be '%s', got '%s'", longPath, vars.Data["path"])
}

// TestInit tests the Init method of ReviewPrompt.
func TestInit(t *testing.T) {
	prompt := ReviewPrompt{Rules: []string{"Rule 1", "Rule 2"}, Template: "Template"}
	config := AppConfig{} // Assuming AppConfig is defined elsewhere
	prompt.Init(config)

	require.Equal(t, 2, len(prompt.Rules), "Expected 2 rules, got %d", len(prompt.Rules))
	require.Equal(t, "0) Rule 1.", prompt.Rules[0], "Expected first rule to be '0) Rule 1.', got '%s'", prompt.Rules[0])
	require.Equal(t, "Template", prompt.Template, "Expected template to be 'Template', got '%s'", prompt.Template)
}

// TestGenerate tests the Generate method of ReviewPrompt.
func TestGenerate(t *testing.T) {
	vars := NewReviewPromptVariables().WithSeverity("high").WithCodeToReview("code").WithLang("go").WithPath("/path")
	prompt := ReviewPrompt{Rules: []string{"Rule 1", "Rule 2"}, Template: "{{.fix_begin}}\n{{.review_rules}}\n{{.fix_end}}"}
	result := prompt.Generate(vars)

	require.Contains(t, result, FIX_BEGIN, "Expected result to contain FIX_BEGIN")
	require.Contains(t, result, FIX_END, "Expected result to contain FIX_END")
	require.Contains(t, result, "0) Rule 1.", "Expected result to contain '0) Rule 1.'")
}

// TestGenerateEmptyRules tests Generate with empty rules.
func TestGenerateEmptyRules(t *testing.T) {
	vars := NewReviewPromptVariables()
	prompt := ReviewPrompt{Rules: []string{}, Template: "{{.fix_begin}}\n{{.fix_end}}"}
	result := prompt.Generate(vars)

	require.Contains(t, result, FIX_BEGIN, "Expected result to contain FIX_BEGIN")
	require.Contains(t, result, FIX_END, "Expected result to contain FIX_END")
	require.NotContains(t, result, "0) Rule 1.", "Expected result to NOT contain '0) Rule 1.'")
}

// TestGenerateWithEmptyTemplate tests Generate with an empty template.
func TestGenerateWithEmptyTemplate(t *testing.T) {
	vars := NewReviewPromptVariables().WithSeverity("high").WithCodeToReview("code").WithLang("go").WithPath("/path")
	prompt := ReviewPrompt{Rules: []string{"Rule 1", "Rule 2"}, Template: ""}
	result := prompt.Generate(vars)

	require.Empty(t, result, "Expected result to be empty, got '%s'", result)
}

// TestGenerateWithNilVariables tests Generate with nil variables.
func TestGenerateWithNilVariables(t *testing.T) {
	prompt := ReviewPrompt{Rules: []string{"Rule 1", "Rule 2"}, Template: "{{.fix_begin}}\n{{.fix_end}}"}
	result := prompt.Generate(nil)

	require.Empty(t, result, "Expected result to be empty, got '%s'", result)
}
