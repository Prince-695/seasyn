package postgres

import (
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// MapPostgresType converts a PostgreSQL native data type to a universal SeasynType.
func MapPostgresType(pgType string) domain.SeasynType {
	normalized := strings.ToLower(strings.TrimSpace(pgType))

	// Priority 1: Check array types first
	if strings.HasSuffix(normalized, "[]") || strings.HasPrefix(normalized, "array") || strings.HasPrefix(normalized, "_") {
		return domain.SeasynTypeArray
	}

	// Priority 2: Base / scalar types
	switch {
	case strings.HasPrefix(normalized, "int"),
		strings.HasPrefix(normalized, "smallint"),
		strings.HasPrefix(normalized, "bigint"),
		strings.HasPrefix(normalized, "serial"),
		strings.HasPrefix(normalized, "bigserial"),
		strings.HasPrefix(normalized, "smallserial"):
		return domain.SeasynTypeInt

	case strings.HasPrefix(normalized, "varchar"),
		strings.HasPrefix(normalized, "character"),
		strings.HasPrefix(normalized, "text"),
		strings.HasPrefix(normalized, "citext"),
		normalized == "name":
		return domain.SeasynTypeString

	case strings.HasPrefix(normalized, "bool"):
		return domain.SeasynTypeBool

	case strings.HasPrefix(normalized, "timestamp"),
		strings.HasPrefix(normalized, "date"),
		strings.HasPrefix(normalized, "time"),
		strings.HasPrefix(normalized, "interval"):
		return domain.SeasynTypeTimestamp

	case strings.HasPrefix(normalized, "json"):
		return domain.SeasynTypeJSON

	case strings.HasPrefix(normalized, "float"),
		strings.HasPrefix(normalized, "real"),
		strings.HasPrefix(normalized, "double"):
		return domain.SeasynTypeFloat

	case strings.HasPrefix(normalized, "numeric"),
		strings.HasPrefix(normalized, "decimal"),
		strings.HasPrefix(normalized, "money"):
		return domain.SeasynTypeDecimal

	case strings.HasPrefix(normalized, "bytea"),
		strings.HasPrefix(normalized, "blob"):
		return domain.SeasynTypeBinary

	case strings.HasPrefix(normalized, "uuid"):
		return domain.SeasynTypeUUID

	default:
		return domain.SeasynTypeUnknown
	}
}
