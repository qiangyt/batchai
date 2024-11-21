package comm

import (
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/mitchellh/go-homedir"
	"github.com/pkg/errors"
	"github.com/spf13/afero"
)

var AppFs = afero.NewOsFs()

func CopyFileP(fs afero.Fs, path string, newPath string) int64 {
	r, err := CopyFile(fs, path, newPath)
	if err != nil {
		panic(err)
	}
	return r
}

func CopyFile(fs afero.Fs, path string, newPath string) (int64, error) {
	err := EnsureFileExists(fs, path)
	if err != nil {
		return 0, err
	}

	src, err := fs.Open(path)
	if err != nil {
		return 0, errors.Wrapf(err, "read file %s", path)
	}
	defer src.Close()

	dst, err := fs.Create(newPath)
	if err != nil {
		return 0, errors.Wrapf(err, "create file %s", newPath)
	}
	defer dst.Close()

	nBytes, err := io.Copy(dst, src)
	if err != nil {
		return 0, errors.Wrapf(err, "copy file %s to %s", path, newPath)
	}
	return nBytes, nil
}

func RenameP(fs afero.Fs, path string, newPath string) {
	if err := Rename(fs, path, newPath); err != nil {
		panic(err)
	}
}

func Rename(fs afero.Fs, path string, newPath string) error {
	err := fs.Rename(path, newPath)
	if err != nil {
		return errors.Wrapf(err, "move file %s to %s", path, newPath)
	}
	return nil
}

func StatP(fs afero.Fs, path string, ensureExists bool) os.FileInfo {
	r, err := Stat(fs, path, ensureExists)
	if err != nil {
		panic(err)
	}
	return r
}

// Stat ...
func Stat(fs afero.Fs, path string, ensureExists bool) (os.FileInfo, error) {
	r, err := fs.Stat(path)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, errors.Wrapf(err, "stat file: %s", path)
		}
		if ensureExists {
			return nil, errors.Wrapf(err, "file not found: %s", path)
		}
		return nil, nil
	}

	return r, nil
}

func FileExistsP(fs afero.Fs, path string) bool {
	r, err := FileExists(fs, path)
	if err != nil {
		panic(err)
	}
	return r
}

// FileExists ...
func FileExists(fs afero.Fs, path string) (bool, error) {
	fi, err := Stat(fs, path, false)
	if err != nil {
		return false, nil
	}
	if fi == nil {
		return false, nil
	}
	if fi.IsDir() {
		return false, fmt.Errorf("expect %s be file, but it is directory", path)
	}
	return true, nil
}

// PathExists ...
func PathExists(fs afero.Fs, path string) bool {
	fi, err := Stat(fs, path, false)
	if err != nil {
		return false
	}
	if fi == nil {
		return false
	}
	return true
}

func EnsureFileExistsP(fs afero.Fs, path string) {
	if err := EnsureFileExists(fs, path); err != nil {
		panic(err)
	}
}

func EnsureFileExists(fs afero.Fs, path string) error {
	exists, err := FileExists(fs, path)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("file not found: %s", path)
	}
	return nil
}

func EnsurePathExistsP(fs afero.Fs, path string) {
	if err := EnsurePathExists(fs, path); err != nil {
		panic(err)
	}
}

func EnsurePathExists(fs afero.Fs, path string) error {
	exists := PathExists(fs, path)
	if !exists {
		return fmt.Errorf("file/directory not found: %s", path)
	}
	return nil
}

func DirExistsP(fs afero.Fs, path string) bool {
	r, err := DirExists(fs, path)
	if err != nil {
		panic(err)
	}
	return r
}

// DirExists ...
func DirExists(fs afero.Fs, path string) (bool, error) {
	fi, err := Stat(fs, path, false)
	if err != nil {
		return false, nil
	}
	if fi == nil {
		return false, nil
	}
	if !fi.IsDir() {
		return false, fmt.Errorf("expect %s be directory, but it is file", path)
	}
	return true, nil
}

