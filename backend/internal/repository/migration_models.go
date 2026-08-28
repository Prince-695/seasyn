package repository

import (
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MigrationJobModel is the GORM model for the migration_jobs table.
type MigrationJobModel struct {
	ID             string `gorm:"type:uuid;primary_key"`
	OrganizationID string `gorm:"type:uuid;not null;index"`
	ProjectID      string `gorm:"type:uuid;not null;index"`
	SourceConnID   string `gorm:"type:uuid;not null"`
	TargetConnID   string `gorm:"type:uuid;not null"`
	SourceTable    string `gorm:"type:varchar(128);not null"`
	TargetTable    string `gorm:"type:varchar(128);not null"`
	Status         string `gorm:"type:varchar(20);not null;default:'pending';index"`
	TotalRows      int64  `gorm:"default:0"`
	MigratedRows   int64  `gorm:"default:0"`
	BatchSize      int    `gorm:"default:500"`
	ErrorMessage   string `gorm:"type:text"`
	CreatedBy      string `gorm:"type:uuid;not null"`
	StartedAt      *time.Time
	CompletedAt    *time.Time
	CreatedAt      time.Time      `gorm:"autoCreateTime"`
	UpdatedAt      time.Time      `gorm:"autoUpdateTime"`
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}

func (MigrationJobModel) TableName() string { return "migration_jobs" }

func (m *MigrationJobModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return nil
}

func (m *MigrationJobModel) ToDomain() *domain.MigrationJob {
	return &domain.MigrationJob{
		ID:             m.ID,
		OrganizationID: m.OrganizationID,
		ProjectID:      m.ProjectID,
		SourceConnID:   m.SourceConnID,
		TargetConnID:   m.TargetConnID,
		SourceTable:    m.SourceTable,
		TargetTable:    m.TargetTable,
		Status:         domain.MigrationStatus(m.Status),
		TotalRows:      m.TotalRows,
		MigratedRows:   m.MigratedRows,
		BatchSize:      m.BatchSize,
		ErrorMessage:   m.ErrorMessage,
		CreatedBy:      m.CreatedBy,
		StartedAt:      m.StartedAt,
		CompletedAt:    m.CompletedAt,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}
