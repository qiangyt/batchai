package batchai

import (
	"path"
	"sync"

	"github.com/qiangyt/batchai/comm"
)

type ReviewReportManagerT struct {
	reportsMapByFile map[string]ReviewReport
	lock             sync.Mutex
}

type ReviewReportManager = *ReviewReportManagerT

func NewReviewReportManager() ReviewReportManager {
	return &ReviewReportManagerT{
		reportsMapByFile: map[string]ReviewReport{},
	}
}

func (me ReviewReportManager) LoadReport(x Kontext, file string) ReviewReport {
	me.lock.Lock()
	defer me.lock.Unlock()

	r, has := me.reportsMapByFile[file]
	if has {
		return r
	}

	reportFile := ResolveReviewReportFile(x.Config.CacheDir, x.ReviewArgs.Repository, file)

	r = &ReviewReportT{}
	if err := comm.FromJsonFile(x.Fs, reportFile, false, r); err != nil {
		return nil
	}

	me.reportsMapByFile[file] = r

	return r
}

func (me ReviewReportManager) SaveReport(x Kontext, file string, report ReviewReport) string {
	me.lock.Lock()
	defer me.lock.Unlock()

	me.reportsMapByFile[file] = report

	reportText := comm.ToJsonP(report, true)
	report.Path = file

	reportFile := ResolveReviewReportFile(x.Config.CacheDir, x.ReviewArgs.Repository, file)

	comm.Mkdir(x.Fs, path.Dir(reportFile))
	comm.WriteFileText(x.Fs, reportFile, reportText)

	return reportFile
}

func ResolveReviewReportFile(cacheDir string, repository string, file string) string {
	// the file is relative to working directory, so take the relative path
	relativePath := file[len(repository):]
	repoName := path.Base(repository)
	return path.Join(cacheDir, repoName, relativePath+".review.json")
}
