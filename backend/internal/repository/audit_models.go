package repository

import (
	"encoding/json"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditLogModel is the GORM model for the audit_logs table.
type AuditLogModel struct {
	ID           string    `gorm:"type:uuid;primary_key"`
	OrgID        string    `gorm:"type:uuid;not null;index"`
	ProjectID    *string   `gorm:"type:uuid;index"`
	UserID       string    `gorm:"type:uuid;not null;index"`
	UserEmail    string    `gorm:"type:varchar(255)"`
	Action       string    `gorm:"type:varchar(100);not null;index"`
	ResourceType string    `gorm:"type:varchar(50);not null"`
	ResourceID   string    `gorm:"type:varchar(100);not null"`
	Metadata     string    `gorm:"type:text"` // JSON encoded metadata map
	IPAddress    string    `gorm:"type:varchar(50)"`
	UserAgent    string    `gorm:"type:varchar(255)"`
	CreatedAt    time.Time `gorm:"autoCreateTime;index"`
}

func (AuditLogModel) TableName() string { return "audit_logs" }

func (m *AuditLogModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return nil
}

func (m *AuditLogModel) ToDomain() domain.AuditLog {
	var meta map[string]interface{}
	if m.Metadata != "" {
		_ = json.Unmarshal([]byte(m.Metadata), &meta)
	}

	return domain.AuditLog{
		ID:           m.ID,
		OrgID:        m.OrgID,
		ProjectID:    m.ProjectID,
		UserID:       m.UserID,
		UserEmail:    m.UserEmail,
		Action:       domain.AuditAction(m.Action),
		ResourceType: m.ResourceType,
		ResourceID:   m.ResourceID,
		Metadata:     meta,
		IPAddress:    m.IPAddress,
		UserAgent:    m.UserAgent,
		CreatedAt:    m.CreatedAt,
	}
}
