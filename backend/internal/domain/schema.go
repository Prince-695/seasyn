package domain

import "time"

// SeasonType is SEASYN's universal intermediate type for cross-database mapping.
type SeasonType string

const (
	SeasonTypeInt       SeasonType = "int"
	SeasonTypeString    SeasonType = "string"
	SeasonTypeBool      SeasonType = "bool"
	SeasonTypeTimestamp SeasonType = "timestamp"
	SeasonTypeJSON      SeasonType = "json"
	SeasonTypeFloat     SeasonType = "float"
	SeasonTypeDecimal   SeasonType = "decimal"
	SeasonTypeBinary    SeasonType = "binary"
	SeasonTypeUUID      SeasonType = "uuid"
	SeasonTypeEnum      SeasonType = "enum"
	SeasonTypeArray     SeasonType = "array"
	SeasonTypeUnknown   SeasonType = "unknown"
)

// ColumnSchema describes a single column's metadata within a table.
type ColumnSchema struct {
	Name          string     `json:"name"`
	DataType      string     `json:"data_type"`   // Native database data type (e.g., "varchar(255)", "int4")
	SeasonType    SeasonType `json:"season_type"` // Universal normalized type
	IsNullable    bool       `json:"is_nullable"`
	DefaultValue  *string    `json:"default_value,omitempty"`
	MaxLength     *int       `json:"max_length,omitempty"`
	IsPrimaryKey  bool       `json:"is_primary_key"`
	IsForeignKey  bool       `json:"is_foreign_key"`
	ForeignTable  string     `json:"foreign_table,omitempty"`
	ForeignColumn string     `json:"foreign_column,omitempty"`
	Comment       string     `json:"comment,omitempty"`
}

// IndexSchema describes an index on a table.
type IndexSchema struct {
	Name      string   `json:"name"`
	Columns   []string `json:"columns"`
	IsUnique  bool     `json:"is_unique"`
	IsPrimary bool     `json:"is_primary"`
	Type      string   `json:"type,omitempty"` // e.g. "btree", "hash", "gin"
}

// ConstraintSchema describes table constraints (PK, FK, UNIQUE, CHECK).
type ConstraintSchema struct {
	Name           string   `json:"name"`
	Type           string   `json:"type"` // "PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK"
	Columns        []string `json:"columns"`
	ForeignTable   string   `json:"foreign_table,omitempty"`
	ForeignColumns []string `json:"foreign_columns,omitempty"`
	Definition     string   `json:"definition,omitempty"`
}

// TableSchema describes a table's complete structure.
type TableSchema struct {
	Name        string             `json:"name"`
	Columns     []ColumnSchema     `json:"columns"`
	PrimaryKeys []string           `json:"primary_keys"`
	Constraints []ConstraintSchema `json:"constraints,omitempty"`
	Indexes     []IndexSchema      `json:"indexes,omitempty"`
	RowCount    int64              `json:"row_count"`
	SizeBytes   int64              `json:"size_bytes,omitempty"`
	Comment     string             `json:"comment,omitempty"`
}

// DatabaseSchema is the top-level snapshot of an inspected database.
type DatabaseSchema struct {
	DBType       DBType        `json:"db_type"`
	DatabaseName string        `json:"database_name"`
	Tables       []TableSchema `json:"tables"`
	InspectedAt  time.Time     `json:"inspected_at"`
}

// --- Schema Diff Models ---

// ColumnDiff captures changes in a column between two schemas.
type ColumnDiff struct {
	Name         string        `json:"name"`
	DiffType     string        `json:"diff_type"` // "added", "removed", "altered"
	SourceColumn *ColumnSchema `json:"source_column,omitempty"`
	TargetColumn *ColumnSchema `json:"target_column,omitempty"`
	AlterDetails []string      `json:"alter_details,omitempty"`
}

// TableDiff captures structural changes in a table.
type TableDiff struct {
	Name           string       `json:"name"`
	DiffType       string       `json:"diff_type"` // "added", "removed", "altered", "identical"
	SourceTable    *TableSchema `json:"source_table,omitempty"`
	TargetTable    *TableSchema `json:"target_table,omitempty"`
	ColumnDiffs    []ColumnDiff `json:"column_diffs,omitempty"`
	AddedIndexes   []string     `json:"added_indexes,omitempty"`
	RemovedIndexes []string     `json:"removed_indexes,omitempty"`
}

// SchemaDiff is the complete comparison between a source and target database schema.
type SchemaDiff struct {
	SourceConnID  string      `json:"source_connection_id"`
	TargetConnID  string      `json:"target_connection_id"`
	SourceDBType  DBType      `json:"source_db_type"`
	TargetDBType  DBType      `json:"target_db_type"`
	TablesAdded   []string    `json:"tables_added"`   // Tables present in Source but missing in Target
	TablesRemoved []string    `json:"tables_removed"` // Tables present in Target but missing in Source
	TablesAltered []TableDiff `json:"tables_altered"` // Tables present in both but with structural differences
	TablesSame    []string    `json:"tables_same"`    // Identical tables
	GeneratedAt   time.Time   `json:"generated_at"`
}

// CompareSchemaRequest is the request payload to diff two database connections.
type CompareSchemaRequest struct {
	SourceConnectionID string `json:"source_connection_id" validate:"required,uuid" example:"11111111-1111-1111-1111-111111111111"`
	TargetConnectionID string `json:"target_connection_id" validate:"required,uuid" example:"22222222-2222-2222-2222-222222222222"`
}
