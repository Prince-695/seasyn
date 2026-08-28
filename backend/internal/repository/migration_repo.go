package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"gorm.io/gorm"
)

type migrationRepo struct {
	db *gorm.DB
}

// NewMigrationRepository creates a new MigrationRepository backed by GORM.
func NewMigrationRepository(db *gorm.DB) ports.MigrationRepository {
	return &migrationRepo{db: db}
}

func (r *migrationRepo) Create(ctx context.Context, job domain.MigrationJob) (*domain.MigrationJob, error) {
	model := MigrationJobModel{
		OrganizationID: job.OrganizationID,
		ProjectID:      job.ProjectID,
		SourceConnID:   job.SourceConnID,
		TargetConnID:   job.TargetConnID,
		SourceTable:    job.SourceTable,
		TargetTable:    job.TargetTable,
		Status:         string(domain.MigrationStatusPending),
		BatchSize:      job.BatchSize,
		CreatedBy:      job.CreatedBy,
	}

	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return nil, fmt.Errorf("create migration job: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *migrationRepo) GetByID(ctx context.Context, id string) (*domain.MigrationJob, error) {
	var model MigrationJobModel
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("migration job not found")
		}
		return nil, fmt.Errorf("get migration job: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *migrationRepo) UpdateStatus(ctx context.Context, id string, status domain.MigrationStatus, migratedRows, totalRows int64, errMsg string) error {
	updates := map[string]interface{}{
		"status":        string(status),
		"migrated_rows": migratedRows,
		"total_rows":    totalRows,
		"error_message": errMsg,
	}

	if status == domain.MigrationStatusRunning {
		now := time.Now()
		updates["started_at"] = now
	}
	if status == domain.MigrationStatusCompleted || status == domain.MigrationStatusFailed || status == domain.MigrationStatusCancelled {
		now := time.Now()
		updates["completed_at"] = now
	}

	result := r.db.WithContext(ctx).Model(&MigrationJobModel{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return fmt.Errorf("update migration status: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return apperrors.NotFound("migration job not found")
	}
	return nil
}

func (r *migrationRepo) ListByProject(ctx context.Context, projectID string) ([]*domain.MigrationJob, error) {
	var models []MigrationJobModel
	if err := r.db.WithContext(ctx).Where("project_id = ?", projectID).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, fmt.Errorf("list migration jobs by project: %w", err)
	}

	var jobs []*domain.MigrationJob
	for _, m := range models {
		jobs = append(jobs, m.ToDomain())
	}
	return jobs, nil
}

func (r *migrationRepo) ListByOrg(ctx context.Context, orgID string) ([]*domain.MigrationJob, error) {
	var models []MigrationJobModel
	if err := r.db.WithContext(ctx).Where("organization_id = ?", orgID).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, fmt.Errorf("list migration jobs by org: %w", err)
	}

	var jobs []*domain.MigrationJob
	for _, m := range models {
		jobs = append(jobs, m.ToDomain())
	}
	return jobs, nil
}
