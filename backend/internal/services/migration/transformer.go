package migration

import (
	"fmt"
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// --- SeasynType → Native Type Maps ---

// seasynToPostgres maps the universal SeasynType to the best PostgreSQL native DDL type.
var seasynToPostgres = map[domain.SeasynType]string{
	domain.SeasynTypeInt:       "BIGINT",
	domain.SeasynTypeString:    "TEXT",
	domain.SeasynTypeBool:      "BOOLEAN",
	domain.SeasynTypeTimestamp: "TIMESTAMPTZ",
	domain.SeasynTypeJSON:      "JSONB",
	domain.SeasynTypeFloat:     "DOUBLE PRECISION",
	domain.SeasynTypeDecimal:   "NUMERIC",
	domain.SeasynTypeBinary:    "BYTEA",
	domain.SeasynTypeUUID:      "UUID",
	domain.SeasynTypeEnum:      "TEXT",
	domain.SeasynTypeArray:     "JSONB",
	domain.SeasynTypeUnknown:   "TEXT",
}

// seasynToMongo maps the universal SeasynType to MongoDB BSON type names.
var seasynToMongo = map[domain.SeasynType]string{
	domain.SeasynTypeInt:       "int",
	domain.SeasynTypeString:    "string",
	domain.SeasynTypeBool:      "bool",
	domain.SeasynTypeTimestamp: "date",
	domain.SeasynTypeJSON:      "object",
	domain.SeasynTypeFloat:     "double",
	domain.SeasynTypeDecimal:   "decimal",
	domain.SeasynTypeBinary:    "binData",
	domain.SeasynTypeUUID:      "string",
	domain.SeasynTypeEnum:      "string",
	domain.SeasynTypeArray:     "array",
	domain.SeasynTypeUnknown:   "string",
}

// seasynToMySQL maps the universal SeasynType to MySQL DDL types.
var seasynToMySQL = map[domain.SeasynType]string{
	domain.SeasynTypeInt:       "BIGINT",
	domain.SeasynTypeString:    "TEXT",
	domain.SeasynTypeBool:      "TINYINT(1)",
	domain.SeasynTypeTimestamp: "DATETIME(6)",
	domain.SeasynTypeJSON:      "JSON",
	domain.SeasynTypeFloat:     "DOUBLE",
	domain.SeasynTypeDecimal:   "DECIMAL(38,18)",
	domain.SeasynTypeBinary:    "LONGBLOB",
	domain.SeasynTypeUUID:      "CHAR(36)",
	domain.SeasynTypeEnum:      "VARCHAR(255)",
	domain.SeasynTypeArray:     "JSON",
	domain.SeasynTypeUnknown:   "TEXT",
}

// seasynToSQLite maps the universal SeasynType to SQLite types.
var seasynToSQLite = map[domain.SeasynType]string{
	domain.SeasynTypeInt:       "INTEGER",
	domain.SeasynTypeString:    "TEXT",
	domain.SeasynTypeBool:      "INTEGER",
	domain.SeasynTypeTimestamp: "TEXT",
	domain.SeasynTypeJSON:      "TEXT",
	domain.SeasynTypeFloat:     "REAL",
	domain.SeasynTypeDecimal:   "NUMERIC",
	domain.SeasynTypeBinary:    "BLOB",
	domain.SeasynTypeUUID:      "TEXT",
	domain.SeasynTypeEnum:      "TEXT",
	domain.SeasynTypeArray:     "TEXT",
	domain.SeasynTypeUnknown:   "TEXT",
}

// TransformedColumn represents a column ready for DDL generation on the target database.
type TransformedColumn struct {
	Name         string            `json:"name"`
	SourceType   string            `json:"source_type"`
	SeasynType   domain.SeasynType `json:"season_type"`
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

// MapSeasynToNative returns the best native type for a SeasynType on the given target DB engine.
func MapSeasynToNative(seasynType domain.SeasynType, targetDB domain.DBType) string {
	var typeMap map[domain.SeasynType]string

	switch targetDB {
	case domain.DBTypePostgres:
		typeMap = seasynToPostgres
	case domain.DBTypeMongoDB:
		typeMap = seasynToMongo
	case domain.DBTypeMySQL:
		typeMap = seasynToMySQL
	case domain.DBTypeSQLite:
		typeMap = seasynToSQLite
	default:
		typeMap = seasynToPostgres
	}

	if native, ok := typeMap[seasynType]; ok {
		return native
	}
	return "TEXT"
}

// MapSeasonToNative is an alias for MapSeasynToNative for backward compatibility.
func MapSeasonToNative(seasonType domain.SeasonType, targetDB domain.DBType) string {
	return MapSeasynToNative(seasonType, targetDB)
}

// TransformSchema converts a source table schema into a target-ready schema using SeasynType as the intermediate representation.
func TransformSchema(sourceTable domain.TableSchema, sourceDBType, targetDBType domain.DBType) TransformedSchema {
	var columns []TransformedColumn
	for _, col := range sourceTable.Columns {
		columns = append(columns, TransformedColumn{
			Name:         col.Name,
			SourceType:   col.DataType,
			SeasynType:   col.SeasynType,
			TargetType:   MapSeasynToNative(col.SeasynType, targetDBType),
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
