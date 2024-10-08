package batchai

import (
	"path"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type CodeFileT struct {
	Original string
	Latest   string
}

type CodeFile = *CodeFileT

func (me CodeFile) IsChanged() bool {
	return me.Original != me.Latest
}

type CodeFileManagerT struct {
	files map[string]CodeFile
	lock  sync.Mutex
}

type CodeFileManager = *CodeFileManagerT

func NewCodeFileManager() CodeFileManager {
	return &CodeFileManagerT{
		files: map[string]CodeFile{},
	}
}

func ResolveOriginalCodeFile(cacheDir string, repository string, file string) string {
	// the file is relative to working directory, so take the relative path
	relativePath := file[len(repository):]
	repoName := path.Base(repository)
	return path.Join(cacheDir, repoName, relativePath)
}

func (me CodeFileManager) Load(x Kontext, file string) CodeFile {
	me.lock.Lock()
	defer me.lock.Unlock()

	r, has := me.files[file]
	if has {
		return r
	}

	fs := x.Fs
	latest := comm.ReadFileTextP(fs, file)

	r = &CodeFileT{Latest: latest}

	originalPath := ResolveOriginalCodeFile(x.Config.CacheDir, x.ReviewArgs.Repository, file)
	if comm.FileExistsP(fs, originalPath) {
		r.Original = comm.ReadFileTextP(fs, originalPath)
	} else {
		comm.MkdirP(fs, path.Dir(originalPath))
		comm.WriteFileTextP(fs, originalPath, latest)
		r.Original = latest
	}

	me.files[file] = r

	return r
}

func (me CodeFileManager) Save(x Kontext, file string, fixed string) {
	me.lock.Lock()
	defer me.lock.Unlock()

	comm.WriteFileTextP(x.Fs, file, fixed)

	originalPath := ResolveOriginalCodeFile(x.Config.CacheDir, x.ReviewArgs.Repository, file)
	comm.MkdirP(x.Fs, path.Dir(originalPath))
	comm.WriteFileTextP(x.Fs, originalPath, fixed)

	codeFile, has := me.files[file]
	if !has {
		codeFile = &CodeFileT{}
		me.files[file] = codeFile
	}

	codeFile.Latest = fixed
	codeFile.Original = fixed
}
