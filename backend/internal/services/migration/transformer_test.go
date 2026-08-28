package migration_test

import (
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/services/migration"
)

func TestMapSeasonToNative(t *testing.T) {
	tests := []struct {
		seasonType domain.SeasonType
		targetDB   domain.DBType
		expected   string
	}{
		{domain.SeasonTypeInt, domain.DBTypePostgres, "BIGINT"},
		{domain.SeasonTypeString, domain.DBTypePostgres, "TEXT"},
		{domain.SeasonTypeBool, domain.DBTypePostgres, "BOOLEAN"},
		{domain.SeasonTypeTimestamp, domain.DBTypePostgres, "TIMESTAMPTZ"},
		{domain.SeasonTypeJSON, domain.DBTypePostgres, "JSONB"},
		{domain.SeasonTypeUUID, domain.DBTypePostgres, "UUID"},

		{domain.SeasonTypeInt, domain.DBTypeMongoDB, "int"},
		{domain.SeasonTypeString, domain.DBTypeMongoDB, "string"},
		{domain.SeasonTypeBool, domain.DBTypeMongoDB, "bool"},
		{domain.SeasonTypeTimestamp, domain.DBTypeMongoDB, "date"},
		{domain.SeasonTypeJSON, domain.DBTypeMongoDB, "object"},

		{domain.SeasonTypeInt, domain.DBTypeMySQL, "BIGINT"},
		{domain.SeasonTypeString, domain.DBTypeMySQL, "TEXT"},
		{domain.SeasonTypeBool, domain.DBTypeMySQL, "TINYINT(1)"},
		{domain.SeasonTypeTimestamp, domain.DBTypeMySQL, "DATETIME(6)"},
		{domain.SeasonTypeJSON, domain.DBTypeMySQL, "JSON"},
		{domain.SeasonTypeDecimal, domain.DBTypeMySQL, "DECIMAL(38,18)"},
	}

	for _, tt := range tests {
		got := migration.MapSeasonToNative(tt.seasonType, tt.targetDB)
		if got != tt.expected {
			t.Errorf("MapSeasonToNative(%v, %v) = %q; expected %q", tt.seasonType, tt.targetDB, got, tt.expected)
		}
	}
}

func TestTransformSchema(t *testing.T) {
	srcTable := domain.TableSchema{
		Name: "users",
		Columns: []domain.ColumnSchema{
			{Name: "id", DataType: "uuid", SeasonType: domain.SeasonTypeUUID, IsPrimaryKey: true},
			{Name: "email", DataType: "varchar(255)", SeasonType: domain.SeasonTypeString, IsNullable: false},
			{Name: "age", DataType: "int4", SeasonType: domain.SeasonTypeInt, IsNullable: true},
			{Name: "metadata", DataType: "jsonb", SeasonType: domain.SeasonTypeJSON, IsNullable: true},
		},
		PrimaryKeys: []string{"id"},
	}

	// Transform Postgres -> Mongo
	transformedMongo := migration.TransformSchema(srcTable, domain.DBTypePostgres, domain.DBTypeMongoDB)
	if transformedMongo.TableName != "users" {
		t.Errorf("expected table name 'users', got %q", transformedMongo.TableName)
	}
	if len(transformedMongo.Columns) != 4 {
		t.Fatalf("expected 4 columns, got %d", len(transformedMongo.Columns))
	}
	if transformedMongo.Columns[0].TargetType != "string" {
		t.Errorf("expected mongo type 'string' for uuid, got %q", transformedMongo.Columns[0].TargetType)
	}
	if transformedMongo.Columns[3].TargetType != "object" {
		t.Errorf("expected mongo type 'object' for jsonb, got %q", transformedMongo.Columns[3].TargetType)
	}

	// Transform Postgres -> MySQL
	transformedMySQL := migration.TransformSchema(srcTable, domain.DBTypePostgres, domain.DBTypeMySQL)
	if transformedMySQL.Columns[0].TargetType != "CHAR(36)" {
		t.Errorf("expected mysql type 'CHAR(36)' for uuid, got %q", transformedMySQL.Columns[0].TargetType)
	}
	if transformedMySQL.Columns[1].TargetType != "TEXT" {
		t.Errorf("expected mysql type 'TEXT' for string, got %q", transformedMySQL.Columns[1].TargetType)
	}
}
