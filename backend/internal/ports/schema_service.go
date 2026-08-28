package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// SchemaService defines the business logic for schema inspection, diff calculations, and live data explorer CRUD.
type SchemaService interface {
	InspectDatabase(ctx context.Context, userID, orgID, projectID, connID string) (*domain.DatabaseSchema, error)
	ListTables(ctx context.Context, userID, orgID, projectID, connID string) ([]string, error)
	InspectTable(ctx context.Context, userID, orgID, projectID, connID, tableName string) (*domain.TableSchema, error)
	CompareSchemas(ctx context.Context, userID, orgID, projectID string, req domain.CompareSchemaRequest) (*domain.SchemaDiff, error)

	QueryTableRows(ctx context.Context, userID, orgID, projectID, connID, tableName string, req domain.QueryRequest) (*domain.QueryResult, error)
	InsertTableRow(ctx context.Context, userID, orgID, projectID, connID, tableName string, req domain.InsertRowRequest) (map[string]interface{}, error)
	UpdateTableRow(ctx context.Context, userID, orgID, projectID, connID, tableName string, req domain.UpdateRowRequest) error
	DeleteTableRow(ctx context.Context, userID, orgID, projectID, connID, tableName string, req domain.DeleteRowRequest) error
}
