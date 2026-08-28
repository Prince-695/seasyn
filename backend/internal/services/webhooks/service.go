package webhooks

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

type webhookService struct {
	webhookRepo ports.WebhookRepository
	orgRepo     ports.OrgRepository
	dispatcher  *Dispatcher
}

// NewWebhookService creates a new WebhookService.
func NewWebhookService(
	webhookRepo ports.WebhookRepository,
	orgRepo ports.OrgRepository,
	dispatcher *Dispatcher,
) ports.WebhookService {
	return &webhookService{
		webhookRepo: webhookRepo,
		orgRepo:     orgRepo,
		dispatcher:  dispatcher,
	}
}

func generateRandomSecret() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func (s *webhookService) requireRole(ctx context.Context, orgID, userID string, minRole domain.OrgRole) error {
	member, err := s.orgRepo.GetMember(ctx, orgID, userID)
	if err != nil {
		return apperrors.Forbidden("You are not a member of this organization")
	}
	order := map[domain.OrgRole]int{
		domain.OrgRoleViewer: 0,
		domain.OrgRoleMember: 1,
		domain.OrgRoleAdmin:  2,
		domain.OrgRoleOwner:  3,
	}
	if order[member.Role] < order[minRole] {
		return apperrors.Forbidden("You do not have permission to perform this action")
	}
	return nil
}

func (s *webhookService) CreateWebhook(ctx context.Context, userID, orgID string, req domain.CreateWebhookRequest) (*domain.WebhookResponse, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return nil, err
	}

	secret := req.Secret
	if secret == "" {
		secret = generateRandomSecret()
	}

	webhook := domain.Webhook{
		OrgID:     orgID,
		ProjectID: req.ProjectID,
		Name:      req.Name,
		URL:       req.URL,
		Secret:    secret,
		Events:    req.Events,
		IsActive:  true,
		CreatedBy: userID,
	}

	created, err := s.webhookRepo.CreateWebhook(ctx, webhook)
	if err != nil {
		return nil, err
	}

	return &domain.WebhookResponse{
		ID:        created.ID,
		OrgID:     created.OrgID,
		ProjectID: created.ProjectID,
		Name:      created.Name,
		URL:       created.URL,
		Secret:    secret, // Return secret once on creation
		Events:    created.Events,
		IsActive:  created.IsActive,
		CreatedAt: created.CreatedAt,
		UpdatedAt: created.UpdatedAt,
	}, nil
}

func (s *webhookService) GetWebhook(ctx context.Context, userID, orgID, webhookID string) (*domain.WebhookResponse, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	webhook, err := s.webhookRepo.GetWebhookByID(ctx, webhookID)
	if err != nil {
		return nil, err
	}
	if webhook.OrgID != orgID {
		return nil, apperrors.Forbidden("Webhook does not belong to this organization")
	}

	return &domain.WebhookResponse{
		ID:        webhook.ID,
		OrgID:     webhook.OrgID,
		ProjectID: webhook.ProjectID,
		Name:      webhook.Name,
		URL:       webhook.URL,
		Events:    webhook.Events,
		IsActive:  webhook.IsActive,
		CreatedAt: webhook.CreatedAt,
		UpdatedAt: webhook.UpdatedAt,
	}, nil
}

func (s *webhookService) ListWebhooks(ctx context.Context, userID, orgID string) ([]domain.WebhookResponse, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	webhooks, err := s.webhookRepo.ListWebhooksByOrg(ctx, orgID)
	if err != nil {
		return nil, err
	}

	var res []domain.WebhookResponse
	for _, w := range webhooks {
		res = append(res, domain.WebhookResponse{
			ID:        w.ID,
			OrgID:     w.OrgID,
			ProjectID: w.ProjectID,
			Name:      w.Name,
			URL:       w.URL,
			Events:    w.Events,
			IsActive:  w.IsActive,
			CreatedAt: w.CreatedAt,
			UpdatedAt: w.UpdatedAt,
		})
	}
	return res, nil
}

