package batchai

import (
	"path"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type TestReportManagerT struct {
	reportsMapByFile map[string]TestReport
	lock             sync.Mutex
}

type TestReportManager = *TestReportManagerT

func NewTestReportManager() TestReportManager {
	return &TestReportManagerT{
		reportsMapByFile: map[string]TestReport{},
	}
}

func (me TestReportManager) LoadReport(x Kontext, file string) TestReport {
	me.lock.Lock()
	defer me.lock.Unlock()

	r, has := me.reportsMapByFile[file]
	if has {
		return r
	}

	reportFile := ResolveTestReportFile(x.Config.CacheDir, x.Args.Repository, file)

	r = &TestReportT{}
	if err := comm.FromJsonFile(x.Fs, reportFile, false, r); err != nil {
		return nil
	}

	me.reportsMapByFile[file] = r

	return r
}

func (me TestReportManager) SaveReport(x Kontext, file string, report TestReport) string {
	me.lock.Lock()
	defer me.lock.Unlock()

	me.reportsMapByFile[file] = report

	reportText := comm.ToJsonP(report, true)
	report.Path = file

	reportFile := ResolveTestReportFile(x.Config.CacheDir, x.Args.Repository, file)

	comm.Mkdir(x.Fs, path.Dir(reportFile))
	comm.WriteFileText(x.Fs, reportFile, reportText)

	return reportFile
}

func ResolveTestReportFile(cacheDir string, repository string, file string) string {
	// the file is relative to working directory, so take the relative path
	relativePath := file[len(repository):]
	repoName := path.Base(repository)
	return path.Join(cacheDir, repoName, relativePath+".test.json")
}
