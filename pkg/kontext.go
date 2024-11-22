package batchai

import (
	"context"
	"time"

	"github.com/spf13/afero"
)

type KontextT struct {
	Context context.Context
	Fs      afero.Fs
	Args    AppArgs
	Config  AppConfig
}

type Kontext = *KontextT

func NewKontext(fs afero.Fs) Kontext {
	return &KontextT{
		Context: context.TODO(),
		Fs:      fs,
		Args:    nil,
		Config:  nil,
	}
}

func (me Kontext) Timeouted(timeout time.Duration) Kontext {
	timeoutCtx, _ := context.WithTimeout(me.Context, timeout)
	return &KontextT{
		Context: timeoutCtx,
		Fs:      me.Fs,
		Args:    me.Args,
		Config:  me.Config,
	}
}
