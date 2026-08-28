package webhooks_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/services/webhooks"
)

type mockWebhookRepoForDispatcher struct {
	deliveries []domain.WebhookDelivery
}

func (m *mockWebhookRepoForDispatcher) CreateWebhook(ctx context.Context, webhook domain.Webhook) (*domain.Webhook, error) {
	return &webhook, nil
}
func (m *mockWebhookRepoForDispatcher) GetWebhookByID(ctx context.Context, id string) (*domain.Webhook, error) {
	return nil, nil
}
func (m *mockWebhookRepoForDispatcher) ListWebhooksByOrg(ctx context.Context, orgID string) ([]*domain.Webhook, error) {
	return nil, nil
}
func (m *mockWebhookRepoForDispatcher) ListWebhooksByProject(ctx context.Context, projectID string) ([]*domain.Webhook, error) {
	return nil, nil
}
func (m *mockWebhookRepoForDispatcher) UpdateWebhook(ctx context.Context, webhook domain.Webhook) (*domain.Webhook, error) {
	return &webhook, nil
}
func (m *mockWebhookRepoForDispatcher) DeleteWebhook(ctx context.Context, id string) error {
	return nil
}
func (m *mockWebhookRepoForDispatcher) CreateDelivery(ctx context.Context, delivery domain.WebhookDelivery) error {
	m.deliveries = append(m.deliveries, delivery)
	return nil
}
func (m *mockWebhookRepoForDispatcher) ListDeliveriesByWebhook(ctx context.Context, webhookID string, limit int) ([]*domain.WebhookDelivery, error) {
	return nil, nil
}

func TestComputeSignature(t *testing.T) {
	payload := []byte(`{"event":"migration.completed"}`)
	secret := "secret_key_123"

	sig1 := webhooks.ComputeSignature(payload, secret)
	sig2 := webhooks.ComputeSignature(payload, secret)

	if sig1 != sig2 {
		t.Errorf("expected deterministic signature, got %q != %q", sig1, sig2)
	}

	if len(sig1) < 10 || sig1[:7] != "sha256=" {
		t.Errorf("signature should start with 'sha256=', got %q", sig1)
	}
}

func TestDispatcher_Send(t *testing.T) {
	secret := "my_webhook_secret"
	var receivedEvent string
	var receivedSignature string
	var receivedPayload domain.WebhookPayload

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedEvent = r.Header.Get("X-Seasyn-Event")
		receivedSignature = r.Header.Get("X-Seasyn-Signature-256")
		_ = json.NewDecoder(r.Body).Decode(&receivedPayload)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"received"}`))
	}))
	defer server.Close()

	repo := &mockWebhookRepoForDispatcher{}
	dispatcher := webhooks.NewDispatcher(repo)

	webhook := domain.Webhook{
		ID:     "wh-123",
		OrgID:  "org-456",
		URL:    server.URL,
		Secret: secret,
	}

	delivery := dispatcher.Send(context.Background(), webhook, domain.WebhookEventMigrationCompleted, map[string]interface{}{
		"migrated_rows": 100,
	})

	if !delivery.Success {
		t.Errorf("expected delivery success, got false: %s", delivery.ResponseBody)
	}
	if delivery.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", delivery.StatusCode)
	}
	if receivedEvent != string(domain.WebhookEventMigrationCompleted) {
		t.Errorf("expected event header %q, got %q", domain.WebhookEventMigrationCompleted, receivedEvent)
	}
	if receivedSignature == "" {
		t.Error("expected signature header, got empty")
	}
	if len(repo.deliveries) != 1 {
		t.Errorf("expected 1 logged delivery, got %d", len(repo.deliveries))
	}
}
