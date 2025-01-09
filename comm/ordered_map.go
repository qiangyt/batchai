package comm

import (
	"strings"

	"github.com/emirpasic/gods/sets/hashset"
	"github.com/iancoleman/orderedmap"
)

type OrderedMap[K any] struct {
	backend  *orderedmap.OrderedMap
	nilValue K
}

type KeyValue[K any] struct {
	Key   string
	Value K
}

func NewOrderedMap[K any](nilValue K) *OrderedMap[K] {
	backend := orderedmap.New()
	backend.SetEscapeHTML(false)

	return &OrderedMap[K]{
		backend:  backend,
		nilValue: nilValue,
	}
}

func (me *OrderedMap[K]) Find(key string) (K, bool) {
	r, exists := me.backend.Get(key)
	if !exists {
		return me.nilValue, false
	}
	return r.(K), true
}

func (me *OrderedMap[K]) Get(key string) K {
	r, exists := me.backend.Get(key)
	if !exists {
		return me.nilValue
	}
	return r.(K)
}

func (me *OrderedMap[K]) Has(key string) bool {
	_, exists := me.backend.Get(key)
	return exists
}

func (me *OrderedMap[K]) Len() int {
	return len(me.backend.Keys())
}

func (me *OrderedMap[K]) Put(key string, value K) {
	me.backend.Set(key, value)
}

func (me *OrderedMap[K]) PutIfAbsent(key string, value K) bool {
	if !me.Has(key) {
		me.Put(key, value)
		return true
	}
	return false
}

func (me *OrderedMap[K]) PutAll(nameResolver func(v K) string, values []K) {
	for _, value := range values {
		k := nameResolver(value)
		me.Put(k, value)
	}
}

func (me *OrderedMap[K]) Delete(key string) {
	me.backend.Delete(key)
}

func (me *OrderedMap[K]) Keys() *hashset.Set {
	r := hashset.New()
	for _, k := range me.backend.Keys() {
		r.Add(k)
	}
	return r
}

func (me *OrderedMap[K]) Values() []K {
	r := make([]K, 0, me.Len())

	for _, k := range me.backend.Keys() {
		v, _ := me.Find(k)
		r = append(r, v)
	}

	return r
}

func (me *OrderedMap[K]) Entries() []*KeyValue[K] {
	r := make([]*KeyValue[K], 0, me.Len())

	for _, k := range me.backend.Keys() {
		v, exists := me.Find(k)
		if exists {
			kv := &KeyValue[K]{
				Key:   k,
				Value: v,
			}
			r = append(r, kv)
		}
	}

	return r
}

func (me *OrderedMap[K]) UnmarshalJSON(bytes []byte) error {
	return me.backend.UnmarshalJSON(bytes)
}

func (me *OrderedMap[K]) MarshalJSON() ([]byte, error) {
	return me.backend.MarshalJSON()
}

func (me *OrderedMap[K]) SortByKey(revert bool) {
	me.backend.Sort(func(a *orderedmap.Pair, b *orderedmap.Pair) bool {
		r := strings.Compare(a.Key(), b.Key())
		if revert {
			return r > 0
		}
		return r < 0
	})
}

func (me *OrderedMap[K]) ToMap() map[string]K {
	r := map[string]K{}
	for _, entry := range me.Entries() {
		r[entry.Key] = entry.Value
	}
	return r
}
