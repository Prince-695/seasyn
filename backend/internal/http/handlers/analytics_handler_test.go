package handlers_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/handlers"
	"github.com/gofiber/fiber/v2"
)

type mockAnalyticsServiceForHandler struct {
	orgOverview  *domain.OrgAnalyticsOverview
	projOverview *domain.ProjectAnalytics
	migOverview  *domain.MigrationAnalytics
}

func (m *mockAnalyticsServiceForHandler) GetOrgAnalyticsOverview(ctx context.Context, userID, orgID string) (*domain.OrgAnalyticsOverview, error) {
	return m.orgOverview, nil
}

func (m *mockAnalyticsServiceForHandler) GetProjectAnalytics(ctx context.Context, userID, orgID, projectID string) (*domain.ProjectAnalytics, error) {
	return m.projOverview, nil
}

func (m *mockAnalyticsServiceForHandler) GetMigrationAnalytics(ctx context.Context, userID, orgID, projectID string) (*domain.MigrationAnalytics, error) {
	return m.migOverview, nil
}

func TestAnalyticsHandler(t *testing.T) {
	svc := &mockAnalyticsServiceForHandler{
		orgOverview: &domain.OrgAnalyticsOverview{
			Quotas: domain.OrgQuotasSummary{
				Projects: domain.QuotaUsage{Used: 2, Max: 5, Percentage: 40},
			},
		},
		projOverview: &domain.ProjectAnalytics{
			ConnectionQuota: domain.ProjectConnectionQuota{Used: 3, Max: 6},
		},
		migOverview: &domain.MigrationAnalytics{
			Summary: domain.MigrationIntelligenceSummary{TotalPipelines: 12},
		},
	}

	h := handlers.NewAnalyticsHandler(svc)

	app := fiber.New()
	v1 := app.Group("/v1")

	mockAuth := func(c *fiber.Ctx) error {
		c.Locals("userID", "user-123")
		return c.Next()
	}
	mockVerified := func(c *fiber.Ctx) error {
		return c.Next()
	}

	h.RegisterRoutes(v1, mockAuth, mockVerified)

	// 1. GET /v1/organizations/org-1/analytics/overview
	req := httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/analytics/overview", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", resp.StatusCode)
	}

	var res domain.Response
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if !res.Success {
		t.Errorf("expected success true, got false")
	}

	// 2. GET /v1/organizations/org-1/projects/proj-1/analytics
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/projects/proj-1/analytics", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", resp.StatusCode)
	}

	// 3. GET /v1/organizations/org-1/projects/proj-1/migrations/analytics
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/projects/proj-1/migrations/analytics", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", resp.StatusCode)
	}
}

func TestAnalyticsHandler_Unauthorized(t *testing.T) {
	svc := &mockAnalyticsServiceForHandler{}
	h := handlers.NewAnalyticsHandler(svc)

	app := fiber.New()
	v1 := app.Group("/v1")

	mockAuthReject := func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.Response{
			Success: false,
			Error:   "UNAUTHORIZED",
		})
	}
	mockVerified := func(c *fiber.Ctx) error {
		return c.Next()
	}

	h.RegisterRoutes(v1, mockAuthReject, mockVerified)

	endpoints := []string{
		"/v1/organizations/org-1/analytics/overview",
		"/v1/organizations/org-1/projects/proj-1/analytics",
		"/v1/organizations/org-1/projects/proj-1/migrations/analytics",
	}

	for _, ep := range endpoints {
		req := httptest.NewRequest(http.MethodGet, ep, nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("request to %s failed: %v", ep, err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("expected 401 Unauthorized on %s, got %d", ep, resp.StatusCode)
		}
	}
}
