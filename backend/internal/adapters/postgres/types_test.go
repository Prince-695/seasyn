package postgres_test

import (
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/adapters/postgres"
	"github.com/Prince-695/seasyn/backend/internal/domain"
)

func TestMapPostgresType(t *testing.T) {
	tests := []struct {
		pgType   string
		expected domain.SeasonType
	}{
		{"integer", domain.SeasonTypeInt},
		{"int4", domain.SeasonTypeInt},
		{"bigint", domain.SeasonTypeInt},
		{"smallint", domain.SeasonTypeInt},
		{"serial", domain.SeasonTypeInt},
		{"character varying(255)", domain.SeasonTypeString},
		{"varchar", domain.SeasonTypeString},
		{"text", domain.SeasonTypeString},
		{"boolean", domain.SeasonTypeBool},
		{"bool", domain.SeasonTypeBool},
		{"timestamp with time zone", domain.SeasonTypeTimestamp},
		{"timestamptz", domain.SeasonTypeTimestamp},
		{"date", domain.SeasonTypeTimestamp},
		{"json", domain.SeasonTypeJSON},
		{"jsonb", domain.SeasonTypeJSON},
		{"numeric(10,2)", domain.SeasonTypeDecimal},
		{"decimal", domain.SeasonTypeDecimal},
		{"real", domain.SeasonTypeFloat},
		{"double precision", domain.SeasonTypeFloat},
		{"bytea", domain.SeasonTypeBinary},
		{"uuid", domain.SeasonTypeUUID},
		{"text[]", domain.SeasonTypeArray},
		{"unknown_custom_type", domain.SeasonTypeUnknown},
	}

	for _, tt := range tests {
		got := postgres.MapPostgresType(tt.pgType)
		if got != tt.expected {
			t.Errorf("MapPostgresType(%q) = %v; expected %v", tt.pgType, got, tt.expected)
		}
	}
}
