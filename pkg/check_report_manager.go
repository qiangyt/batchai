package batchai

import (
	"path"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type CheckReportManagerT struct {
	reportsMapByFile map[string]CheckReport
	lock             sync.Mutex
}

type CheckReportManager = *CheckReportManagerT

func NewCheckReportManager() CheckReportManager {
	return &CheckReportManagerT{
		reportsMapByFile: map[string]CheckReport{},
	}
}

func (me CheckReportManager) LoadReport(x Kontext, file string) CheckReport {
	me.lock.Lock()
	defer me.lock.Unlock()

	r, has := me.reportsMapByFile[file]
	if has {
		return r
	}

	reportFile := ResolveCheckReportFile(x.Config.CacheDir, x.Args.Repository, file)

	r = &CheckReportT{}
	if err := comm.FromJsonFile(x.Fs, reportFile, false, r); err != nil {
		return nil
	}

	me.reportsMapByFile[file] = r

	return r
}

func (me CheckReportManager) SaveReport(x Kontext, file string, report CheckReport) string {
	me.lock.Lock()
	defer me.lock.Unlock()

	me.reportsMapByFile[file] = report

	reportText := comm.ToJsonP(report, true)
	report.Path = file

	reportFile := ResolveCheckReportFile(x.Config.CacheDir, x.Args.Repository, file)

	comm.Mkdir(x.Fs, path.Dir(reportFile))
	comm.WriteFileText(x.Fs, reportFile, reportText)

	return reportFile
}

func ResolveCheckReportFile(cacheDir string, repository string, file string) string {
	// the file is relative to working directory, so take the relative path
	relativePath := file[len(repository):]
	return path.Join(cacheDir, relativePath+".check.batchai.json")
}
