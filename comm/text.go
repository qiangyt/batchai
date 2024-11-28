package comm

import (
	"fmt"
	"io"
	"os"
	"strings"
	"text/template"

	"github.com/Masterminds/sprig/v3"
	"github.com/pkg/errors"
	"gopkg.in/yaml.v3"
)

func RenderWithTemplateP(w io.Writer, name string, tmpl string, data map[string]any) {
	err := RenderWithTemplate(w, name, tmpl, data)
	if err != nil {
		panic(err)
	}
}

func RenderWithTemplate(w io.Writer, name string, tmpl string, data map[string]any) error {
	t, err := template.New(name).Funcs(sprig.FuncMap()).Parse(tmpl)
	if err != nil {
		return errors.Wrapf(err, "parse template %s: %s", name, tmpl)
	}

	err = t.Execute(w, data)
	if err != nil {
		return errors.Wrapf(err, "render template %s: %v", name, data)
	}
	return nil
}

func RenderAsTemplateArrayP(tmplArray []string, data map[string]any) []string {
	r, err := RenderAsTemplateArray(tmplArray, data)
	if err != nil {
		panic(err)
	}
	return r
}

func RenderAsTemplateArray(tmplArray []string, data map[string]any) ([]string, error) {
	r := make([]string, 0, len(tmplArray))
	for _, tmpl := range tmplArray {
		txt, err := RenderAsTemplate(tmpl, data)
		if err != nil {
			return nil, err
		}
		r = append(r, txt)
	}
	return r, nil
}

func RenderAsTemplateP(tmpl string, data map[string]any) string {
	r, err := RenderAsTemplate(tmpl, data)
	if err != nil {
		panic(err)
	}
	return r
}

func RenderAsTemplate(tmpl string, data map[string]any) (string, error) {
	output := &strings.Builder{}
	if err := RenderWithTemplate(output, "", tmpl, data); err != nil {
		return "", err
	}
	return output.String(), nil
}

func JoinedLines(lines ...string) string {
	return strings.Join(lines, "\n")
}

func JoinedLinesAsBytes(lines ...string) []byte {
	return []byte(JoinedLines(lines...))
}

func ToYamlP(hint string, me any) string {
	r, err := ToYaml(hint, me)
	if err != nil {
		panic(err)
	}
	return r
}

func ToYaml(hint string, me any) (string, error) {
	r, err := yaml.Marshal(me)
	if err != nil {
		if len(hint) > 0 {
			return "", errors.Wrapf(err, "marshal %s to yaml", hint)
		} else {
			return "", errors.Wrapf(err, "marshal to yaml")
		}
	}
	return string(r), nil
}

func SubstVarsP(useGoTemplate bool, m map[string]any, parentVars map[string]any, keysToSkip ...string) map[string]any {
	r, err := SubstVars(useGoTemplate, m, parentVars, keysToSkip...)
	if err != nil {
		panic(err)
	}
	return r
}

func SubstVars(useGoTemplate bool, m map[string]any, parentVars map[string]any, keysToSkip ...string) (map[string]any, error) {
	newVars := map[string]any{}

	// copy parent vars, it could be overwritten by local vars
	if len(parentVars) > 0 {
		for k, v := range parentVars {
			newVars[k] = v
		}
	}

	for k, v := range m {
		if k == "vars" {
			if localVarsMap, isMap := v.(map[string]any); isMap {
				// overwrite by local vars
				for k2, v2 := range localVarsMap {
					newVars[k2] = v2
				}
			}
		}
	}

	mapNoVars := map[string]any{}
	for k, v := range m {
		if k != "vars" {
			skip := false
			if len(keysToSkip) > 0 {
				for _, keyToSkip := range keysToSkip {
					if keyToSkip == k {
						skip = true
					}
				}
			}
			if !skip {
				/*vYaml := ToYaml("", v)
				vYaml = RenderAsTemplate(vYaml, newVars)
				if err := yaml.Unmarshal([]byte(vYaml), &v); err != nil {
					panic(errors.Wrapf(err, "parse yaml: %s", vYaml))
				}*/
				mapNoVars[k] = v
			}
		}
	}

	yamlNoVars, err := ToYaml("", mapNoVars)
	if err != nil {
		return nil, err
	}

	if useGoTemplate {
		yamlNoVars, err = RenderAsTemplate(yamlNoVars, newVars)
		if err != nil {
			return nil, err
		}
	} else {
		yamlNoVars = os.Expand(yamlNoVars,
			func(k string) string {
				v := newVars[k]
				if v != nil {
					if vStr, isStr := v.(string); isStr {
						return vStr
					}
					return fmt.Sprintf("%v", v)
				}
				return ""
			})
	}

	r := map[string]any{}
	if err := yaml.Unmarshal([]byte(yamlNoVars), &r); err != nil {
		return nil, errors.Wrapf(err, "parse yaml: %s", yamlNoVars)
	}
	r["vars"] = newVars

	// put back skipped key/values
	if len(keysToSkip) > 0 {
		for _, keyToSkip := range keysToSkip {
			r[keyToSkip] = m[keyToSkip]
		}
	}

	return r, nil
}

