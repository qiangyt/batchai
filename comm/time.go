package comm

import (
	"fmt"
	"time"
)

func FormatDurationForConsole(d time.Duration) string {
	days := d / (24 * time.Hour)
	d = d % (24 * time.Hour)
	hours := d / time.Hour
	d = d % time.Hour
	minutes := d / time.Minute
	d = d % time.Minute
	seconds := d.Seconds()

	if days > 0 {
		return fmt.Sprintf("%d day %d hour %d min %.0f sec", days, hours, minutes, seconds)
	} else if hours > 0 {
		return fmt.Sprintf("%d hour %d min %.0f sec", hours, minutes, seconds)
	} else if minutes > 0 {
		return fmt.Sprintf("%d min %.0f sec", minutes, seconds)
	} else if seconds >= 1.0 {
		return fmt.Sprintf("%.3f sec", seconds)
	} else {
		return fmt.Sprintf("%d ms", int(d.Milliseconds()))
	}
}
