package domain

import "time"

// WebhookEventType defines supported outbound webhook event triggers.
type WebhookEventType string

const (
	WebhookEventMigrationStarted   WebhookEventType = "migration.started"
	WebhookEventMigrationCompleted WebhookEventType = "migration.completed"
	WebhookEventMigrationFailed    WebhookEventType = "migration.failed"
	WebhookEventMigrationCancelled WebhookEventType = "migration.cancelled"
	WebhookEventSchemaDiffDetected WebhookEventType = "schema.diff.detected"
	WebhookEventPing               WebhookEventType = "ping"
)

// Webhook represents an endpoint configured to receive outbound event notifications.
type Webhook struct {
	ID          string             `json:"id"`
	OrgID       string             `json:"org_id"`
	ProjectID   *string            `json:"project_id,omitempty"`
	Name        string             `json:"name"`
	URL         string             `json:"url"`
	Secret      string             `json:"-"` // Never returned directly after creation
	Events      []WebhookEventType `json:"events"`
	IsActive    bool               `json:"is_active"`
	CreatedBy   string             `json:"created_by"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
}

// WebhookDelivery captures the attempt and outcome of a webhook POST.
type WebhookDelivery struct {
	ID                  string           `json:"id"`
	WebhookID           string           `json:"webhook_id"`
	Event               WebhookEventType `json:"event"`
	Payload             string           `json:"payload"` // JSON string
	StatusCode          int              `json:"status_code"`
	ResponseBody        string           `json:"response_body,omitempty"`
	Success             bool             `json:"success"`
	ExecutionDurationMs int64            `json:"execution_duration_ms"`
	CreatedAt           time.Time        `json:"created_at"`
}

// WebhookPayload is the standard envelope for dispatched webhooks.
type WebhookPayload struct {
	Event     WebhookEventType `json:"event"`
	OrgID     string           `json:"org_id"`
	ProjectID string           `json:"project_id,omitempty"`
	Timestamp time.Time        `json:"timestamp"`
	Data      interface{}      `json:"data"`
}

// --- Request / Response DTOs ---

type CreateWebhookRequest struct {
	Name      string             `json:"name" validate:"required,min=2,max=100" example:"Production Slack Alerts"`
	URL       string             `json:"url" validate:"required,url" example:"https://api.example.com/webhooks/seasyn"`
	Secret    string             `json:"secret,omitempty" validate:"omitempty,min=8,max=64" example:"custom_signing_secret_123"`
	Events    []WebhookEventType `json:"events" validate:"required,min=1" example:"migration.completed,migration.failed"`
	ProjectID *string            `json:"project_id,omitempty" validate:"omitempty,uuid" example:"11111111-1111-1111-1111-111111111111"`
	IsActive  bool               `json:"is_active"`
}

type UpdateWebhookRequest struct {
	Name      string             `json:"name" validate:"required,min=2,max=100" example:"Production Slack Alerts Updated"`
	URL       string             `json:"url" validate:"required,url" example:"https://api.example.com/webhooks/seasyn"`
	Events    []WebhookEventType `json:"events" validate:"required,min=1" example:"migration.completed,migration.failed"`
	ProjectID *string            `json:"project_id,omitempty" validate:"omitempty,uuid"`
	IsActive  *bool              `json:"is_active,omitempty"`
}

type WebhookResponse struct {
	ID        string             `json:"id"`
	OrgID     string             `json:"org_id"`
	ProjectID *string            `json:"project_id,omitempty"`
	Name      string             `json:"name"`
	URL       string             `json:"url"`
	Secret    string             `json:"secret,omitempty"` // Included only upon creation
	Events    []WebhookEventType `json:"events"`
	IsActive  bool               `json:"is_active"`
	CreatedAt time.Time          `json:"created_at"`
	UpdatedAt time.Time          `json:"updated_at"`
}

type TestWebhookResponse struct {
	Success             bool   `json:"success"`
	StatusCode          int    `json:"status_code"`
	ExecutionDurationMs int64  `json:"execution_duration_ms"`
	ResponseBody        string `json:"response_body,omitempty"`
	ErrorMessage        string `json:"error_message,omitempty"`
}
