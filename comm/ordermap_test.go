package comm

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test_OrderedMap_happy(t *testing.T) {
	a := require.New(t)

	m := comm.NewOrderedMap("")
	a.Equal(0, m.Len())
	a.Equal(0, m.Keys().Size())
	a.Len(m.Values(), 0)

	m.Put("k1", "v1")
	m.Put("k2", "v2")

	a.Equal(2, m.Len())
	a.Equal(2, m.Keys().Size())
	a.Len(m.Values(), 2)

	a.Equal("v1", m.Get("k1"))
	a.True(m.Has("k1"))
	v1, b1 := m.Find("k1")
	a.True(b1)
	a.Equal("v1", v1)

	a.Equal("v2", m.Get("k2"))
	a.True(m.Has("k2"))
	v2, b2 := m.Find("k2")
	a.True(b2)
	a.Equal("v2", v2)

	a.Equal("", m.Get("k3"))
	a.False(m.Has("k3"))

	m.Delete("k2")
	a.Equal(1, m.Len())
	a.Equal("", m.Get("k2"))
	a.False(m.Has("k2"))

	entries := m.Entries()
	a.Len(entries, 1)
	a.Equal("k1", entries[0].Key)
	a.Equal("v1", entries[0].Value)
}

func Test_OrderedMap_json(t *testing.T) {
	a := require.New(t)

	m := comm.NewOrderedMap("")
	m.Put("k1", "v1")

	json, err := m.MarshalJSON()
	a.Nil(err)
	a.Equal(`{"k1"
:"v1"
}`, (string(json)))

	m2 := comm.NewOrderedMap("")
	err = m2.UnmarshalJSON(json)
	a.Nil(err)
	a.Equal(m, m2)
}

func Test_OrderedMap_putAll(t *testing.T) {
	a := require.New(t)

	type Element struct {
		Name  string
		Value string
	}

	m := comm.NewOrderedMap[*Element](nil)
	m.PutAll(func(elt *Element) string {
		return elt.Name
	}, []*Element{
		{Name: "n1", Value: "v1"},
		{Name: "n2", Value: "v2"},
	})

	a.Equal(2, m.Len())
	a.Equal(2, m.Keys().Size())
	a.Len(m.Values(), 2)

	a.Equal("v1", m.Get("n1").Value)
	a.Equal("v2", m.Get("n2").Value)
}

func Test_OrderedMap_putIfAbsent(t *testing.T) {
	a := require.New(t)

	m := comm.NewOrderedMap("")
	a.True(m.PutIfAbsent("n", "v"))
	a.False(m.PutIfAbsent("n", "v-changed"))

	a.Equal("v", m.Get("n"))
}

func Test_OrderedMap_sort(t *testing.T) {
	a := require.New(t)

	m := comm.NewOrderedMap("")
	m.Put("k1", "v1")
	m.Put("k2", "v2")

	m.SortByKey(false)
	a.Equal(2, m.Len())
	a.True(m.Keys().Contains("k1"))
	a.True(m.Keys().Contains("k2"))
	a.Equal("v1", m.Values()[0])
	a.Equal("v2", m.Values()[1])

	m.SortByKey(true)
	a.Equal(2, m.Len())
	a.True(m.Keys().Contains("k1"))
	a.True(m.Keys().Contains("k2"))
	a.Equal("v2", m.Values()[0])
	a.Equal("v1", m.Values()[1])
}
