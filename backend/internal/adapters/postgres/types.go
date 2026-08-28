package postgres

import (
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// MapPostgresType converts a PostgreSQL native data type to a universal SeasonType.
func MapPostgresType(pgType string) domain.SeasonType {
	normalized := strings.ToLower(strings.TrimSpace(pgType))

	// Check prefixes / base types
	switch {
	case strings.HasPrefix(normalized, "int"),
		strings.HasPrefix(normalized, "smallint"),
		strings.HasPrefix(normalized, "bigint"),
		strings.HasPrefix(normalized, "serial"),
		strings.HasPrefix(normalized, "bigserial"),
		strings.HasPrefix(normalized, "smallserial"):
		return domain.SeasonTypeInt

	case strings.HasPrefix(normalized, "varchar"),
		strings.HasPrefix(normalized, "character"),
		strings.HasPrefix(normalized, "text"),
		strings.HasPrefix(normalized, "citext"),
		normalized == "name":
		return domain.SeasonTypeString

	case strings.HasPrefix(normalized, "bool"):
		return domain.SeasonTypeBool

	case strings.HasPrefix(normalized, "timestamp"),
		strings.HasPrefix(normalized, "date"),
		strings.HasPrefix(normalized, "time"),
		strings.HasPrefix(normalized, "interval"):
		return domain.SeasonTypeTimestamp

	case strings.HasPrefix(normalized, "json"):
		return domain.SeasonTypeJSON

	case strings.HasPrefix(normalized, "float"),
		strings.HasPrefix(normalized, "real"),
		strings.HasPrefix(normalized, "double"):
		return domain.SeasonTypeFloat

	case strings.HasPrefix(normalized, "numeric"),
		strings.HasPrefix(normalized, "decimal"),
		strings.HasPrefix(normalized, "money"):
		return domain.SeasonTypeDecimal

	case strings.HasPrefix(normalized, "bytea"),
		strings.HasPrefix(normalized, "blob"):
		return domain.SeasonTypeBinary

	case strings.HasPrefix(normalized, "uuid"):
		return domain.SeasonTypeUUID

	case strings.HasSuffix(normalized, "[]"),
		strings.HasPrefix(normalized, "array"):
		return domain.SeasonTypeArray

	default:
		return domain.SeasonTypeUnknown
	}
}
