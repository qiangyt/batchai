package javacontext

type JavaTypeT struct {
	Signature string
	ClassName string
}

type JavaType = *JavaTypeT

// ----------------------------------------------------------------------------

type JavaVariableDefT struct {
	Name        string
	Type        JavaType
	Declaration string
}

type JavaVariableDef = *JavaVariableDefT

// ----------------------------------------------------------------------------

type JavaMethodDefT struct {
	Type          JavaType
	Name          string
	Signature     string
	ArgumentTypes []JavaType
	ReturnType    JavaType
	Imports       []string
	Key           string
	Declaration   string
}

type JavaMethodDef = *JavaMethodDefT

// ----------------------------------------------------------------------------

type JavaMethodContextT struct {
	JavaMethodDefT

	Invocations map[string]JavaMethodDef
	Arguments   []JavaVariableDef
}

type JavaMethodContext = *JavaMethodContextT

// ----------------------------------------------------------------------------

type JavaClassContextT struct {
	ClassName      string
	SourceFilePath string

	TestableMethods []JavaMethodContext
	Imports         []string
}

type JavaClassContext = *JavaClassContextT
