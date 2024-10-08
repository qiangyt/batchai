package comm

import (
	"encoding/json"

	"github.com/pkg/errors"
	"github.com/spf13/afero"
	"gopkg.in/yaml.v3"
)

func MapFromYamlFileP(fs afero.Fs, path string, envsubt bool) map[string]any {
	r, err := MapFromYamlFile(fs, path, envsubt)
	if err != nil {
		panic(err)
	}
	return r
}

func MapFromYamlFile(fs afero.Fs, path string, envsubt bool) (map[string]any, error) {
	r := map[string]any{}
	if err := FromYamlFile(fs, path, envsubt, &r); err != nil {
		return nil, err
	}

	return r, nil
}

func MapFromYamlP(yamlText string, envsubt bool) map[string]any {
	r, err := MapFromYaml(yamlText, envsubt)
	if err != nil {
		panic(err)
	}
	return r
}

func MapFromYaml(yamlText string, envsubt bool) (map[string]any, error) {
	r := map[string]any{}
	if err := FromYaml(yamlText, envsubt, &r); err != nil {
		return nil, err
	}

	return r, nil
}

func MapFromJsonFileP(fs afero.Fs, path string, envsubt bool) map[string]any {
	r, err := MapFromJsonFile(fs, path, envsubt)
	if err != nil {
		panic(err)
	}
	return r
}

func MapFromJsonFile(fs afero.Fs, path string, envsubt bool) (map[string]any, error) {
	r := map[string]any{}
	if err := FromJsonFile(fs, path, envsubt, &r); err != nil {
		return nil, err
	}

	return r, nil
}

func MapFromJsonP(yamlText string, envsubt bool) map[string]any {
	r, err := MapFromJson(yamlText, envsubt)
	if err != nil {
		panic(err)
	}
	return r
}

func MapFromJson(yamlText string, envsubt bool) (map[string]any, error) {
	r := map[string]any{}
	if err := FromJson(yamlText, envsubt, &r); err != nil {
		return nil, err
	}

	return r, nil
}

func FromYamlFileP(fs afero.Fs, path string, envsubt bool, result any) {
	if err := FromYamlFile(fs, path, envsubt, result); err != nil {
		panic(err)
	}
}

func FromYamlFile(fs afero.Fs, path string, envsubt bool, result any) error {
	yamlText, err := ReadFileText(fs, path)
	if err != nil {
		return err
	}

	if err := FromYaml(yamlText, envsubt, result); err != nil {
		return errors.Wrapf(err, "parse yaml file: %s", path)
	}
	return nil
}

func FromYamlP(yamlText string, envsubt bool, result any) {
	if err := FromYaml(yamlText, envsubt, result); err != nil {
		panic(err)
	}
}

func FromYaml(yamlText string, envsubt bool, result any) (err error) {
	if envsubt {
		yamlText, err = EnvSubst(yamlText, nil)
		if err != nil {
			return
		}
	}

	if err = yaml.Unmarshal([]byte(yamlText), result); err != nil {
		return errors.Wrapf(err, "parse yaml: \n\n%s", yamlText)
	}
	return nil
}

func FromJsonFileP(fs afero.Fs, path string, envsubt bool, result any) {
	if err := FromJsonFile(fs, path, envsubt, result); err != nil {
		panic(err)
	}
}

func FromJsonFile(fs afero.Fs, path string, envsubt bool, result any) error {
	yamlText, err := ReadFileText(fs, path)
	if err != nil {
		return err
	}

	if err := FromJson(yamlText, envsubt, result); err != nil {
		return errors.Wrapf(err, "parse json file: %s", path)
	}
	return nil
}

func FromJsonP(jsonText string, envsubt bool, result any) {
	if err := FromJson(jsonText, envsubt, result); err != nil {
		panic(err)
	}
}

func FromJson(jsonText string, envsubt bool, result any) (err error) {
	if envsubt {
		jsonText, err = EnvSubst(jsonText, nil)
		if err != nil {
			return
		}
	}

	if err = json.Unmarshal([]byte(jsonText), result); err != nil {
		return errors.Wrapf(err, "parse json: \n\n%s", jsonText)
	}
	return nil
}

func ToJsonP(input any, pretty bool) string {
	r, err := ToJson(input, pretty)
	if err != nil {
		panic(errors.Wrap(err, "failed to marshal json"))
	}
	return r
}

func ToJson(input any, pretty bool) (string, error) {
	var r []byte
	var err error

	if pretty {
		r, err = json.MarshalIndent(input, "", "    ")
	} else {
		r, err = json.Marshal(input)
	}
	return string(r), err
}