func EnsureDirExistsP(fs afero.Fs, path string) {
	if err := EnsureDirExists(fs, path); err != nil {
		panic(err)
	}
}

func EnsureDirExists(fs afero.Fs, path string) error {
	exists, err := DirExists(fs, path)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("directory not found: %s", path)
	}
	return nil
}

func RemoveFileP(fs afero.Fs, path string) {
	if err := RemoveFile(fs, path); err != nil {
		panic(err)
	}
}

// RemoveFile ...
func RemoveFile(fs afero.Fs, path string) error {
	found, err := FileExists(fs, path)
	if err != nil {
		return err
	}
	if !found {
		return nil
	}
	if err := fs.Remove(path); err != nil {
		return errors.Wrapf(err, "delete file: %s", path)
	}
	return nil
}

func RemoveDirP(fs afero.Fs, path string) {
	if err := RemoveDir(fs, path); err != nil {
		panic(err)
	}
}

// RemoveDir ...
func RemoveDir(fs afero.Fs, path string) error {
	if path == "/" || path == "\\" {
		return fmt.Errorf("should NOT remove root directory")
	}
	found, err := DirExists(fs, path)
	if err != nil {
		return err
	}
	if !found {
		return nil
	}
	if err := fs.RemoveAll(path); err != nil {
		return errors.Wrapf(err, "delete directory: %s", path)
	}
	return nil
}

func ReadFileBytesP(fs afero.Fs, path string) []byte {
	r, err := ReadFileBytes(fs, path)
	if err != nil {
		return r
	}
	return r
}

// ReadBytes ...
func ReadFileBytes(fs afero.Fs, path string) ([]byte, error) {
	r, err := afero.ReadFile(fs, path)
	if err != nil {
		return nil, errors.Wrapf(err, "read file: %s", path)
	}
	return r, nil
}

func ReadFileCodeP(fs afero.Fs, path string) string {
	r, err := ReadFileCode(fs, path)
	if err != nil {
		panic(err)
	}
	return r
}

func ReadFileCode(fs afero.Fs, path string) (string, error) {
	str, err := ReadFileText(fs, path)
	if err != nil {
		return "", err
	}
	return NormalizeCode(str), nil
}

func ReadFileTextP(fs afero.Fs, path string) string {
	r, err := ReadFileText(fs, path)
	if err != nil {
		panic(err)
	}
	return r
}

