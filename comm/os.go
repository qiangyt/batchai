package comm

import (
	"os"
	"path/filepath"
	"runtime"

	"github.com/a8m/envsubst/parse"
	"github.com/pkg/errors"
	"github.com/spf13/cast"
)

func IsWindows() bool {
	return runtime.GOOS == "windows"
}

func IsDarwin() bool {
	return runtime.GOOS == "darwin"
}

func IsLinux() bool {
	return runtime.GOOS == "linux"
}

func EnvironMapP(overrides map[string]string) map[string]string {
	r, err := EnvironMap(overrides)
	if err != nil {
		panic(err)
	}
	return r
}

func EnvironMap(overrides map[string]string) (map[string]string, error) {
	envs := JoinedLines(os.Environ()...)
	r, err := UnmarshalEnv(envs)
	if err != nil {
		return nil, errors.Wrapf(err, "parse OS environments")
	}

	if len(overrides) > 0 {
		for k, v := range overrides {
			r[k] = cast.ToString(v)
		}
	}
	return r, nil
}

func EnvironListP(overrides map[string]string) []string {
	r, err := EnvironList(overrides)
	if err != nil {
		panic(err)
	}
	return r
}

func EnvironList(overrides map[string]string) ([]string, error) {
	envs, err := EnvironMap(overrides)
	if err != nil {
		return nil, err
	}

	r := make([]string, 0, len(envs)+len(overrides))
	for k, v := range envs {
		r = append(r, k+"="+cast.ToString(v))
	}
	return r, nil
}

func EnvSubstP(input string, env map[string]string) string {
	r, err := EnvSubst(input, env)
	if err != nil {
		panic(err)
	}
	return r
}

func EnvSubst(input string, env map[string]string) (string, error) {
	restr := parse.Restrictions{NoUnset: false, NoEmpty: false}

	envMap, err := EnvironMap(env)
	if err != nil {
		return "", err
	}
	envList, err := EnvironList(envMap)
	if err != nil {
		return "", err
	}

	parser := parse.New("tmp", envList, &restr)
	r, err := parser.Parse(input)
	if err != nil {
		return "", errors.Wrapf(err, "envsubst the text: %s", input)
	}
	return r, nil
}

func EnvSubstSliceP(inputs []string, env map[string]string) []string {
	r, err := EnvSubstSlice(inputs, env)
	if err != nil {
		panic(err)
	}
	return r
}

func EnvSubstSlice(inputs []string, env map[string]string) ([]string, error) {
	r := make([]string, 0, len(inputs))
	for _, s := range inputs {
		substed, err := EnvSubst(s, env)
		if err != nil {
			return nil, err
		}
		r = append(r, substed)
	}
	return r, nil
}

func ExecutableP() string {
	r, err := Executable()
	if err != nil {
		panic(err)
	}
	return r
}

func Executable() (string, error) {
	r, err := os.Executable()
	if err != nil {
		return "", errors.Wrap(err, "get the path name of the executable file")
	}
	r, err = filepath.EvalSymlinks(r)
	if err != nil {
		return "", errors.Wrapf(err, "evaluate the symbol linke of the executable file: %s", r)
	}
	return r, nil
}

func WorkingDirectoryP() string {
	r, err := WorkingDirectory()
	if err != nil {
		panic(err)
	}
	return r
}

func WorkingDirectory() (string, error) {
	r, err := os.Getwd()
	if err != nil {
		return "", errors.Wrap(err, "get working directory")
	}
	return r, nil
}

func AbsPathP(_path string) string {
	r, err := AbsPath(_path)
	if err != nil {
		panic(err)
	}
	return r
}

func AbsPath(_path string) (string, error) {
	r := filepath.Clean(_path)
	if filepath.IsAbs(r) {
		return r, nil
	}

	cwd, err := WorkingDirectory()
	if err != nil {
		return "", err
	}

	return filepath.Join(filepath.Clean(cwd), _path), nil
}

func AbsPathWithP(_path string, workDir string) string {
	r, err := AbsPathWith(_path, workDir)
	if err != nil {
		panic(err)
	}
	return r
}

func AbsPathWith(_path string, workDir string) (string, error) {
	r := filepath.Clean(_path)
	if filepath.IsAbs(r) {
		return r, nil
	}

	return filepath.Join(filepath.Clean(workDir), _path), nil
}
