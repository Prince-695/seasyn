package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// WebhookRepository defines persistence operations for webhooks and their delivery logs.
type WebhookRepository interface {
	CreateWebhook(ctx context.Context, webhook domain.Webhook) (*domain.Webhook, error)
	GetWebhookByID(ctx context.Context, id string) (*domain.Webhook, error)
	ListWebhooksByOrg(ctx context.Context, orgID string) ([]*domain.Webhook, error)
	ListWebhooksByProject(ctx context.Context, projectID string) ([]*domain.Webhook, error)
	UpdateWebhook(ctx context.Context, webhook domain.Webhook) (*domain.Webhook, error)
	DeleteWebhook(ctx context.Context, id string) error

	CreateDelivery(ctx context.Context, delivery domain.WebhookDelivery) error
	ListDeliveriesByWebhook(ctx context.Context, webhookID string, limit int) ([]*domain.WebhookDelivery, error)
}

// WebhookService defines business logic for managing webhooks, testing them, and dispatching events.
type WebhookService interface {
	CreateWebhook(ctx context.Context, userID, orgID string, req domain.CreateWebhookRequest) (*domain.WebhookResponse, error)
	GetWebhook(ctx context.Context, userID, orgID, webhookID string) (*domain.WebhookResponse, error)
	ListWebhooks(ctx context.Context, userID, orgID string) ([]domain.WebhookResponse, error)
	UpdateWebhook(ctx context.Context, userID, orgID, webhookID string, req domain.UpdateWebhookRequest) (*domain.WebhookResponse, error)
	DeleteWebhook(ctx context.Context, userID, orgID, webhookID string) error

	TestWebhook(ctx context.Context, userID, orgID, webhookID string) (*domain.TestWebhookResponse, error)
	ListDeliveries(ctx context.Context, userID, orgID, webhookID string, limit int) ([]domain.WebhookDelivery, error)
	DispatchEvent(ctx context.Context, orgID, projectID string, event domain.WebhookEventType, data interface{})
}
