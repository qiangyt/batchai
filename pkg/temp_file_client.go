package batchai

import (
	"context"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm/rest"
)

type TempFileClientT struct {
	rest.ApiClientT
}

type TempFileClient = *TempFileClientT

func NewTempFileClient() TempFileClient {
	return &TempFileClientT{
		ApiClientT: *rest.NewApiClient("rest/v1/files/temp"),
	}
}

func (me TempFileClient) Upload(ctx context.Context, path string) string {
	r := ""
	if _, err := me.For(ctx).SetResult(&r).SetFile("file", path).Post("/"); err != nil {
		panic(errors.Wrapf(err, "failed to upload file: %s", path))
	}
	return r
}
