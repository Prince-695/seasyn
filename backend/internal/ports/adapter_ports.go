package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// DatabaseConnection defines an active database session for schema inspection and row queries.
type DatabaseConnection interface {
	Ping(ctx context.Context) error
	ListTables(ctx context.Context) ([]string, error)
	GetTableSchema(ctx context.Context, tableName string) (*domain.TableSchema, error)
	GetSchema(ctx context.Context) (*domain.DatabaseSchema, error)
	QueryRows(ctx context.Context, table string, req domain.QueryRequest) (*domain.QueryResult, error)
	InsertRow(ctx context.Context, table string, data map[string]interface{}) (map[string]interface{}, error)
	UpdateRow(ctx context.Context, table string, primaryKey map[string]interface{}, data map[string]interface{}) error
	DeleteRow(ctx context.Context, table string, primaryKey map[string]interface{}) error
	Close() error
}

// DatabaseAdapter connects to a target database using decrypted credentials.
type DatabaseAdapter interface {
	Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (DatabaseConnection, error)
}

// AdapterRegistry manages available database adapters by engine type.
type AdapterRegistry interface {
	Register(dbType domain.DBType, adapter DatabaseAdapter)
	Get(dbType domain.DBType) (DatabaseAdapter, error)
}
