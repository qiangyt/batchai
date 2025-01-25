package batchai

type JavaTestMethodT struct {
	target   string
	analysis string
	name     string
	body     string
}

type JavaTestMethod = *JavaTestMethodT

func NewJavaTestMethod(target string, analysis string, name string, body string) JavaTestMethod {
	return &JavaTestMethodT{
		target:   target,
		analysis: analysis,
		name:     name,
		body:     body,
	}
}

func (me JavaTestMethod) Target() string {
	return me.target
}

func (me JavaTestMethod) Analysis() string {
	return me.analysis
}

func (me JavaTestMethod) Name() string {
	return me.name
}

func (me JavaTestMethod) Body() string {
	return me.body
}
