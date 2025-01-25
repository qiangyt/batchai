package batchai

import (
	"fmt"

	"github.com/qiangyt/batchai/comm"
)

type JavaClassInfoT struct {
	absPath      string
	relativePath string
	name         string

	Skeleton string

	testMethodByName    *comm.OrderedMap[JavaTestMethod]
	testMethodsByTarget map[string]map[string]JavaTestMethod
}

type JavaClassInfo = *JavaClassInfoT

func NewJavaTestFile(x Kontext, targetFile string, targetClass string) JavaClassInfo {
	return &JavaClassInfoT{
		absPath:             targetFile,
		relativePath:        targetFile[len(x.Args.Repository)+1:],
		name:                targetClass,
		testMethodByName:    comm.NewOrderedMap[JavaTestMethod](nil),
		testMethodsByTarget: make(map[string]map[string]JavaTestMethod),
	}
}

func (me JavaClassInfo) AddTestMethod(testMethod JavaTestMethod) {
	name := testMethod.Name()

	if !me.testMethodByName.PutIfAbsent(name, testMethod) {
		panic(fmt.Errorf("duplicated test method name: %s", name))
	}

	target := testMethod.Target()
	targetTestMethods, has := me.testMethodsByTarget[target]
	if !has {
		targetTestMethods = make(map[string]JavaTestMethod)
		me.testMethodsByTarget[target] = targetTestMethods
		targetTestMethods[name] = testMethod
	}
	targetTestMethods[name] = testMethod
}

func (me JavaClassInfo) FindTestMethodByName(name string) JavaTestMethod {
	r, exists := me.testMethodByName.Find(name)
	if !exists {
		return nil
	}
	return r
}

func (me JavaClassInfo) ListTestMethodsByTarget(target string) map[string]JavaTestMethod {
	r, exists := me.testMethodsByTarget[target]
	if !exists {
		return map[string]*JavaTestMethodT{}
	}
	return r
}
