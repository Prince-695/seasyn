package mysql

import (
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

func TestMapMySQLType(t *testing.T) {
	tests := []struct {
		input    string
		expected domain.SeasonType
	}{
		{"int", domain.SeasonTypeInt},
		{"bigint", domain.SeasonTypeInt},
		{"tinyint(1)", domain.SeasonTypeBool},
		{"varchar(255)", domain.SeasonTypeString},
		{"text", domain.SeasonTypeString},
		{"datetime", domain.SeasonTypeTimestamp},
		{"timestamp", domain.SeasonTypeTimestamp},
		{"double", domain.SeasonTypeFloat},
		{"decimal(10,2)", domain.SeasonTypeDecimal},
		{"json", domain.SeasonTypeJSON},
		{"blob", domain.SeasonTypeBinary},
		{"enum('a','b')", domain.SeasonTypeEnum},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := MapMySQLType(tt.input)
			if got != tt.expected {
				t.Errorf("MapMySQLType(%q) = %v, want %v", tt.input, got, tt.expected)
			}
		})
	}
}

func TestSanitizeMySQLIdentifier(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"users", "users"},
		{"`users`", "users"},
		{" user_table ", "user_table"},
	}

	for _, tt := range tests {
		got := sanitizeMySQLIdentifier(tt.input)
		if got != tt.expected {
			t.Errorf("sanitizeMySQLIdentifier(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}
