package res

import (
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm"
	_ "github.com/qiangyt/batchai/res/statik"
	statikFs "github.com/rakyll/statik/fs"
	"github.com/spf13/afero"
)

const UrlPrefix = "res:"

var _fs http.FileSystem

func init() {
	var err error
	_fs, err = statikFs.NewWithNamespace("res")
	if err != nil {
		panic(errors.Wrap(err, "create resource file system"))
	}
}

func Fs() http.FileSystem {
	return _fs
}

type ResourceT struct {
	path string
}

type Resource = *ResourceT

func FromPath(path string) Resource {
	return &ResourceT{path: path}
}

func FromUrl(url string) Resource {
	return FromPath(Path(url))
}

func (me Resource) Path() string {
	return me.path
}

func (me Resource) Url() string {
	return filepath.Join(UrlPrefix, me.path)
}

func IsUrl(url string) bool {
	return strings.HasPrefix(url, UrlPrefix)
}

func Path(url string) string {
	return url[len(UrlPrefix):]
}

func (me Resource) Open() http.File {
	r, err := Fs().Open(me.Path())
	if err != nil {
		panic(errors.Wrapf(err, "open resource: %s", me.Path()))
	}
	return r
}

func (me Resource) CopyToDir(afs afero.Fs, targetDir string) {
	targetPath := filepath.Join(targetDir, me.Path())
	me.CopyToFile(afs, targetPath)
}

func (me Resource) CopyToFile(afs afero.Fs, targetFile string) {
	content := me.ReadBytes()

	comm.MkdirP(afs, filepath.Dir(targetFile))
	comm.WriteFileP(afs, targetFile, content)
}

func (me Resource) ReadBytes() []byte {
	f := me.Open()
	defer f.Close()

	return comm.ReadBytesP(f)
}

func (me Resource) ReadText() string {
	return string(me.ReadBytes())
}

func (me Resource) RenderWithTemplate(w io.Writer, data map[string]any) {
	comm.RenderWithTemplateP(w, me.Path(), me.ReadText(), data)
}
