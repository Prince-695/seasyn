package mysql

import (
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

func TestMapMySQLType(t *testing.T) {
	tests := []struct {
		input    string
		expected domain.SeasynType
	}{
		{"int", domain.SeasynTypeInt},
		{"bigint", domain.SeasynTypeInt},
		{"tinyint(1)", domain.SeasynTypeBool},
		{"varchar(255)", domain.SeasynTypeString},
		{"text", domain.SeasynTypeString},
		{"datetime", domain.SeasynTypeTimestamp},
		{"timestamp", domain.SeasynTypeTimestamp},
		{"double", domain.SeasynTypeFloat},
		{"decimal(10,2)", domain.SeasynTypeDecimal},
		{"json", domain.SeasynTypeJSON},
		{"blob", domain.SeasynTypeBinary},
		{"enum('a','b')", domain.SeasynTypeEnum},
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
