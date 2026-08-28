package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"gorm.io/gorm"
)

type webhookRepo struct {
	db *gorm.DB
}

// NewWebhookRepository creates a new WebhookRepository backed by GORM.
func NewWebhookRepository(db *gorm.DB) ports.WebhookRepository {
	return &webhookRepo{db: db}
}

func (r *webhookRepo) CreateWebhook(ctx context.Context, webhook domain.Webhook) (*domain.Webhook, error) {
	eventsJSON, _ := json.Marshal(webhook.Events)

	model := WebhookModel{
		OrgID:     webhook.OrgID,
		ProjectID: webhook.ProjectID,
		Name:      webhook.Name,
		URL:       webhook.URL,
		Secret:    webhook.Secret,
		Events:    string(eventsJSON),
		IsActive:  webhook.IsActive,
		CreatedBy: webhook.CreatedBy,
	}

	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return nil, fmt.Errorf("create webhook: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *webhookRepo) GetWebhookByID(ctx context.Context, id string) (*domain.Webhook, error) {
	var model WebhookModel
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, apperrors.NotFound("webhook not found")
		}
		return nil, fmt.Errorf("get webhook: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *webhookRepo) ListWebhooksByOrg(ctx context.Context, orgID string) ([]*domain.Webhook, error) {
	var models []WebhookModel
	if err := r.db.WithContext(ctx).Where("org_id = ?", orgID).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, fmt.Errorf("list webhooks: %w", err)
	}

	var webhooks []*domain.Webhook
	for _, m := range models {
		webhooks = append(webhooks, m.ToDomain())
	}
	return webhooks, nil
}

func (r *webhookRepo) ListWebhooksByProject(ctx context.Context, projectID string) ([]*domain.Webhook, error) {
	var models []WebhookModel
	if err := r.db.WithContext(ctx).Where("project_id = ?", projectID).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, fmt.Errorf("list webhooks by project: %w", err)
	}

	var webhooks []*domain.Webhook
	for _, m := range models {
		webhooks = append(webhooks, m.ToDomain())
	}
	return webhooks, nil
}

func (r *webhookRepo) UpdateWebhook(ctx context.Context, webhook domain.Webhook) (*domain.Webhook, error) {
	eventsJSON, _ := json.Marshal(webhook.Events)

	updates := map[string]interface{}{
		"name":       webhook.Name,
		"url":        webhook.URL,
		"events":     string(eventsJSON),
		"is_active":  webhook.IsActive,
		"project_id": webhook.ProjectID,
	}

	res := r.db.WithContext(ctx).Model(&WebhookModel{}).Where("id = ?", webhook.ID).Updates(updates)
	if res.Error != nil {
		return nil, fmt.Errorf("update webhook: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return nil, apperrors.NotFound("webhook not found")
	}

	return r.GetWebhookByID(ctx, webhook.ID)
}

func (r *webhookRepo) DeleteWebhook(ctx context.Context, id string) error {
	res := r.db.WithContext(ctx).Where("id = ?", id).Delete(&WebhookModel{})
	if res.Error != nil {
		return fmt.Errorf("delete webhook: %w", res.Error)
	}
	if res.RowsAffected == 0 {
		return apperrors.NotFound("webhook not found")
	}
	return nil
}

func (r *webhookRepo) CreateDelivery(ctx context.Context, delivery domain.WebhookDelivery) error {
	model := WebhookDeliveryModel{
		WebhookID:           delivery.WebhookID,
		Event:               string(delivery.Event),
		Payload:             delivery.Payload,
		StatusCode:          delivery.StatusCode,
		ResponseBody:        delivery.ResponseBody,
		Success:             delivery.Success,
		ExecutionDurationMs: delivery.ExecutionDurationMs,
	}

	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return fmt.Errorf("create webhook delivery: %w", err)
	}
	return nil
}

func (r *webhookRepo) ListDeliveriesByWebhook(ctx context.Context, webhookID string, limit int) ([]*domain.WebhookDelivery, error) {
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var models []WebhookDeliveryModel
	if err := r.db.WithContext(ctx).Where("webhook_id = ?", webhookID).Order("created_at DESC").Limit(limit).Find(&models).Error; err != nil {
		return nil, fmt.Errorf("list webhook deliveries: %w", err)
	}

	var deliveries []*domain.WebhookDelivery
	for _, m := range models {
		d := m.ToDomain()
		deliveries = append(deliveries, &d)
	}
	return deliveries, nil
}
