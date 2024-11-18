package comm

import (
	"bufio"
	"io"
	"strings"

	"github.com/pkg/errors"
)

// ReadBytesP ...
func ReadBytesP(reader io.Reader) []byte {
	r, err := ReadBytes(reader)
	if err != nil {
		panic(err)
	}
	return r
}

// ReadBytes ...
func ReadBytes(reader io.Reader) ([]byte, error) {
	r, err := io.ReadAll(reader)
	if err != nil {
		return nil, errors.Wrap(err, "read from Reader")
	}
	return r, nil
}

// ReadText ...
func ReadTextP(reader io.Reader) string {
	r, err := ReadText(reader)
	if err != nil {
		panic(err)
	}
	return r
}

// ReadText ...
func ReadText(reader io.Reader) (string, error) {
	byts, err := io.ReadAll(reader)
	if err != nil {
		return "", errors.Wrap(err, "")
	}
	return string(byts), nil
}

func ReadLines(reader io.Reader) []string {
	r := make([]string, 0, 32)

	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		line := scanner.Text()
		r = append(r, line)
	}

	return r
}

// SplitBufferByLines splits the buffer by lines and returns complete lines.
// It leaves any incomplete line in the buffer.
func SplitBufferByLines(buffer *string) []string {
	lines := []string{}
	parts := strings.Split(*buffer, "\n")

	// Append all complete lines to the result
	for i := 0; i < len(parts)-1; i++ {
		lines = append(lines, parts[i])
	}

	// The last part is incomplete; keep it in the buffer
	*buffer = parts[len(parts)-1]

	return lines
}
