package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// MigrationRepository defines persistence operations for migration job metadata.
type MigrationRepository interface {
	Create(ctx context.Context, job domain.MigrationJob) (*domain.MigrationJob, error)
	GetByID(ctx context.Context, id string) (*domain.MigrationJob, error)
	UpdateStatus(ctx context.Context, id string, status domain.MigrationStatus, migratedRows, totalRows int64, errMsg string) error
	ListByProject(ctx context.Context, projectID string) ([]*domain.MigrationJob, error)
	ListByOrg(ctx context.Context, orgID string) ([]*domain.MigrationJob, error)
}

// MigrationService defines business logic for the migration lifecycle.
type MigrationService interface {
	StartMigration(ctx context.Context, userID, orgID, projectID string, req domain.StartMigrationRequest) (*domain.MigrationJobResponse, error)
	CancelMigration(ctx context.Context, userID, orgID, projectID, migrationID string) error
	GetMigration(ctx context.Context, userID, orgID, projectID, migrationID string) (*domain.MigrationJobResponse, error)
	ListMigrations(ctx context.Context, userID, orgID, projectID string) ([]domain.MigrationJobResponse, error)
}
