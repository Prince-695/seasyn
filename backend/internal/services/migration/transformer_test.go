package migration

import (
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

func TestAll16PairTransformations(t *testing.T) {
	engines := []domain.DBType{
		domain.DBTypePostgres,
		domain.DBTypeMongoDB,
		domain.DBTypeMySQL,
		domain.DBTypeSQLite,
	}

	sampleTable := domain.TableSchema{
		Name: "users_sample",
		Columns: []domain.ColumnSchema{
			{Name: "id", DataType: "uuid", SeasonType: domain.SeasonTypeUUID, IsPrimaryKey: true},
			{Name: "username", DataType: "varchar(50)", SeasonType: domain.SeasonTypeString, IsNullable: false},
			{Name: "age", DataType: "int", SeasonType: domain.SeasonTypeInt, IsNullable: true},
			{Name: "balance", DataType: "decimal(10,2)", SeasonType: domain.SeasonTypeDecimal, IsNullable: true},
			{Name: "is_active", DataType: "boolean", SeasonType: domain.SeasonTypeBool, IsNullable: false},
			{Name: "metadata", DataType: "jsonb", SeasonType: domain.SeasonTypeJSON, IsNullable: true},
			{Name: "tags", DataType: "array", SeasonType: domain.SeasonTypeArray, IsNullable: true},
			{Name: "created_at", DataType: "timestamptz", SeasonType: domain.SeasonTypeTimestamp, IsNullable: false},
		},
		PrimaryKeys: []string{"id"},
	}

	for _, src := range engines {
		for _, dst := range engines {
			t.Run(string(src)+"_to_"+string(dst), func(t *testing.T) {
				transformed := TransformSchema(sampleTable, src, dst)

				if transformed.SourceDBType != src {
					t.Errorf("expected source %s, got %s", src, transformed.SourceDBType)
				}
				if transformed.TargetDBType != dst {
					t.Errorf("expected target %s, got %s", dst, transformed.TargetDBType)
				}
				if len(transformed.Columns) != len(sampleTable.Columns) {
					t.Errorf("expected %d columns, got %d", len(sampleTable.Columns), len(transformed.Columns))
				}

				ddl := GenerateTargetDDL(transformed)
				if dst == domain.DBTypeMongoDB {
					if ddl != "" {
						t.Errorf("MongoDB should have empty DDL, got %s", ddl)
					}
				} else {
					if len(ddl) == 0 {
						t.Errorf("expected non-empty DDL for target %s", dst)
					}
				}
			})
		}
	}
}
