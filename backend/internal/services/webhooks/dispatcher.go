package webhooks

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/google/uuid"
)

// Dispatcher executes outbound HTTP POST requests to webhook subscribers.
type Dispatcher struct {
	client      *http.Client
	webhookRepo ports.WebhookRepository
}

// NewDispatcher creates a new Webhook Dispatcher.
func NewDispatcher(webhookRepo ports.WebhookRepository) *Dispatcher {
	return &Dispatcher{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		webhookRepo: webhookRepo,
	}
}

// ComputeSignature calculates the HMAC-SHA256 signature of a payload.
func ComputeSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

// Send dispatches a single webhook delivery synchronously and records the result in the database.
func (d *Dispatcher) Send(ctx context.Context, webhook domain.Webhook, event domain.WebhookEventType, data interface{}) domain.WebhookDelivery {
	deliveryID := uuid.NewString()

	payload := domain.WebhookPayload{
		Event:     event,
		OrgID:     webhook.OrgID,
		ProjectID: "",
		Timestamp: time.Now().UTC(),
		Data:      data,
	}
	if webhook.ProjectID != nil {
		payload.ProjectID = *webhook.ProjectID
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		delivery := domain.WebhookDelivery{
			ID:           deliveryID,
			WebhookID:    webhook.ID,
			Event:        event,
			Payload:      "",
			StatusCode:   0,
			ResponseBody: fmt.Sprintf("failed to marshal payload: %v", err),
			Success:      false,
			CreatedAt:    time.Now(),
		}
		_ = d.webhookRepo.CreateDelivery(ctx, delivery)
		return delivery
	}

	signature := ComputeSignature(payloadBytes, webhook.Secret)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, webhook.URL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		delivery := domain.WebhookDelivery{
			ID:           deliveryID,
			WebhookID:    webhook.ID,
			Event:        event,
			Payload:      string(payloadBytes),
			StatusCode:   0,
			ResponseBody: fmt.Sprintf("failed to create request: %v", err),
			Success:      false,
			CreatedAt:    time.Now(),
		}
		_ = d.webhookRepo.CreateDelivery(ctx, delivery)
		return delivery
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "SEASYN-Webhook/1.0")
	req.Header.Set("X-Seasyn-Event", string(event))
	req.Header.Set("X-Seasyn-Delivery-ID", deliveryID)
	req.Header.Set("X-Seasyn-Signature-256", signature)

	start := time.Now()
	resp, err := d.client.Do(req)
	duration := time.Since(start).Milliseconds()

	var statusCode int
	var respBodyStr string
	var success bool

	if err != nil {
		respBodyStr = fmt.Sprintf("request error: %v", err)
		success = false
	} else {
		defer resp.Body.Close()
		statusCode = resp.StatusCode
		bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 1024*10)) // Max 10KB response
		respBodyStr = string(bodyBytes)
		success = statusCode >= 200 && statusCode < 300
	}

	delivery := domain.WebhookDelivery{
		ID:                  deliveryID,
		WebhookID:           webhook.ID,
		Event:               event,
		Payload:             string(payloadBytes),
		StatusCode:          statusCode,
		ResponseBody:        respBodyStr,
		Success:             success,
		ExecutionDurationMs: duration,
		CreatedAt:           time.Now(),
	}

	_ = d.webhookRepo.CreateDelivery(ctx, delivery)
	return delivery
}
