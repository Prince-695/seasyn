package postgres_test

import (
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/adapters/postgres"
	"github.com/Prince-695/seasyn/backend/internal/domain"
)

func TestMapPostgresType(t *testing.T) {
	tests := []struct {
		pgType   string
		expected domain.SeasynType
	}{
		{"integer", domain.SeasynTypeInt},
		{"int4", domain.SeasynTypeInt},
		{"bigint", domain.SeasynTypeInt},
		{"smallint", domain.SeasynTypeInt},
		{"serial", domain.SeasynTypeInt},
		{"character varying(255)", domain.SeasynTypeString},
		{"varchar", domain.SeasynTypeString},
		{"text", domain.SeasynTypeString},
		{"boolean", domain.SeasynTypeBool},
		{"bool", domain.SeasynTypeBool},
		{"timestamp with time zone", domain.SeasynTypeTimestamp},
		{"timestamptz", domain.SeasynTypeTimestamp},
		{"date", domain.SeasynTypeTimestamp},
		{"json", domain.SeasynTypeJSON},
		{"jsonb", domain.SeasynTypeJSON},
		{"numeric(10,2)", domain.SeasynTypeDecimal},
		{"decimal", domain.SeasynTypeDecimal},
		{"real", domain.SeasynTypeFloat},
		{"double precision", domain.SeasynTypeFloat},
		{"bytea", domain.SeasynTypeBinary},
		{"uuid", domain.SeasynTypeUUID},
		{"text[]", domain.SeasynTypeArray},
		{"unknown_custom_type", domain.SeasynTypeUnknown},
	}

	for _, tt := range tests {
		got := postgres.MapPostgresType(tt.pgType)
		if got != tt.expected {
			t.Errorf("MapPostgresType(%q) = %v; expected %v", tt.pgType, got, tt.expected)
		}
	}
}
