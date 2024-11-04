package batchai

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNewCheckPromptVariables(t *testing.T) {
	// Test the creation of new CheckPromptVariables
	vars := NewCheckPromptVariables()
	require.NotNil(t, vars)
	require.NotNil(t, vars.Data)
	require.Equal(t, vars.Data["fix_begin"], FIX_BEGIN)
	require.Equal(t, vars.Data["fix_end"], FIX_END)
}

func TestWithSeverity(t *testing.T) {
	// Test WithSeverity method with a valid severity
	vars := NewCheckPromptVariables().WithSeverity("critical")
	require.Equal(t, vars.Data["severity"], "critical")

	// Test WithSeverity method with an empty severity
	vars = NewCheckPromptVariables().WithSeverity("")
	require.Equal(t, vars.Data["severity"], "minor") // Default value
}

func TestWithSeverityInvalid(t *testing.T) {
	// Test WithSeverity method with a non-empty invalid severity
	vars := NewCheckPromptVariables().WithSeverity("unknown")
	require.Equal(t, vars.Data["severity"], "unknown")
}

func TestWithCodeToCheck(t *testing.T) {
	// Test WithCodeToCheck method
	code := "fmt.Println(\"Hello, World!\")"
	vars := NewCheckPromptVariables().WithCodeToCheck(code)
	require.Equal(t, vars.Data["code_to_check"], code)
}

func TestWithLang(t *testing.T) {
	// Test WithLang method
	vars := NewCheckPromptVariables().WithLang("go")
	require.Equal(t, vars.Data["lang"], "go")
}

func TestWithPath(t *testing.T) {
	// Test WithPath method
	path := "/data/batchai/batchai/pkg/check_prompt.go"
	vars := NewCheckPromptVariables().WithPath(path)
	require.Equal(t, vars.Data["path"], path)
}

func TestCheckPromptInit(t *testing.T) {
	// Test Init method of CheckPrompt
	prompt := &CheckPromptT{
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
	prompt := &CheckPromptT{
		Rules:    []string{"Rule 1", "Rule 2"},
		Template: "Check Rules:\n{{.check_rules}}",
	}
	vars := NewCheckPromptVariables()
	vars.Data["check_rules"] = "Rule 1\nRule 2"
	result := prompt.Generate(vars)
	require.Contains(t, result, "Check Rules:")
	require.Contains(t, result, "Rule 1")
	require.Contains(t, result, "Rule 2")
}

func TestGenerateWithoutRules(t *testing.T) {
	// Test Generate method without rules
	prompt := &CheckPromptT{
		Rules:    []string{},
		Template: "No rules to display.",
	}
	vars := NewCheckPromptVariables()
	result := prompt.Generate(vars)
	require.Equal(t, result, "No rules to display.")
}

func TestGenerateWithEmptyTemplate(t *testing.T) {
	// Test Generate method with an empty template
	prompt := &CheckPromptT{
		Rules:    []string{"Rule 1"},
		Template: "",
	}
	vars := NewCheckPromptVariables()
	result := prompt.Generate(vars)
	require.Empty(t, result) // Expecting empty result since template is empty
}

func TestGenerateWithNilVariables(t *testing.T) {
	// Test Generate method with nil variables
	prompt := &CheckPromptT{
		Rules:    []string{"Rule 1"},
		Template: "Template with {{.non_existent}}",
	}
	vars := NewCheckPromptVariables()
	vars.Data = nil // Simulating nil data
	result := prompt.Generate(vars)
	require.NotNil(t, result) // Expecting non-nil result even if data is nil
}

func TestGenerateWithMissingTemplateVariable(t *testing.T) {
	// Test Generate method with a missing template variable
	prompt := &CheckPromptT{
		Rules:    []string{"Rule 1"},
		Template: "Template with {{.missing_variable}}",
	}
	vars := NewCheckPromptVariables()
	result := prompt.Generate(vars)
	require.Contains(t, result, "Template with ")
}

func TestGenerateWithWhitespaceTemplate(t *testing.T) {
	// Test Generate method with a template that has only whitespace
	prompt := &CheckPromptT{
		Rules:    []string{"Rule 1"},
		Template: "   ",
	}
	vars := NewCheckPromptVariables()
	result := prompt.Generate(vars)
	require.Empty(t, result) // Expecting empty result since template is whitespace
}
