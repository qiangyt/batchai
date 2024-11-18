// A revised https://github.com/joho/godotenv/blob/main/godotenv.go

/*
	Copyright (c) 2013 John Barton

	MIT License

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
	LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
	OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// Package godotenv is a go port of the ruby dotenv library (https://github.com/bkeepers/dotenv)
//
// Examples/readme can be found on the github page at https://github.com/joho/godotenv
//
// The TL;DR is that you make a .env file that looks something like
//
//	SOME_ENV_VAR=somevalue
//
// and then in your go code you can call
//
//	godotenv.Load()
//
// and all the env vars declared in .env will be available through os.Getenv("SOME_ENV_VAR")
package comm

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/spf13/afero"
)

const doubleQuoteSpecialChars = "\\\n\r\"!$`"

// Load will read your env file(s) and load them into ENV for this process.
//
// Call this function as close as possible to the start of your program (ideally in main)
//
// # If you call Load without any args it will default to loading .env in the current path
//
// You can otherwise tell it which files to load (there can be more than one) like
//
//	godotenv.Load("fileone", "filetwo")
//
// It's important to note that it WILL NOT OVERRIDE an env variable that already exists - consider the .env file to set dev vars or sensible defaults
func LoadEnv(fs afero.Fs, filenames ...string) (err error) {
	filenames = EnvFilenamesOrDefault(filenames)

	for _, filename := range filenames {
		err = LoadEnvFile(fs, filename)
		if err != nil {
			return // return early on a spazout
		}
	}
	return
}

// Overload will read your env file(s) and load them into ENV for this process.
//
// Call this function as close as possible to the start of your program (ideally in main)
//
// # If you call Overload without any args it will default to loading .env in the current path
//
// You can otherwise tell it which files to load (there can be more than one) like
//
//	godotenv.Overload("fileone", "filetwo")
//
// It's important to note this WILL OVERRIDE an env variable that already exists - consider the .env file to forcefilly set all vars.
func OverloadEnv(fs afero.Fs, filenames ...string) (err error) {
	filenames = EnvFilenamesOrDefault(filenames)

	for _, filename := range filenames {
		err = LoadEnvFile(fs, filename)
		if err != nil {
			return // return early on a spazout
		}
	}
	return
}

// Read all env (with same file loading semantics as Load) but return values as
// a map rather than automatically writing values into env
func ReadEnv(fs afero.Fs, filenames ...string) (envMap map[string]string, err error) {
	filenames = EnvFilenamesOrDefault(filenames)
	envMap = make(map[string]string)

	for _, filename := range filenames {
		individualEnvMap, individualErr := ReadEnvFile(fs, filename)

		if individualErr != nil {
			err = individualErr
			return // return early on a spazout
		}

		for key, value := range individualEnvMap {
			envMap[key] = value
		}
	}

	return
}

// Parse reads an env file from io.Reader, returning a map of keys and values.
func ParseEnv(r io.Reader) (envMap map[string]string, err error) {
	envMap = make(map[string]string)

	var lines []string
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	if err = scanner.Err(); err != nil {
		return
	}

	for _, fullLine := range lines {
		if !IsIgnoredEnvLine(fullLine) {
			var key, value string
			key, value, err = ParseEnvLine(fullLine, envMap)

			if err != nil {
				return
			}
			envMap[key] = value
		}
	}
	return
}

// Unmarshal reads an env file from a string, returning a map of keys and values.
func UnmarshalEnv(str string) (envMap map[string]string, err error) {
	return ParseEnv(strings.NewReader(str))
}

// Exec loads env vars from the specified filenames (empty map falls back to default)
// then executes the cmd specified.
//
// Simply hooks up os.Stdin/err/out to the command and calls Run()
//
// If you want more fine grained control over your command it's recommended
// that you use `Load()` or `Read()` and the `os/exec` package yourself.
func ExecEnv(fs afero.Fs, filenames []string, cmd string, cmdArgs []string) error {
	if err := LoadEnv(fs, filenames...); err != nil {
		return err
	}

	command := exec.Command(cmd, cmdArgs...)
	command.Stdin = os.Stdin
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr
	return command.Run()
}

// Write serializes the given environment and writes it to a file
func WriteEnv(fs afero.Fs, envMap map[string]string, filename string) error {
	content, err := MarshalEnv(envMap)
	if err != nil {
		return err
	}
	file, err := fs.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	_, err = file.WriteString(content + "\n")
	if err != nil {
		return err
	}
	return file.Sync()
}

// Marshal outputs the given environment as a dotenv-formatted environment file.
// Each line is in the format: KEY="VALUE" where VALUE is backslash-escaped.
func MarshalEnv(envMap map[string]string) (string, error) {
	lines := make([]string, 0, len(envMap))
	for k, v := range envMap {
		if d, err := strconv.Atoi(v); err == nil {
			lines = append(lines, fmt.Sprintf(`%s=%d`, k, d))
		} else {
			lines = append(lines, fmt.Sprintf(`%s="%s"`, k, EnvDoubleQuoteEscape(v)))
		}
	}
	sort.Strings(lines)
	return strings.Join(lines, "\n"), nil
}

func EnvFilenamesOrDefault(filenames []string) []string {
	if len(filenames) == 0 {
		return []string{".env"}
	}
	return filenames
}

func LoadEnvFile(fs afero.Fs, filename string) error {
	envMap, err := ReadEnvFile(fs, filename)
	if err != nil {
		return err
	}

	LoadEnvMap(envMap)

	return nil
}

func LoadEnvMap(envMap map[string]string) {
	/*currentEnv := map[string]bool{}
	rawEnv := os.Environ()
	for _, rawEnvLine := range rawEnv {
		key := strings.Split(rawEnvLine, "=")[0]
		currentEnv[key] = true
	}*/

	for key, value := range envMap {
		// if !currentEnv[key] {
		os.Setenv(key, value)
		//}
	}
}

