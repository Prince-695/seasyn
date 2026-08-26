package repository

import (
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProjectModel is the GORM model for the projects table.
type ProjectModel struct {
	ID             string         `gorm:"type:uuid;primary_key"`
	OrganizationID string         `gorm:"type:uuid;not null;index"`
	Name           string         `gorm:"type:varchar(100);not null"`
	Slug           string         `gorm:"type:varchar(50);not null;index:idx_org_project_slug,unique"`
	Description    string         `gorm:"type:varchar(500)"`
	Environment    string         `gorm:"type:varchar(20);default:'development'"`
	CreatedBy      string         `gorm:"type:uuid;not null;index"`
	CreatedAt      time.Time      `gorm:"autoCreateTime"`
	UpdatedAt      time.Time      `gorm:"autoUpdateTime"`
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}

func (ProjectModel) TableName() string { return "projects" }

func (m *ProjectModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return nil
}

func (m *ProjectModel) ToDomain() *domain.Project {
	return &domain.Project{
		ID:             m.ID,
		OrganizationID: m.OrganizationID,
		Name:           m.Name,
		Slug:           m.Slug,
		Description:    m.Description,
		Environment:    m.Environment,
		CreatedBy:      m.CreatedBy,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

// DatabaseConnectionModel is the GORM model for database_connections table.
type DatabaseConnectionModel struct {
	ID                string         `gorm:"type:uuid;primary_key"`
	ProjectID         string         `gorm:"type:uuid;not null;index"`
	Name              string         `gorm:"type:varchar(100);not null"`
	DBType            string         `gorm:"type:varchar(20);not null"`
	Host              string         `gorm:"type:varchar(255)"`
	Port              int            `gorm:"type:int"`
	Database          string         `gorm:"type:varchar(100)"`
	Username          string         `gorm:"type:varchar(100)"`
	EncryptedPassword string         `gorm:"type:text"`
	SSLMode           string         `gorm:"type:varchar(20);default:'disable'"`
	FilePath          string         `gorm:"type:varchar(500)"`
	URI               string         `gorm:"type:text"`
	IsSource          bool           `gorm:"default:true"`
	CreatedAt         time.Time      `gorm:"autoCreateTime"`
	UpdatedAt         time.Time      `gorm:"autoUpdateTime"`
	DeletedAt         gorm.DeletedAt `gorm:"index"`
}

func (DatabaseConnectionModel) TableName() string { return "database_connections" }

func (m *DatabaseConnectionModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return nil
}

func (m *DatabaseConnectionModel) ToDomain() *domain.DatabaseConnection {
	return &domain.DatabaseConnection{
		ID:                m.ID,
		ProjectID:         m.ProjectID,
		Name:              m.Name,
		DBType:            domain.DBType(m.DBType),
		Host:              m.Host,
		Port:              m.Port,
		Database:          m.Database,
		Username:          m.Username,
		EncryptedPassword: m.EncryptedPassword,
		SSLMode:           m.SSLMode,
		FilePath:          m.FilePath,
		URI:               m.URI,
		IsSource:          m.IsSource,
		CreatedAt:         m.CreatedAt,
		UpdatedAt:         m.UpdatedAt,
	}
}
