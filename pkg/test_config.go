package batchai

type TestConfigT struct {
	AppConfig AppConfig
	ModelId   string `mapstructure:"model_id"`
}

type TestConfig = *TestConfigT

func (me TestConfig) Init(config AppConfig) {
	me.AppConfig = config

	config.LoadModel(me.ModelId)
}
