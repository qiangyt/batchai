package comm

import (
	"dario.cat/mergo"
	"github.com/divideandconquer/go-merge/merge"
	"github.com/emirpasic/gods/sets/hashset"
	"github.com/pkg/errors"
)

func Set2Strings(set *hashset.Set) []string {
	r := make([]string, 0, set.Size())
	for _, v := range set.Values() {
		r = append(r, v.(string))
	}
	return r
}

func Slice2Set[T comparable](arr ...T) *hashset.Set {
	r := hashset.New()
	for _, a := range arr {
		r.Add(a)
	}
	return r
}

func Slice2Map[V any](arr []V, keyFunc func(v V) string) map[string]V {
	r := map[string]V{}
	for _, v := range arr {
		k := keyFunc(v)
		r[k] = v
	}
	return r
}

func DowncastMap[V any](m map[string]V) map[string]any {
	r := map[string]any{}
	for k, v := range m {
		r[k] = v
	}
	return r
}

/*TODO
func SliceString[T any](a []T) string {
	if a == nil {
		return "nil"
	}
	r := make([]string, len(a))
	for i, t := range a {
		r[i] = t.String() // Fixed the method call here
	}
	return strings.Join(r, ", ")
}*/

func SliceEquals[T comparable](a []T, b []T) bool {
	if len(a) != len(b) {
		return false
	}

	if (a == nil) != (b == nil) {
		return false
	}

	for i, eltA := range a {
		if eltA != b[i] {
			return false
		}
	}

	return true
}

func MergeMap[T any](bases ...map[string]T) map[string]T {
	r := map[string]T{}
	for _, base := range bases {
		if err := mergo.Merge(&r, base, mergo.WithOverride); err != nil {
			panic(errors.Wrap(err, "merge error"))
		}
		// r = merge.Merge(r, base).(map[string]T)
	}

	return r
}

func DeepCopyMap[T any](that map[string]T) map[string]T {
	return merge.Merge(map[string]T{}, that).(map[string]T)
}
