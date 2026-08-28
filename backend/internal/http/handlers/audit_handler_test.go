package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/handlers"
	"github.com/gofiber/fiber/v2"
)

type mockAuditServiceForHandler struct{}

func (m *mockAuditServiceForHandler) Log(ctx context.Context, log domain.AuditLog) {}

func (m *mockAuditServiceForHandler) ListLogs(ctx context.Context, userID, orgID string, filter domain.AuditLogFilter) (*domain.AuditLogListResponse, error) {
	return &domain.AuditLogListResponse{
		Logs: []domain.AuditLog{
			{
				ID:           "audit-1",
				OrgID:        orgID,
				UserID:       userID,
				Action:       domain.AuditActionMigrationStarted,
				ResourceType: "migration",
				ResourceID:   "mig-1",
				CreatedAt:    time.Now(),
			},
		},
		TotalCount: 1,
		Page:       1,
		Limit:      50,
		TotalPages: 1,
	}, nil
}

func TestAuditHTTPHandler(t *testing.T) {
	auditSvc := &mockAuditServiceForHandler{}
	handler := handlers.NewAuditHandler(auditSvc)

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

	req := httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/audit-logs?page=1&limit=50", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	var res domain.Response
	json.NewDecoder(resp.Body).Decode(&res)
	if !res.Success {
		t.Errorf("expected success true, got false")
	}
}
