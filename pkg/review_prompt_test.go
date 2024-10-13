package batchai

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewReviewPromptVariables(t *testing.T) {
	// Test the creation of new ReviewPromptVariables
	vars := NewReviewPromptVariables()
	require.NotNil(t, vars)
	require.NotNil(t, vars.Data)
	require.Equal(t, vars.Data["fix_begin"], FIX_BEGIN)
	require.Equal(t, vars.Data["fix_end"], FIX_END)
}

func TestWithSeverity(t *testing.T) {
	// Test WithSeverity method with a valid severity
	vars := NewReviewPromptVariables().WithSeverity("critical")
	require.Equal(t, vars.Data["severity"], "critical")

	// Test WithSeverity method with an empty severity
	vars = NewReviewPromptVariables().WithSeverity("")
	require.Equal(t, vars.Data["severity"], "minor") // Default value
}

func TestWithSeverityInvalid(t *testing.T) {
	// Test WithSeverity method with a non-empty invalid severity
	vars := NewReviewPromptVariables().WithSeverity("unknown")
	require.Equal(t, vars.Data["severity"], "unknown")
}

func TestWithCodeToReview(t *testing.T) {
	// Test WithCodeToReview method
	code := "fmt.Println(\"Hello, World!\")"
	vars := NewReviewPromptVariables().WithCodeToReview(code)
	require.Equal(t, vars.Data["code_to_review"], code)
}

func TestWithLang(t *testing.T) {
	// Test WithLang method
	vars := NewReviewPromptVariables().WithLang("go")
	require.Equal(t, vars.Data["lang"], "go")
}

func TestWithPath(t *testing.T) {
	// Test WithPath method
	path := "/data/batchai/batchai/pkg/review_prompt.go"
	vars := NewReviewPromptVariables().WithPath(path)
	require.Equal(t, vars.Data["path"], path)
}

func TestReviewPromptInit(t *testing.T) {
	// Test Init method of ReviewPrompt
	prompt := &ReviewPromptT{
		Rules:    []string{"Rule 1", "Rule 2"},
		Template: "Template content",
	}
	prompt.Init(&AppConfigT{}) // Assuming AppConfig is a valid type
	require.Equal(t, prompt.Rules[0], "0) Rule 1.")
	require.Equal(t, prompt.Rules[1], "1) Rule 2.")
	require.Equal(t, prompt.Template, "Template content")
}

func TestGenerateWithRules(t *testing.T) {
	// Test Generate method with rules
	prompt := &ReviewPromptT{
		Rules:    []string{"Rule 1", "Rule 2"},
		Template: "Review Rules:\n{{.review_rules}}",
	}
	vars := NewReviewPromptVariables()
	vars.Data["review_rules"] = "Rule 1\nRule 2"
	result := prompt.Generate(vars)
	require.Contains(t, result, "Review Rules:")
	require.Contains(t, result, "Rule 1")
	require.Contains(t, result, "Rule 2")
}

func TestGenerateWithoutRules(t *testing.T) {
	// Test Generate method without rules
	prompt := &ReviewPromptT{
		Rules:    []string{},
		Template: "No rules to display.",
	}
	vars := NewReviewPromptVariables()
	result := prompt.Generate(vars)
	require.Equal(t, result, "No rules to display.")
}

func TestGenerateWithEmptyTemplate(t *testing.T) {
	// Test Generate method with an empty template
	prompt := &ReviewPromptT{
		Rules:    []string{"Rule 1"},
		Template: "",
	}
	vars := NewReviewPromptVariables()
	result := prompt.Generate(vars)
	require.Empty(t, result) // Expecting empty result since template is empty
}

func TestGenerateWithNilVariables(t *testing.T) {
	// Test Generate method with nil variables
	prompt := &ReviewPromptT{
		Rules:    []string{"Rule 1"},
		Template: "Template with {{.non_existent}}",
	}
	vars := NewReviewPromptVariables()
	vars.Data = nil // Simulating nil data
	result := prompt.Generate(vars)
	require.NotNil(t, result) // Expecting non-nil result even if data is nil
}

func TestGenerateWithMissingTemplateVariable(t *testing.T) {
	// Test Generate method with a missing template variable
	prompt := &ReviewPromptT{
		Rules:    []string{"Rule 1"},
		Template: "Template with {{.missing_variable}}",
	}
	vars := NewReviewPromptVariables()
	result := prompt.Generate(vars)
	require.Contains(t, result, "Template with ")
}

func TestGenerateWithWhitespaceTemplate(t *testing.T) {
	// Test Generate method with a template that has only whitespace
	prompt := &ReviewPromptT{
		Rules:    []string{"Rule 1"},
		Template: "   ",
	}
	vars := NewReviewPromptVariables()
	result := prompt.Generate(vars)
	require.Empty(t, result) // Expecting empty result since template is whitespace
}
