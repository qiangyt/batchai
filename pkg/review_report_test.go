package batchai

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestExtractChangedCode(t *testing.T) {
	a := require.New(t)

	var code string
	var remaining string

	answer := `!!!!fix_begin!!!!
abc
!!!!fix_end!!!!`
	code, remaining = ExtractFixedCode(answer)
	a.Equal("abc\n", code)
	a.Equal("", remaining)

	answer = "!!!!fix_begin!!!!\n" +
		"```java\n" +
		"abc\n" +
		"```\n" +
		"!!!!fix_end!!!!"
	code, remaining = ExtractFixedCode(answer)
	a.Equal("abc\n", code)
	a.Equal("", remaining)

	answer = "```json\ntest\n```\n!!!!fix_begin!!!!\n" +
		"```java\n" +
		"abc\n" +
		"```\n" +
		"!!!!fix_end!!!!"
	code, remaining = ExtractFixedCode(answer)
	a.Equal("abc\n", code)
	a.Equal("```json\ntest\n```\n", remaining)

	// occasionally answered from openai/gpt-4-turbo
	answer = "!!!!fix_begin!!!!\n" +
		"```java\n" +
		"abc\n" +
		"!!!!fix_end!!!!\n" +
		"```\n"
	code, remaining = ExtractFixedCode(answer)
	a.Equal("abc\n", code)
	a.Equal("\n```\n", remaining)
}
