package comm

import (
	"regexp"
	"strings"
)

func FixJson(input string, isGolang bool) string {
	// input = strings.ReplaceAll(input, `\\n`, "\n")
	// input = strings.ReplaceAll(input, `\\t`, "\t")
	// input = strings.ReplaceAll(input, `\\r`, "\r")

	//input = FixJsonQuotes(input)
	//if isGolang {
	//	input = FixJsonImports(input)
	//}
	//input = FixJsonUnclosedBrackets(input)
	//input = FixJsonExtraEscapes(input)

	return input
}

func FixJsonQuotes(input string) string {
	quoteCount := strings.Count(input, "\"")
	if quoteCount%2 != 0 {
		input += "\""
	}
	return input
}

func FixJsonImports(input string) string {
	re := regexp.MustCompile(`import\s*\((.*?)\)`)
	matches := re.FindAllString(input, -1)

	for _, match := range matches {
		if strings.Count(match, "\"")%2 != 0 {
			input = strings.Replace(input, match, match+"\"", 1)
		}
	}

	return input
}

func FixJsonUnclosedBrackets(input string) string {
	openBraces := strings.Count(input, "{")
	closeBraces := strings.Count(input, "}")
	openBrackets := strings.Count(input, "[")
	closeBrackets := strings.Count(input, "]")

	for openBraces > closeBraces {
		input += "}"
		closeBraces++
	}

	for openBrackets > closeBrackets {
		input += "]"
		closeBrackets++
	}

	return input
}

func FixJsonExtraEscapes(input string) string {
	re := regexp.MustCompile(`\\([^"\\/bfnrtu])`)
	return re.ReplaceAllString(input, "$1")
}