func TextLine2Array(line string) []string {
	line = strings.TrimSpace(line)
	if len(line) == 0 {
		return []string{}
	}

	var r []string
	if strings.ContainsAny(line, ",") {
		r = strings.Split(line, ",")
	} else if strings.ContainsAny(line, "\t") {
		r = strings.Split(line, "\t")
	} else if strings.ContainsAny(line, "\n") {
		r = strings.Split(line, "\n")
	} else if strings.ContainsAny(line, "\r") {
		r = strings.Split(line, "\r")
	} else if strings.ContainsAny(line, ";") {
		r = strings.Split(line, ";")
	} else if strings.ContainsAny(line, "|") {
		r = strings.Split(line, "|")
	} else {
		r = strings.Split(line, " ")
	}

	for i, t := range r {
		r[i] = strings.TrimSpace(t)
	}
	return r
}

func Text2Lines(text string) []string {
	rdr := strings.NewReader(text)
	return ReadLines(rdr)
}

func RemovePackageNames(symbolNames []string) []string {
	r := make([]string, len(symbolNames))
	for i, symbolName := range symbolNames {
		r[i] = RemovePackageName(symbolName)
	}
	return r
}

func RemovePackageName(symbolName string) string {
	parts := strings.Split(symbolName, ".")
	return parts[len(parts)-1]
}

func ExtractMarkdownCodeBlocksP(input string) (string, string) {
	result, remained, err := ExtractMarkdownCodeBlocks(input)
	if err != nil {
		panic(err)
	}
	return result, remained
}

func ExtractMarkdownCodeBlocks(input string) (string, string, error) {
	begin := strings.Index(input, "```")
	if begin < 0 {
		return input, "", nil
	}
	block := input[begin+len("```"):]

	line_end := strings.Index(block, "\n")
	if line_end < 0 {
		return "", input, nil
	}
	block = block[line_end+1:]

	end := strings.Index(block, "```")
	if end <= 0 {
		result := block
		remained := input[:begin]
		return result, remained, nil
		// return "", input, errors.New("unmatched markdown code tag")
	} else {
		result := block[:end]

		remained := input[:begin] + block[end+len("```"):]

		return result, remained, nil
	}
}

func ExtractMarkdownJsonBlocksP(input string) (string, string) {
	result, remained, err := ExtractMarkdownJsonBlocks(input)
	if err != nil {
		panic(err)
	}
	return result, remained
}

func ExtractMarkdownJsonBlocks(input string) (string, string, error) {
	begin := strings.Index(input, "```json\n")
	if begin < 0 {
		return input, "", nil
	}
	block := input[begin+len("```json\n"):]

	end := strings.Index(block, "```")
	if end <= 0 {
		return block, input[:begin], nil // errors.New("unmatched markdown ```json tag")
	}
	result := block[:end]
	remained := input[:begin] + block[end+len("```"):]
	return result, remained, nil
}

// This function looks for a single query in the text, and returns up to 10 lines before
// and after the line where the query was found.
func SearchInText(text, query string) []string {
	result := make([]string, 0)
	lines := strings.Split(text, "\n")

	for i, line := range lines {
		if strings.Contains(line, query) {
			start := i - 10
			if start < 0 {
				start = 0
			}

			end := i + 10
			if end > len(lines) {
				end = len(lines)
			}

			result = append(result, lines[start:end]...)
		}
	}

	return result
}

// This function looks for multiple queries in the text. If the results are overlapping,
// they are merged.
func SearchMultiple(text string, queries []string) []string {
	tempResults := make([][]string, len(queries))
	for i, query := range queries {
		tempResults[i] = SearchInText(text, query)
	}

	result := make([]string, 0)
	memo := make(map[string]bool)

	for _, tempResult := range tempResults {
		for _, line := range tempResult {
			if _, exists := memo[line]; !exists {
				memo[line] = true
				result = append(result, line)
			}
		}
	}

	return result
}

func NormalizeCode(code string) string {
	code = strings.TrimSpace(code)
	if len(code) > 0 && !strings.HasSuffix(code, "\n") {
		code = code + "\n"
	}
	return code
}