func ReadEnvFile(fs afero.Fs, filename string) (envMap map[string]string, err error) {
	file, err := fs.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	return ParseEnv(file)
}

var envExportRegex = regexp.MustCompile(`^\s*(?:export\s+)?(.*?)\s*$`)

func ParseEnvLine(line string, envMap map[string]string) (key string, value string, err error) {
	if len(line) == 0 {
		err = errors.New("zero length string")
		return
	}

	// ditch the comments (but keep quoted hashes)
	if strings.Contains(line, "#") {
		segmentsBetweenHashes := strings.Split(line, "#")
		quotesAreOpen := false
		var segmentsToKeep []string
		for _, segment := range segmentsBetweenHashes {
			if strings.Count(segment, "\"") == 1 || strings.Count(segment, "'") == 1 {
				if quotesAreOpen {
					quotesAreOpen = false
					segmentsToKeep = append(segmentsToKeep, segment)
				} else {
					quotesAreOpen = true
				}
			}

			if len(segmentsToKeep) == 0 || quotesAreOpen {
				segmentsToKeep = append(segmentsToKeep, segment)
			}
		}

		line = strings.Join(segmentsToKeep, "#")
	}

	firstEquals := strings.Index(line, "=")
	firstColon := strings.Index(line, ":")
	splitString := strings.SplitN(line, "=", 2)
	if firstColon != -1 && (firstColon < firstEquals || firstEquals == -1) {
		// this is a yaml-style line
		splitString = strings.SplitN(line, ":", 2)
	}

	if len(splitString) != 2 {
		err = errors.New("can't separate key from value")
		return
	}

	// Parse the key
	key = splitString[0]
	key = strings.TrimPrefix(key, "export")
	key = strings.TrimSpace(key)

	key = envExportRegex.ReplaceAllString(key, "$1")

	// Parse the value
	value = parseEnvValue(splitString[1], envMap)
	return
}

var (
	envSingleQuotesRegex  = regexp.MustCompile(`\A'(.*)'\z`)
	envDoubleQuotesRegex  = regexp.MustCompile(`\A"(.*)"\z`)
	envEscapeRegex        = regexp.MustCompile(`\\.`)
	envUnescapeCharsRegex = regexp.MustCompile(`\\([^$])`)
)

func parseEnvValue(value string, envMap map[string]string) string {
	// trim
	value = strings.Trim(value, " ")

	// check if we've got quoted values or possible escapes
	if len(value) > 1 {
		singleQuotes := envSingleQuotesRegex.FindStringSubmatch(value)

		doubleQuotes := envDoubleQuotesRegex.FindStringSubmatch(value)

		if singleQuotes != nil || doubleQuotes != nil {
			// pull the quotes off the edges
			value = value[1 : len(value)-1]
		}

		if doubleQuotes != nil {
			// expand newlines
			value = envEscapeRegex.ReplaceAllStringFunc(value, func(match string) string {
				c := strings.TrimPrefix(match, `\`)
				switch c {
				case "n":
					return "\n"
				case "r":
					return "\r"
				default:
					return match
				}
			})
			// unescape characters
			value = envUnescapeCharsRegex.ReplaceAllString(value, "$1")
		}

		if singleQuotes == nil {
			value = EnvExpandVariables(value, envMap)
		}
	}

	return value
}

var envExpandVarRegex = regexp.MustCompile(`(\\)?(\$)(\()?\{?([A-Z0-9_]+)?\}?`)

func EnvExpandVariables(v string, m map[string]string) string {
	return envExpandVarRegex.ReplaceAllStringFunc(v, func(s string) string {
		submatch := envExpandVarRegex.FindStringSubmatch(s)

		if submatch == nil {
			return s
		}
		if submatch[1] == "\\" || submatch[2] == "(" {
			return submatch[0][1:]
		} else if submatch[4] != "" {
			return m[submatch[4]]
		}
		return s
	})
}

func IsIgnoredEnvLine(line string) bool {
	trimmedLine := strings.TrimSpace(line)
	return len(trimmedLine) == 0 || strings.HasPrefix(trimmedLine, "#")
}

func EnvDoubleQuoteEscape(line string) string {
	for _, c := range doubleQuoteSpecialChars {
		toReplace := "\\" + string(c)
		if c == '\n' {
			toReplace = `\n`
		}
		if c == '\r' {
			toReplace = `\r`
		}
		line = strings.Replace(line, string(c), toReplace, -1)
	}
	return line
}
