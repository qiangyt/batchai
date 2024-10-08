package comm

import (
	"fmt"
	"reflect"
	"strings"
)

func RequiredStringP(hint string, key string, m map[string]any) string {
	r, err := RequiredString(hint, key, m)
	if err != nil {
		panic(err)
	}
	return r
}

func RequiredString(hint string, key string, m map[string]any) (string, error) {
	v, has := m[key]
	if !has {
		return "", fmt.Errorf("%s.%s is required", hint, key)
	}

	return String(hint+"."+key, v)
}

func OptionalStringP(hint string, key string, m map[string]any, devault string) (result string, has bool) {
	var err error
	result, has, err = OptionalString(hint, key, m, devault)
	if err != nil {
		panic(err)
	}
	return
}

func OptionalString(hint string, key string, m map[string]any, devault string) (result string, has bool, err error) {
	var v any

	v, has = m[key]
	if !has {
		result = devault
		err = nil
		return
	}

	result, err = String(hint+"."+key, v)
	return
}

func StringP(hint string, v any) string {
	r, err := String(hint, v)
	if err != nil {
		panic(err)
	}
	return r
}

func String(hint string, v any) (string, error) {
	r, ok := v.(string)
	if !ok {
		return "", fmt.Errorf("%s must be a string, but now it is a %v(%v)", hint, reflect.TypeOf(v), v)
	}
	return r, nil
}

func StringArrayValueP(hint string, key string, m map[string]any) []string {
	r, err := StringArrayValue(hint, key, m)
	if err != nil {
		panic(err)
	}
	return r
}

func StringArrayValue(hint string, key string, m map[string]any) ([]string, error) {
	v, has := m[key]
	if !has {
		return nil, fmt.Errorf("%s.%s is required", hint, key)
	}

	return StringArray(hint+"."+key, v)
}

func OptionalStringArrayValueP(hint string, key string, m map[string]any, devault []string) (result []string, has bool) {
	var err error
	result, has, err = OptionalStringArrayValue(hint, key, m, devault)
	if err != nil {
		panic(err)
	}
	return
}

func OptionalStringArrayValue(hint string, key string, m map[string]any, devault []string) (result []string, has bool, err error) {
	var v any
	v, has = m[key]
	if !has {
		result = devault
		err = nil
		return
	}

	result, err = StringArray(hint+"."+key, v)
	return
}

func StringArrayP(hint string, v any) []string {
	r, err := StringArray(hint, v)
	if err != nil {
		panic(err)
	}
	return r
}

func StringArray(hint string, v any) ([]string, error) {
	r, ok := v.([]string)
	if !ok {
		if r1, ok1 := v.([]any); ok1 {
			var err error
			r = make([]string, len(r1))
			for i, v := range r1 {
				if r[i], err = String(fmt.Sprintf("%s[%d]", hint, i), v); err != nil {
					break
				}
			}
			if err == nil {
				return r, nil
			}
		} else if r0, err := String(hint, v); err != nil {
			return []string{r0}, nil
		}
		return nil, fmt.Errorf("%s must be a string array, but now it is a %v(%v)", hint, reflect.TypeOf(v), v)
	}
	return r, nil
}

func StringMapP(hint string, v any) map[string]string {
	r, err := StringMap(hint, v)
	if err != nil {
		panic(err)
	}
	return r
}

func StringMap(hint string, v any) (map[string]string, error) {
	r, ok := v.(map[string]string)
	if !ok {
		if r1, ok1 := v.(map[string]any); ok1 {
			var err error
			r = map[string]string{}
			for k, v := range r1 {
				if r[k], err = String(hint+"."+k, v); err != nil {
					break
				}
			}
			if err == nil {
				return r, nil
			}
		} else if r0, ok0 := v.(string); ok0 {
			if posOfColon := strings.Index(r0, ":"); posOfColon > 0 && posOfColon != len(r0)-1 {
				if value, err := String(hint, strings.TrimSpace(r0[posOfColon+1:])); err == nil {
					key := strings.TrimSpace(r0[:posOfColon])
					return map[string]string{key: value}, nil
				}
			}
		}
		return nil, fmt.Errorf("%s must be a string map, but now it is a %v(%v)", hint, reflect.TypeOf(v), v)
	}
	return r, nil
}

// /////////////////////////////////////////////////////////
var asciiSpace = [256]uint8{'\t': 1, '\n': 1, '\v': 1, '\f': 1, '\r': 1, ' ': 1}

func IsAsciiSpace(s uint8) bool {
	return asciiSpace[s] == 1
}

func AnyArrayToStringArray(anyArray []any) []string {
	if anyArray == nil {
		return nil
	}
	result := make([]string, len(anyArray))
	for i, any := range anyArray {
		result[i] = any.(string)
	}
	return result
}

func StringArrayToAnyArray(stringArray []string) []any {
	if stringArray == nil {
		return nil
	}
	result := make([]any, len(stringArray))
	for i, s := range stringArray {
		result[i] = s
	}
	return result
}

func StringArrayTrimSpace(stringArray []string) []string {
	r := []string{}
	for _, str := range stringArray {
		str = strings.TrimSpace(str)
		if len(str) > 0 {
			r = append(r, str)
		}
	}
	return r
}