func ReadFileText(fs afero.Fs, path string) (string, error) {
	bytes, err := ReadFileBytes(fs, path)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func ReadFileLinesP(fs afero.Fs, path string) []string {
	r, err := ReadFileLines(fs, path)
	if err != nil {
		panic(err)
	}
	return r
}

func ReadFileLines(fs afero.Fs, path string) ([]string, error) {
	if err := EnsureFileExists(fs, path); err != nil {
		return nil, err
	}

	f, err := fs.Open(path)
	if err != nil {
		return nil, errors.Wrapf(err, "open file: %s", path)
	}
	defer f.Close()

	return ReadLines(f), nil
}

func WriteFileIfNotFoundP(fs afero.Fs, path string, content []byte) bool {
	r, err := WriteFileIfNotFound(fs, path, content)
	if err != nil {
		panic(err)
	}
	return r
}

// WriteIfNotFound ...
func WriteFileIfNotFound(fs afero.Fs, path string, content []byte) (bool, error) {
	found, err := FileExists(fs, path)
	if err != nil {
		return false, err
	}
	if found {
		return false, nil
	}
	if err := WriteFile(fs, path, content); err != nil {
		return true, err
	}
	return true, nil
}

func WriteFileP(fs afero.Fs, path string, content []byte) {
	if err := WriteFile(fs, path, content); err != nil {
		panic(err)
	}
}

// Write ...
func WriteFile(fs afero.Fs, path string, content []byte) error {
	if err := afero.WriteFile(fs, path, content, 0o640); err != nil {
		return errors.Wrapf(err, "write file: %s", path)
	}
	return nil
}

func WriteFileTextP(fs afero.Fs, path string, content string) {
	if err := WriteFileText(fs, path, content); err != nil {
		panic(err)
	}
}

// WriteText ...
func WriteFileText(fs afero.Fs, path string, content string) error {
	return WriteFile(fs, path, []byte(content))
}

// WriteTextIfNotFound ...
func WriteFileTextIfNotFoundP(fs afero.Fs, path string, content string) bool {
	r, err := WriteFileTextIfNotFound(fs, path, content)
	if err != nil {
		panic(err)
	}
	return r
}

func WriteFileTextIfNotFound(fs afero.Fs, path string, content string) (bool, error) {
	found, err := FileExists(fs, path)
	if err != nil {
		return found, err
	}
	if found {
		return false, nil
	}
	if err := WriteFileText(fs, path, content); err != nil {
		return false, err
	}
	return true, nil
}

// WriteLines ...
func WriteFileLinesP(fs afero.Fs, path string, lines ...string) {
	if err := WriteFileLines(fs, path, lines...); err != nil {
		panic(err)
	}
}

func WriteFileLines(fs afero.Fs, path string, lines ...string) error {
	return WriteFileText(fs, path, JoinedLines(lines...))
}

func ExpandHomePathP(path string) string {
	r, err := ExpandHomePath(path)
	if err != nil {
		panic(err)
	}
	return r
}

// ExpandHomePath ...
func ExpandHomePath(path string) (string, error) {
	var r string
	var err error

	if r, err = homedir.Expand(path); err != nil {
		return "", errors.Wrapf(err, "expand path: %s", path)
	}
	return r, nil
}

func UserHomeDirP() string {
	r, err := UserHomeDir()
	if err != nil {
		panic(err)
	}
	return r
}

func UserHomeDir() (string, error) {
	r, err := os.UserHomeDir()
	if err != nil {
		return "", errors.Wrap(err, "get home path")
	}
	return r, nil
}

func MkdirP(fs afero.Fs, path string) {
	if err := Mkdir(fs, path); err != nil {
		panic(err)
	}
}

// Mkdir ...
func Mkdir(fs afero.Fs, path string) error {
	if err := fs.MkdirAll(path, os.ModePerm); err != nil {
		return errors.Wrapf(err, "create directory: %s", path)
	}
	return nil
}

func ReadDirP(fs afero.Fs, path string) []os.FileInfo {
	r, err := ReadDir(fs, path)
	if err != nil {
		panic(err)
	}
	return r
}

func ReadDir(fs afero.Fs, path string) ([]os.FileInfo, error) {
	if err := EnsureDirExists(fs, path); err != nil {
		return nil, err
	}
	f, err := fs.Open(path)
	if err != nil {
		return nil, err
	}
	r, err := f.Readdir(1000)
	if err != nil {
		if err.Error() == "EOF" {
			return []os.FileInfo{}, nil
		}
	}
	return r, err
}

func ListSuffixedFilesP(fs afero.Fs, targetDir string, suffix string, skipEmptyFile bool) map[string]string {
	r, err := ListSuffixedFiles(fs, targetDir, suffix, skipEmptyFile)
	if err != nil {
		panic(err)
	}
	return r
}

func ListSuffixedFiles(fs afero.Fs, targetDir string, suffix string, skipEmptyFile bool) (map[string]string, error) {
	fiList, err := afero.ReadDir(fs, targetDir)
	if err != nil {
		return nil, errors.Wrapf(err, "read directory: %s", targetDir)
	}

	extLen := len(suffix)

	r := map[string]string{}
	for _, fi := range fiList {
		if fi.IsDir() {
			continue
		}
		if skipEmptyFile && fi.Size() == 0 {
			continue
		}

		fBase := filepath.Base(fi.Name())
		if !strings.HasSuffix(fBase, suffix) {
			continue
		}
		if len(fBase) == extLen {
			continue
		}

		fTitle := fBase[:len(fBase)-extLen]
		r[fTitle] = filepath.Join(targetDir, fi.Name())
	}

	return r, nil
}

func ExtractTitle(filePath string) string {
	base := filepath.Base(filePath)
	ext := filepath.Ext(filePath)
	return base[:len(base)-len(ext)]
}

func TempFileP(fs afero.Fs, pattern string) string {
	r, err := TempFile(fs, pattern)
	if err != nil {
		panic(err)
	}
	return r
}

func TempFile(fs afero.Fs, pattern string) (string, error) {
	f, err := afero.TempFile(fs, "", pattern)
	if err != nil {
		return "", errors.Wrap(err, "create temporary file")
	}
	r := f.Name()
	f.Close()

	return r, nil
}

func TempTextFileP(fs afero.Fs, pattern string, content string) string {
	r, err := TempTextFile(fs, pattern, content)
	if err != nil {
		panic(err)
	}
	return r
}

func TempTextFile(fs afero.Fs, pattern string, content string) (string, error) {
	r, err := TempFile(fs, pattern)
	if err != nil {
		return "", err
	}
	if err := WriteFileText(fs, r, content); err != nil {
		return "", err
	}
	return r, nil
}

func IsFileP(fs afero.Fs, path string) bool {
	b, err := IsFile(fs, path)
	if err != nil {
		panic(err)
	}
	return b
}

func IsFile(fs afero.Fs, path string) (bool, error) {
	fi, err := Stat(fs, path, false)
	if err != nil {
		return false, err
	}
	if fi == nil {
		return false, nil
	}
	return !fi.IsDir(), nil
}

func IsDirP(fs afero.Fs, path string) bool {
	b, err := IsDir(fs, path)
	if err != nil {
		panic(err)
	}
	return b
}

func IsDir(fs afero.Fs, path string) (bool, error) {
	fi, err := Stat(fs, path, false)
	if err != nil {
		return false, err
	}
	if fi == nil {
		return false, nil
	}
	return fi.IsDir(), nil
}

type (
	WalkCallback  = func(filePath string)
	ErrorCallback = func(filePath string, err error)
)

func WalkDir(fs afero.Fs,
	ignoreFiles []string,
	dirPath string,
	include FileMatch,
	exclude FileMatch,
	includeCallback WalkCallback,
	excludeCallback WalkCallback,
	errorCallback ErrorCallback,
) {
	dirPath, err := AbsPath(dirPath)
	if err != nil {
		if errorCallback != nil {
			errorCallback(dirPath, err)
		}
		return
	}

	for _, ignoreFile := range ignoreFiles {
		if !filepath.IsAbs(ignoreFile) {
			ignoreFile = path.Join(dirPath, ignoreFile)
		}
		exclude = CompileMatchFile(fs, exclude, ignoreFile)
	}

	files, err := ReadDir(fs, dirPath)
	if err != nil {
		if errorCallback != nil {
			errorCallback(dirPath, err)
		}
		return
	}

	for _, file := range files {
		fileName := file.Name()
		filePath := filepath.Join(dirPath, fileName)
		isDir := file.IsDir()

		includeIt := true
		if exclude != nil {
			includeIt = !exclude.MatchesPath(fileName)
			if includeIt && isDir {
				includeIt = !exclude.MatchesPath(fileName + "/")
			}
		}
		if !isDir && include != nil {
			includeIt = include.MatchesPath(fileName)
		}
		if !includeIt {
			if excludeCallback != nil {
				excludeCallback(filePath)
			}
			continue
		}

		if isDir {
			WalkDir(fs, ignoreFiles, filePath, include, exclude, includeCallback, excludeCallback, errorCallback)
		} else {
			if includeCallback != nil {
				includeCallback(filePath)
			}
		}
	}
}
