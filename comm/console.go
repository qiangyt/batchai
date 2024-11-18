package comm

import (
	"fmt"
	"strings"
)

type Color int

const (
	DEFAULT_COLOR Color = iota
	RED
	GREEN
	YELLOW
	BLUE
	GRAY
)

var colorCodes = map[Color]string{
	DEFAULT_COLOR: "\033[0m",
	RED:           "\033[31m",
	GREEN:         "\033[32m",
	YELLOW:        "\033[33m",
	BLUE:          "\033[34m",
	GRAY:          "\033[37m",
}

type ConsoleT struct {
	indent     int
	left       *ConsoleT
	prefix     string
	linePrefix string
	color      Color

	passThroughBuffer bool
	buf               []string
}

type Console = *ConsoleT

func (me Console) Red(s ...any) Console {
	return me.Color(RED, s...)
}

func (me Console) Redln(s ...any) Console {
	return me.Colorln(RED, s...)
}

func (me Console) Redf(format string, a ...interface{}) Console {
	return me.Colorf(RED, format, a...)
}

func (me Console) Green(s ...any) Console {
	return me.Color(GREEN, s...)
}

func (me Console) Greenln(s ...any) Console {
	return me.Colorln(GREEN, s...)
}

func (me Console) Greenf(format string, a ...interface{}) Console {
	return me.Colorf(GREEN, format, a...)
}

func (me Console) Yellow(s ...any) Console {
	me.color = YELLOW
	me.print(fmt.Sprint(s...))
	return me
}

func (me Console) Yellowln(s ...any) Console {
	return me.Colorln(YELLOW, s...)
}

func (me Console) Yellowf(format string, a ...interface{}) Console {
	return me.Colorf(YELLOW, format, a...)
}

func (me Console) Blue(s ...any) Console {
	return me.Color(BLUE, s...)
}

func (me Console) Blueln(s ...any) Console {
	return me.Colorln(BLUE, s...)
}

func (me Console) Bluef(format string, a ...interface{}) Console {
	return me.Colorf(BLUE, format, a...)
}

func (me Console) Gray(s ...any) Console {
	return me.Color(GRAY, s...)
}

func (me Console) Grayln(s ...any) Console {
	return me.Colorln(GRAY, s...)
}

func (me Console) Grayf(format string, a ...interface{}) Console {
	return me.Colorf(GRAY, format, a...)
}

func (me Console) Color(color Color, s ...any) Console {
	me.color = color
	me.print(fmt.Sprint(s...))
	return me
}

func (me Console) Colorf(color Color, format string, a ...interface{}) Console {
	me.color = color
	me.print(fmt.Sprintf(format, a...))
	return me
}

func (me Console) Colorln(color Color, s ...any) Console {
	me.color = color
	me.print(fmt.Sprintln(s...))
	return me
}

func (me Console) Default(s ...any) Console {
	me.color = DEFAULT_COLOR
	me.print(fmt.Sprint(s...))
	return me
}

func (me Console) Defaultf(format string, a ...interface{}) Console {
	me.color = DEFAULT_COLOR
	me.print(fmt.Sprintf(format, a...))
	return me
}

func (me Console) Defaultln(s ...any) Console {
	me.color = DEFAULT_COLOR
	me.print(fmt.Sprintln(s...))
	return me
}

func (me Console) Printf(format string, a ...interface{}) Console {
	me.print(fmt.Sprintf(format, a...))
	return me
}

func (me Console) Println(a ...interface{}) Console {
	me.print(fmt.Sprintln(a...))
	return me
}

func (me Console) Print(a ...interface{}) Console {
	me.print(fmt.Sprint(a...))
	return me
}

func (me Console) NewLine() Console {
	me.Defaultln(me.prefix)
	return me
}

func (me Console) print(msg string) {
	colorCode := colorCodes[me.color]
	s := fmt.Sprintf("%s%s", colorCode, strings.ReplaceAll(msg, "\n", me.linePrefix))

	if me.left == nil {
		if me.buf == nil {
			fmt.Print(s)
		} else {
			me.buf = append(me.buf, s)
		}
	} else {
		if me.left.buf == nil {
			fmt.Print(s)
		} else {
			me.left.buf = append(me.left.buf, s)
		}
	}
}

func (me Console) Begin() {
	if me.passThroughBuffer {
		return
	}
	me.buf = []string{}
}

func (me Console) End() {
	if me.passThroughBuffer {
		return
	}

	if me.buf == nil || len(me.buf) == 0 {
		return
	}

	fmt.Print(strings.Join(me.buf, ""))
	me.buf = nil
}

func NewConsole(passThroughBuffer bool) Console {
	return &ConsoleT{
		indent:            0,
		left:              nil,
		prefix:            "",
		linePrefix:        "\n",
		color:             DEFAULT_COLOR,
		passThroughBuffer: passThroughBuffer,
		buf:               nil,
	}
}

func (me Console) NewIndented() Console {
	indent := me.indent + 4
	prefix := strings.Repeat(" ", indent)

	return &ConsoleT{
		indent:            indent,
		left:              me,
		prefix:            prefix,
		linePrefix:        "\n" + prefix,
		color:             DEFAULT_COLOR,
		passThroughBuffer: me.passThroughBuffer,
		buf:               nil,
	}
}
