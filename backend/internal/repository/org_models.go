package repository

import (
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OrgModel is the GORM database model for an organization.
type OrgModel struct {
	ID          string         `gorm:"type:uuid;primary_key"`
	Name        string         `gorm:"type:varchar(100);not null"`
	Slug        string         `gorm:"type:varchar(50);uniqueIndex;not null"`
	Description string         `gorm:"type:varchar(500)"`
	OwnerID     string         `gorm:"type:uuid;not null;index"`
	CreatedAt   time.Time      `gorm:"autoCreateTime"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

func (OrgModel) TableName() string { return "organizations" }

func (m *OrgModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return nil
}

func (m *OrgModel) ToDomain() *domain.Organization {
	return &domain.Organization{
		ID:          m.ID,
		Name:        m.Name,
		Slug:        m.Slug,
		Description: m.Description,
		OwnerID:     m.OwnerID,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}

// OrgMemberModel is the GORM model for the organization membership join table.
type OrgMemberModel struct {
	OrganizationID string    `gorm:"type:uuid;not null;primaryKey;index"`
	UserID         string    `gorm:"type:uuid;not null;primaryKey;index"`
	Role           string    `gorm:"type:varchar(20);not null;default:'member'"`
	InvitedBy      string    `gorm:"type:uuid"`
	JoinedAt       time.Time `gorm:"autoCreateTime"`
}

func (OrgMemberModel) TableName() string { return "organization_members" }

func (m *OrgMemberModel) ToDomain() *domain.OrganizationMember {
	return &domain.OrganizationMember{
		OrganizationID: m.OrganizationID,
		UserID:         m.UserID,
		Role:           domain.OrgRole(m.Role),
		InvitedBy:      m.InvitedBy,
		JoinedAt:       m.JoinedAt,
	}
}
