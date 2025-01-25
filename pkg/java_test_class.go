package batchai

import (
	"fmt"

	"github.com/qiangyt/batchai/comm"
)

type JavaTestClassT struct {
	targetFile         string
	targetFileRelative string
	targetClass        string

	Skeleton string

	testMethodByName    *comm.OrderedMap[JavaTestMethod]
	testMethodsByTarget map[string]map[string]JavaTestMethod
}

type JavaTestClass = *JavaTestClassT

func NewJavaTestFile(x Kontext, targetFile string, targetClass string) JavaTestClass {
	return &JavaTestClassT{
		targetFile:          targetFile,
		targetFileRelative:  targetFile[len(x.Args.Repository)+1:],
		targetClass:         targetClass,
		testMethodByName:    comm.NewOrderedMap[JavaTestMethod](nil),
		testMethodsByTarget: make(map[string]map[string]JavaTestMethod),
	}
}

func (me JavaTestClass) AddTestMethod(testMethod JavaTestMethod) {
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

func (me JavaTestClass) FindTestMethodByName(name string) JavaTestMethod {
	r, exists := me.testMethodByName.Find(name)
	if !exists {
		return nil
	}
	return r
}

func (me JavaTestClass) ListTestMethodsByTarget(target string) map[string]JavaTestMethod {
	r, exists := me.testMethodsByTarget[target]
	if !exists {
		return map[string]*JavaTestMethodT{}
	}
	return r
}
