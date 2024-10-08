package comm

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestExtractMarkdownCodeBlocks(t *testing.T) {
	a := require.New(t)

	i1, r1, e1 := ExtractMarkdownCodeBlocks("```java\nABC\n```")
	a.Equal("ABC\n", i1)
	a.Equal("", r1)
	a.Nil(e1)

	i2, r2, e2 := ExtractMarkdownCodeBlocks("prefix```python\nABC\n```suffix")
	a.Equal("ABC\n", i2)
	a.Equal("prefixsuffix", r2)
	a.Nil(e2)

	i4, r4, e4 := ExtractMarkdownCodeBlocks("prefix```go\nABCsuffix")
	a.Equal("", i4)
	a.Equal("prefix```go\nABCsuffix", r4)
	a.NotNil(e4)
}

func TestExtractMarkdownJsonBlocks(t *testing.T) {
	a := require.New(t)

	i1, r1, e1 := ExtractMarkdownJsonBlocks("```json\nABC\n```")
	a.Equal("ABC\n", i1)
	a.Equal("", r1)
	a.Nil(e1)

	i2, r2, e2 := ExtractMarkdownJsonBlocks("prefix```json\nABC\n```suffix")
	a.Equal("ABC\n", i2)
	a.Equal("prefixsuffix", r2)
	a.Nil(e2)

	i3, r3, e3 := ExtractMarkdownJsonBlocks("prefix`bash\nABC\n```suffix")
	a.Equal("prefix`bash\nABC\n```suffix", i3)
	a.Equal("", r3)
	a.Nil(e3)

	i4, r4, e4 := ExtractMarkdownJsonBlocks("prefix```json\nABCsuffix")
	a.Equal("", i4)
	a.Equal("prefix```json\nABCsuffix", r4)
	a.NotNil(e4)

	i5, r5, e5 := ExtractMarkdownJsonBlocks("prefixsuffix")
	a.Equal("prefixsuffix", i5)
	a.Equal("", r5)
	a.Nil(e5)
}
