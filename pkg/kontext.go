package batchai

import (
	"context"

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
