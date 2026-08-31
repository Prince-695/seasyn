package migration

import (
	"fmt"
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// --- SeasonType → Native Type Maps ---

// seasonToPostgres maps the universal SeasonType to the best PostgreSQL native DDL type.
var seasonToPostgres = map[domain.SeasonType]string{
	domain.SeasonTypeInt:       "BIGINT",
	domain.SeasonTypeString:    "TEXT",
	domain.SeasonTypeBool:      "BOOLEAN",
	domain.SeasonTypeTimestamp: "TIMESTAMPTZ",
	domain.SeasonTypeJSON:      "JSONB",
	domain.SeasonTypeFloat:     "DOUBLE PRECISION",
	domain.SeasonTypeDecimal:   "NUMERIC",
	domain.SeasonTypeBinary:    "BYTEA",
	domain.SeasonTypeUUID:      "UUID",
	domain.SeasonTypeEnum:      "TEXT",
	domain.SeasonTypeArray:     "JSONB",
	domain.SeasonTypeUnknown:   "TEXT",
}

// seasonToMongo maps the universal SeasonType to MongoDB BSON type names.
var seasonToMongo = map[domain.SeasonType]string{
	domain.SeasonTypeInt:       "int",
	domain.SeasonTypeString:    "string",
	domain.SeasonTypeBool:      "bool",
	domain.SeasonTypeTimestamp: "date",
	domain.SeasonTypeJSON:      "object",
	domain.SeasonTypeFloat:     "double",
	domain.SeasonTypeDecimal:   "decimal",
	domain.SeasonTypeBinary:    "binData",
	domain.SeasonTypeUUID:      "string",
	domain.SeasonTypeEnum:      "string",
	domain.SeasonTypeArray:     "array",
	domain.SeasonTypeUnknown:   "string",
}

// seasonToMySQL maps the universal SeasonType to MySQL DDL types.
var seasonToMySQL = map[domain.SeasonType]string{
	domain.SeasonTypeInt:       "BIGINT",
	domain.SeasonTypeString:    "TEXT",
	domain.SeasonTypeBool:      "TINYINT(1)",
	domain.SeasonTypeTimestamp: "DATETIME(6)",
	domain.SeasonTypeJSON:      "JSON",
	domain.SeasonTypeFloat:     "DOUBLE",
	domain.SeasonTypeDecimal:   "DECIMAL(38,18)",
	domain.SeasonTypeBinary:    "LONGBLOB",
	domain.SeasonTypeUUID:      "CHAR(36)",
	domain.SeasonTypeEnum:      "VARCHAR(255)",
	domain.SeasonTypeArray:     "JSON",
	domain.SeasonTypeUnknown:   "TEXT",
}

// seasonToSQLite maps the universal SeasonType to SQLite types.
var seasonToSQLite = map[domain.SeasonType]string{
	domain.SeasonTypeInt:       "INTEGER",
	domain.SeasonTypeString:    "TEXT",
	domain.SeasonTypeBool:      "INTEGER",
	domain.SeasonTypeTimestamp: "TEXT",
	domain.SeasonTypeJSON:      "TEXT",
	domain.SeasonTypeFloat:     "REAL",
	domain.SeasonTypeDecimal:   "NUMERIC",
	domain.SeasonTypeBinary:    "BLOB",
	domain.SeasonTypeUUID:      "TEXT",
	domain.SeasonTypeEnum:      "TEXT",
	domain.SeasonTypeArray:     "TEXT",
	domain.SeasonTypeUnknown:   "TEXT",
}

// TransformedColumn represents a column ready for DDL generation on the target database.
type TransformedColumn struct {
	Name         string            `json:"name"`
	SourceType   string            `json:"source_type"`
	SeasonType   domain.SeasonType `json:"season_type"`
	TargetType   string            `json:"target_type"`
	IsNullable   bool              `json:"is_nullable"`
	IsPrimaryKey bool              `json:"is_primary_key"`
}

// TransformedSchema is the output of schema transformation, ready for DDL generation on the target.
type TransformedSchema struct {
	SourceDBType domain.DBType       `json:"source_db_type"`
	TargetDBType domain.DBType       `json:"target_db_type"`
	TableName    string              `json:"table_name"`
	Columns      []TransformedColumn `json:"columns"`
	PrimaryKeys  []string            `json:"primary_keys"`
}

// MapSeasonToNative returns the best native type for a SeasonType on the given target DB engine.
func MapSeasonToNative(seasonType domain.SeasonType, targetDB domain.DBType) string {
	var typeMap map[domain.SeasonType]string

	switch targetDB {
	case domain.DBTypePostgres:
		typeMap = seasonToPostgres
	case domain.DBTypeMongoDB:
		typeMap = seasonToMongo
	case domain.DBTypeMySQL:
		typeMap = seasonToMySQL
	case domain.DBTypeSQLite:
		typeMap = seasonToSQLite
	default:
		typeMap = seasonToPostgres
	}

	if native, ok := typeMap[seasonType]; ok {
		return native
	}
	return "TEXT"
}

// TransformSchema converts a source table schema into a target-ready schema using SeasonType as the intermediate representation.
func TransformSchema(sourceTable domain.TableSchema, sourceDBType, targetDBType domain.DBType) TransformedSchema {
	var columns []TransformedColumn
	for _, col := range sourceTable.Columns {
		columns = append(columns, TransformedColumn{
			Name:         col.Name,
			SourceType:   col.DataType,
			SeasonType:   col.SeasonType,
			TargetType:   MapSeasonToNative(col.SeasonType, targetDBType),
			IsNullable:   col.IsNullable,
			IsPrimaryKey: col.IsPrimaryKey,
		})
	}

	return TransformedSchema{
		SourceDBType: sourceDBType,
		TargetDBType: targetDBType,
		TableName:    sourceTable.Name,
		Columns:      columns,
		PrimaryKeys:  sourceTable.PrimaryKeys,
	}
}

// GenerateTargetDDL generates the appropriate CREATE TABLE SQL statement for the target database engine.
func GenerateTargetDDL(schema TransformedSchema) string {
	if schema.TargetDBType == domain.DBTypeMongoDB {
		return "" // MongoDB creates collections implicitly on insert
	}

	quoteChar := "\""
	if schema.TargetDBType == domain.DBTypeMySQL {
		quoteChar = "`"
	}

	var colDefs []string
	for _, col := range schema.Columns {
		def := fmt.Sprintf("%s%s%s %s", quoteChar, col.Name, quoteChar, col.TargetType)
		if col.IsPrimaryKey && len(schema.PrimaryKeys) <= 1 {
			def += " PRIMARY KEY"
		}
		if !col.IsNullable && !col.IsPrimaryKey {
			def += " NOT NULL"
		}
		colDefs = append(colDefs, def)
	}

	if len(schema.PrimaryKeys) > 1 {
		var pkCols []string
		for _, pk := range schema.PrimaryKeys {
			pkCols = append(pkCols, fmt.Sprintf("%s%s%s", quoteChar, pk, quoteChar))
		}
		colDefs = append(colDefs, fmt.Sprintf("PRIMARY KEY (%s)", strings.Join(pkCols, ", ")))
	}

	return fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s%s%s (\n  %s\n);",
		quoteChar, schema.TableName, quoteChar, strings.Join(colDefs, ",\n  "))
}