func (s *webhookService) UpdateWebhook(ctx context.Context, userID, orgID, webhookID string, req domain.UpdateWebhookRequest) (*domain.WebhookResponse, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return nil, err
	}

	existing, err := s.webhookRepo.GetWebhookByID(ctx, webhookID)
	if err != nil {
		return nil, err
	}
	if existing.OrgID != orgID {
		return nil, apperrors.Forbidden("Webhook does not belong to this organization")
	}

	existing.Name = req.Name
	existing.URL = req.URL
	existing.Events = req.Events
	existing.ProjectID = req.ProjectID
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}

	updated, err := s.webhookRepo.UpdateWebhook(ctx, *existing)
	if err != nil {
		return nil, err
	}

	return &domain.WebhookResponse{
		ID:        updated.ID,
		OrgID:     updated.OrgID,
		ProjectID: updated.ProjectID,
		Name:      updated.Name,
		URL:       updated.URL,
		Events:    updated.Events,
		IsActive:  updated.IsActive,
		CreatedAt: updated.CreatedAt,
		UpdatedAt: updated.UpdatedAt,
	}, nil
}

func (s *webhookService) DeleteWebhook(ctx context.Context, userID, orgID, webhookID string) error {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return err
	}

	existing, err := s.webhookRepo.GetWebhookByID(ctx, webhookID)
	if err != nil {
		return err
	}
	if existing.OrgID != orgID {
		return apperrors.Forbidden("Webhook does not belong to this organization")
	}

	return s.webhookRepo.DeleteWebhook(ctx, webhookID)
}

func (s *webhookService) TestWebhook(ctx context.Context, userID, orgID, webhookID string) (*domain.TestWebhookResponse, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return nil, err
	}

	webhook, err := s.webhookRepo.GetWebhookByID(ctx, webhookID)
	if err != nil {
		return nil, err
	}
	if webhook.OrgID != orgID {
		return nil, apperrors.Forbidden("Webhook does not belong to this organization")
	}

	pingData := map[string]interface{}{
		"message":   "This is a test webhook ping from SEASYN",
		"timestamp": fmt.Sprintf("%v", ctx.Value("time")),
	}

	delivery := s.dispatcher.Send(ctx, *webhook, domain.WebhookEventPing, pingData)

	return &domain.TestWebhookResponse{
		Success:             delivery.Success,
		StatusCode:          delivery.StatusCode,
		ExecutionDurationMs: delivery.ExecutionDurationMs,
		ResponseBody:        delivery.ResponseBody,
	}, nil
}

func (s *webhookService) ListDeliveries(ctx context.Context, userID, orgID, webhookID string, limit int) ([]domain.WebhookDelivery, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	webhook, err := s.webhookRepo.GetWebhookByID(ctx, webhookID)
	if err != nil {
		return nil, err
	}
	if webhook.OrgID != orgID {
		return nil, apperrors.Forbidden("Webhook does not belong to this organization")
	}

	deliveries, err := s.webhookRepo.ListDeliveriesByWebhook(ctx, webhookID, limit)
	if err != nil {
		return nil, err
	}

	var res []domain.WebhookDelivery
	for _, d := range deliveries {
		res = append(res, *d)
	}
	return res, nil
}

// DispatchEvent finds matching active webhooks for the org/project and event type and dispatches concurrently.
func (s *webhookService) DispatchEvent(ctx context.Context, orgID, projectID string, event domain.WebhookEventType, data interface{}) {
	webhooks, err := s.webhookRepo.ListWebhooksByOrg(context.Background(), orgID)
	if err != nil || len(webhooks) == 0 {
		return
	}

	for _, w := range webhooks {
		if !w.IsActive {
			continue
		}

		// Filter by project if webhook is scoped to a specific project
		if w.ProjectID != nil && *w.ProjectID != "" && *w.ProjectID != projectID {
			continue
		}

		// Check if event is subscribed
		subscribed := false
		for _, e := range w.Events {
			if e == event {
				subscribed = true
				break
			}
		}
		if !subscribed {
			continue
		}

		// Dispatch asynchronously
		webhookCopy := *w
		go func() {
			bgCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
			defer cancel()
			s.dispatcher.Send(bgCtx, webhookCopy, event, data)
		}()
	}
}
