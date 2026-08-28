package handlers_test

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/handlers"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/gofiber/fiber/v2"
)

type mockWebhookServiceForHandler struct {
	webhook *domain.WebhookResponse
}

func (m *mockWebhookServiceForHandler) CreateWebhook(ctx context.Context, userID, orgID string, req domain.CreateWebhookRequest) (*domain.WebhookResponse, error) {
	resp := &domain.WebhookResponse{
		ID:        "wh-123",
		OrgID:     orgID,
		Name:      req.Name,
		URL:       req.URL,
		Secret:    "generated_secret_123",
		Events:    req.Events,
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	m.webhook = resp
	return resp, nil
}

func (m *mockWebhookServiceForHandler) GetWebhook(ctx context.Context, userID, orgID, webhookID string) (*domain.WebhookResponse, error) {
	if m.webhook != nil && m.webhook.ID == webhookID {
		return m.webhook, nil
	}
	return nil, apperrors.NotFound("webhook")
}

func (m *mockWebhookServiceForHandler) ListWebhooks(ctx context.Context, userID, orgID string) ([]domain.WebhookResponse, error) {
	if m.webhook != nil {
		return []domain.WebhookResponse{*m.webhook}, nil
	}
	return []domain.WebhookResponse{}, nil
}

func (m *mockWebhookServiceForHandler) UpdateWebhook(ctx context.Context, userID, orgID, webhookID string, req domain.UpdateWebhookRequest) (*domain.WebhookResponse, error) {
	if m.webhook != nil && m.webhook.ID == webhookID {
		m.webhook.Name = req.Name
		m.webhook.URL = req.URL
		m.webhook.Events = req.Events
		return m.webhook, nil
	}
	return nil, apperrors.NotFound("webhook")
}

func (m *mockWebhookServiceForHandler) DeleteWebhook(ctx context.Context, userID, orgID, webhookID string) error {
	if m.webhook != nil && m.webhook.ID == webhookID {
		m.webhook = nil
		return nil
	}
	return apperrors.NotFound("webhook")
}

func (m *mockWebhookServiceForHandler) TestWebhook(ctx context.Context, userID, orgID, webhookID string) (*domain.TestWebhookResponse, error) {
	return &domain.TestWebhookResponse{
		Success:             true,
		StatusCode:          200,
		ExecutionDurationMs: 45,
		ResponseBody:        `{"ok":true}`,
	}, nil
}

func (m *mockWebhookServiceForHandler) ListDeliveries(ctx context.Context, userID, orgID, webhookID string, limit int) ([]domain.WebhookDelivery, error) {
	return []domain.WebhookDelivery{
		{
			ID:                  "del-1",
			WebhookID:           webhookID,
			Event:               domain.WebhookEventMigrationCompleted,
			StatusCode:          200,
			Success:             true,
			ExecutionDurationMs: 50,
			CreatedAt:           time.Now(),
		},
	}, nil
}

func (m *mockWebhookServiceForHandler) DispatchEvent(ctx context.Context, orgID, projectID string, event domain.WebhookEventType, data interface{}) {
}

func TestWebhookHTTPHandlers(t *testing.T) {
	svc := &mockWebhookServiceForHandler{}
	handler := handlers.NewWebhookHandler(svc)

	app := fiber.New()
	v1 := app.Group("/v1")

	mockAuth := func(c *fiber.Ctx) error {
		c.Locals("userID", "user-123")
		return c.Next()
	}
	mockVerified := func(c *fiber.Ctx) error {
		return c.Next()
	}

	handler.RegisterRoutes(v1, mockAuth, mockVerified)

	// 1. POST /v1/organizations/org-1/webhooks (Create Webhook)
	createPayload := []byte(`{
		"name": "Slack Notifications",
		"url": "https://hooks.slack.com/services/T00/B00/X00",
		"events": ["migration.completed", "migration.failed"]
	}`)
	req := httptest.NewRequest(http.MethodPost, "/v1/organizations/org-1/webhooks", bytes.NewBuffer(createPayload))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected status 201 Created, got %d", resp.StatusCode)
	}

	// 2. GET /v1/organizations/org-1/webhooks (List Webhooks)
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/webhooks", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	// 3. POST /v1/organizations/org-1/webhooks/wh-123/test (Test Webhook Ping)
	req = httptest.NewRequest(http.MethodPost, "/v1/organizations/org-1/webhooks/wh-123/test", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	// 4. GET /v1/organizations/org-1/webhooks/wh-123/deliveries (List Deliveries)
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/webhooks/wh-123/deliveries", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	// 5. DELETE /v1/organizations/org-1/webhooks/wh-123 (Delete Webhook)
	req = httptest.NewRequest(http.MethodDelete, "/v1/organizations/org-1/webhooks/wh-123", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}
}
