package batchai

type JavaMethodInfoT struct {
	target   string
	analysis string
	name     string
	body     string
}

type JavaMethodInfo = *JavaMethodInfoT

func NewJavaMethodInfo(target string, analysis string, name string, body string) JavaMethodInfo {
	return &JavaMethodInfoT{
		target:   target,
		analysis: analysis,
		name:     name,
		body:     body,
	}
}

func (me JavaMethodInfo) Target() string {
	return me.target
}

func (me JavaMethodInfo) Analysis() string {
	return me.analysis
}

func (me JavaMethodInfo) Name() string {
	return me.name
}

func (me JavaMethodInfo) Body() string {
	return me.body
}
