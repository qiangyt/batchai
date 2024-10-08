package comm

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestRequiredStringP_panic(t *testing.T) {
	a := require.New(t)

	m := map[string]any{
		"key1": 123,
	}

	// Test that StringP panics when the specified key exists in the map but cannot be parsed as a string.
	a.Panics(func() { RequiredStringP("task", "key1", m) })
}

func TestRequiredStringP(t *testing.T) {
	a := require.New(t)

	m := map[string]any{
		"key1": "value1",
		"key2": "value2",
	}

	// Test that StringP returns the value of the specified key when it exists in the map.
	r := RequiredStringP("test", "key1", m)
	a.Equal("value1", r)

	// Test that StringP panics when the specified key does not exist in the map.
	a.Panics(func() { RequiredStringP("test", "key3", m) })
}

func TestOptionalStringP_panic(t *testing.T) {
	a := require.New(t)

	m := map[string]any{
		"key1": 123,
	}

	// Test that OptionalStringP panics when the specified key exists in the map but cannot be parsed as a string.
	a.Panics(func() { OptionalStringP("task", "key1", m, "default") })
}

func TestOptionalStringP(t *testing.T) {
	a := require.New(t)

	m := map[string]any{
		"key1": "value1",
		"key2": "value2",
	}

	// Test that OptionalStringP returns the value of the specified key when it exists in the map.
	r, has := OptionalStringP("test", "key1", m, "default")
	a.True(has)
	a.Equal("value1", r)

	// Test that OptionalStringP returns the default value when the specified key does not exist in the map.
	r, has = OptionalStringP("test", "key3", m, "default")
	a.False(has)
	a.Equal("default", r)

	// Test that OptionalStringP panics when the specified key exists in the map but cannot be parsed as a string.
	m["key4"] = 123
	a.Panics(func() { OptionalStringP("test", "key4", m, "default") })
}

func TestStringArrayValueP_panic(t *testing.T) {
	a := require.New(t)

	m := map[string]any{
		"key1": "not-a-slice-value",
	}

	// Test that StringArrayValueP panics when the specified key exists in the map but cannot be parsed as a string slice.
	a.Panics(func() { StringArrayValueP("task", "key1", m) })
}

func TestStringArrayValueP(t *testing.T) {
	a := require.New(t)

	m := map[string]any{
		"key1": []string{"value1", "value2"},
		"key2": []string{"value3", "value4"},
	}

	// Test that StringArrayValueP returns the value of the specified key when it exists in the map.
	r := StringArrayValueP("test", "key1", m)
	a.Equal([]string{"value1", "value2"}, r)

	// Test that StringArrayValueP panics when the specified key does not exist in the map.
	a.Panics(func() { StringArrayValueP("test", "key3", m) })
}

func TestOptionalStringArrayValueP_panic(t *testing.T) {
	a := require.New(t)
	m := map[string]any{
		"key1": "not-a-slice-value",
	}

	// Test that OptionalStringArrayValueP panics when the specified key exists in the map but cannot be parsed as a string slice.
	a.Panics(func() { OptionalStringArrayValueP("task", "key1", m, []string{"default"}) })
}

func TestOptionalStringArrayValueP(t *testing.T) {
	a := require.New(t)

	m := map[string]any{
		"key1": []string{"value1", "value2"},
		"key2": []string{"value3", "value4"},
	}

	// Test that OptionalStringArrayValueP returns the value of the specified key when it exists in the map.
	r, has := OptionalStringArrayValueP("test", "key1", m, []string{"default"})
	a.True(has)
	a.Equal([]string{"value1", "value2"}, r)
	//if !reflect.DeepEqual(r, []string{"value1", "value2"}) {
	//	t.Errorf("expected ['value1', 'value2'], but got '%v'", r)
	//}

	// Test that OptionalStringArrayValueP returns the default value when the specified key does not exist in the map.
	r, has = OptionalStringArrayValueP("test", "key3", m, []string{"default"})
	a.False(has)
	a.Equal([]string{"default"}, r)

	// Test that OptionalStringArrayValueP panics when the specified key exists in the map but cannot be parsed as a string slice.
	m["key4"] = "not-a-slice-value"
	/*defer func() {
		if r := recover(); r == nil {
			t.Errorf("expected panic, but got nil")
		} else {
			err, ok := r.(error)
			if !ok {
				t.Errorf("expected error, but got %v", r)
			}
			expected := "test.key4 must be a string array, but now it is a string(not-a-slice-value)"
			if err.Error() != expected {
				t.Errorf("expected error message '%s', but got '%s'", expected, err.Error())
			}
		}
	}()*/
	a.Panics(func() { OptionalStringArrayValueP("test", "key4", m, []string{"default"}) })
}
