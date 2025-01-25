package javacontext

import (
	"context"

	"github.com/pkg/errors"
	"github.com/qiangyt/batchai/comm/rest"
	batchai "github.com/qiangyt/batchai/pkg"
)

type ClassContextClientT struct {
	rest.ApiClientT

	tempFileClient batchai.TempFileClient
}

type ClassContextClient = *ClassContextClientT

func NewClassContextClient() ClassContextClient {
	return &ClassContextClientT{
		ApiClientT:     *rest.NewApiClient("rest/v1/javacontext/class"),
		tempFileClient: batchai.NewTempFileClient(),
	}
}

func (me ClassContextClient) Init() {
	if me.IsInited() {
		return
	}

	me.tempFileClient.Init()
	me.ApiClientT.Init()
}

func (me ClassContextClient) ParseClass(ctx context.Context, classFilePath string) JavaClassContext {
	tempFileName := me.tempFileClient.Upload(ctx, classFilePath)

	r := JavaClassContextT{}
	if _, err := me.For(ctx).SetResult(&r).Get("/" + tempFileName); err != nil {
		panic(errors.Wrap(err, ""))
	}
	return &r
}
