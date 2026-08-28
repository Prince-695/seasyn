package repository

import (
	"encoding/json"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebhookModel is the GORM model for the webhooks table.
type WebhookModel struct {
	ID        string         `gorm:"type:uuid;primary_key"`
	OrgID     string         `gorm:"type:uuid;not null;index"`
	ProjectID *string        `gorm:"type:uuid;index"`
	Name      string         `gorm:"type:varchar(100);not null"`
	URL       string         `gorm:"type:text;not null"`
	Secret    string         `gorm:"type:varchar(255);not null"`
	Events    string         `gorm:"type:text;not null"` // JSON array of event types
	IsActive  bool           `gorm:"default:true;index"`
	CreatedBy string         `gorm:"type:uuid;not null"`
	CreatedAt time.Time      `gorm:"autoCreateTime"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (WebhookModel) TableName() string { return "webhooks" }

func (m *WebhookModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return nil
}

func (m *WebhookModel) ToDomain() *domain.Webhook {
	var events []domain.WebhookEventType
	if m.Events != "" {
		_ = json.Unmarshal([]byte(m.Events), &events)
	}

	return &domain.Webhook{
		ID:        m.ID,
		OrgID:     m.OrgID,
		ProjectID: m.ProjectID,
		Name:      m.Name,
		URL:       m.URL,
		Secret:    m.Secret,
		Events:    events,
		IsActive:  m.IsActive,
		CreatedBy: m.CreatedBy,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

// WebhookDeliveryModel is the GORM model for the webhook_deliveries table.
type WebhookDeliveryModel struct {
	ID                  string    `gorm:"type:uuid;primary_key"`
	WebhookID           string    `gorm:"type:uuid;not null;index"`
	Event               string    `gorm:"type:varchar(100);not null"`
	Payload             string    `gorm:"type:text;not null"`
	StatusCode          int       `gorm:"type:int"`
	ResponseBody        string    `gorm:"type:text"`
	Success             bool      `gorm:"type:boolean"`
	ExecutionDurationMs int64     `gorm:"type:bigint"`
	CreatedAt           time.Time `gorm:"autoCreateTime;index"`
}

func (WebhookDeliveryModel) TableName() string { return "webhook_deliveries" }

func (m *WebhookDeliveryModel) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.NewString()
	}
	return nil
}

func (m *WebhookDeliveryModel) ToDomain() domain.WebhookDelivery {
	return domain.WebhookDelivery{
		ID:                  m.ID,
		WebhookID:           m.WebhookID,
		Event:               domain.WebhookEventType(m.Event),
		Payload:             m.Payload,
		StatusCode:          m.StatusCode,
		ResponseBody:        m.ResponseBody,
		Success:             m.Success,
		ExecutionDurationMs: m.ExecutionDurationMs,
		CreatedAt:           m.CreatedAt,
	}
}
