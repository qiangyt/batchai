package comm

import (
	"os/exec"
	"path"
	"strings"

	"github.com/spf13/afero"
)

func IsGitInited(fs afero.Fs, workDir string) bool {
	status, err := GetGitStatus(fs, workDir)
	if err != nil {
		return false
	}
	return !strings.Contains(status, "not a git repository")
}

func GetGitStatus(fs afero.Fs, workDir string) (string, error) {
	return ExecGit(fs, workDir, []string{"status"}, true)
}

func GetUnstagedFiles(fs afero.Fs, workDir string) ([]string, error) {
	output, err := ExecGit(fs, workDir, []string{"status", "--porcelain"}, false)
	if err != nil {
		return nil, err
	}

	lines := []string{}
	for _, line := range strings.Split(output, "\n") {
		if len(line) > 0 {
			if strings.HasPrefix(line, "?? ") || strings.HasPrefix(line, " M ") {
				lines = append(lines, line)
			}
		}
	}
	return lines, nil
}

func ExecGit(fs afero.Fs, workDir string, args []string, trim bool) (string, error) {
	var err error

	if len(workDir) > 0 {
		if workDir, err = AbsPath(workDir); err != nil {
			return "", err
		}
	} else {
		workDir = WorkingDirectoryP()
	}

	command := exec.Command("git", args...)

	if len(workDir) > 0 {
		command.Dir = workDir
	}

	t, err := command.Output()
	if err != nil {
		return "", err
	}

	r := string(t)
	if trim {
		r = strings.Trim(r, "\n\r\t ")
	}
	return r, nil
}

func GitDirectory(fs afero.Fs, filePath string) string {
	r := filePath
	if IsFileP(fs, filePath) {
		r = path.Dir(filePath)
	}

	if !IsGitInited(fs, r) {
		return ""
	}

	for {
		exists, err2 := DirExists(fs, path.Join(r, ".git"))
		if err2 != nil {
			return ""
		}
		if exists {
			return r
		}
		r = path.Dir(r)
	}
}
