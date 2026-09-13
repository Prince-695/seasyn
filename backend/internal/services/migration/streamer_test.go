package migration

import (
	"testing"
	"time"
)

func TestEstimateBatchBytes(t *testing.T) {
	// 1. Empty rows
	if b := estimateBatchBytes(nil); b != 0 {
		t.Errorf("expected 0 bytes for nil batch, got %d", b)
	}

	// 2. Normal batch of rows
	rows := []map[string]interface{}{
		{
			"id":         "usr-1",
			"email":      "test1@example.com",
			"age":        30,
			"is_active":  true,
			"created_at": time.Now(),
		},
		{
			"id":         "usr-2",
			"email":      "test2@example.com",
			"age":        28,
			"is_active":  false,
			"created_at": time.Now(),
		},
	}

	bytesEst := estimateBatchBytes(rows)
	if bytesEst <= 0 {
		t.Errorf("expected positive byte estimate, got %d", bytesEst)
	}
}

func TestFormatBytes(t *testing.T) {
	tests := []struct {
		input    int64
		expected string
	}{
		{500, "500 B"},
		{1024, "1.00 KB"},
		{1048576, "1.00 MB"},
		{1073741824, "1.00 GB"},
	}

	for _, tc := range tests {
		got := formatBytes(tc.input)
		if got != tc.expected {
			t.Errorf("for %d expected %s, got %s", tc.input, tc.expected, got)
		}
	}
}
