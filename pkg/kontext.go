package batchai

import (
	"context"

	"github.com/spf13/afero"
)

type KontextT struct {
	Context    context.Context
	Fs         afero.Fs
	ReviewArgs ReviewArgs
	Config     AppConfig
}

type Kontext = *KontextT

func NewKontext(fs afero.Fs) Kontext {
	return &KontextT{
		Context:    context.TODO(),
		Fs:         fs,
		ReviewArgs: nil,
		Config:     nil,
	}
}
