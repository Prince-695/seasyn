package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/handlers"
	"github.com/Prince-695/seasyn/backend/internal/services/migration"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/gofiber/fiber/v2"
)

type mockMigrationServiceForHandler struct {
	job *domain.MigrationJobResponse
}

func (m *mockMigrationServiceForHandler) StartMigration(ctx context.Context, userID, orgID, projectID string, req domain.StartMigrationRequest) (*domain.MigrationJobResponse, error) {
	resp := &domain.MigrationJobResponse{
		ID:             "11111111-1111-1111-1111-111111111111",
		OrganizationID: orgID,
		ProjectID:      projectID,
		SourceConnID:   req.SourceConnectionID,
		TargetConnID:   req.TargetConnectionID,
		SourceTable:    req.SourceTable,
		TargetTable:    req.TargetTable,
		Status:         domain.MigrationStatusPending,
		TotalRows:      500,
		BatchSize:      req.BatchSize,
		CreatedAt:      time.Now(),
	}
	m.job = resp
	return resp, nil
}

func (m *mockMigrationServiceForHandler) CancelMigration(ctx context.Context, userID, orgID, projectID, migrationID string) error {
	if m.job != nil && m.job.ID == migrationID {
		m.job.Status = domain.MigrationStatusCancelled
		return nil
	}
	return apperrors.NotFound("migration job")
}

func (m *mockMigrationServiceForHandler) GetMigration(ctx context.Context, userID, orgID, projectID, migrationID string) (*domain.MigrationJobResponse, error) {
	if m.job != nil && m.job.ID == migrationID {
		return m.job, nil
	}
	return nil, apperrors.NotFound("migration job")
}

func (m *mockMigrationServiceForHandler) ListMigrations(ctx context.Context, userID, orgID, projectID string) ([]domain.MigrationJobResponse, error) {
	if m.job != nil {
		return []domain.MigrationJobResponse{*m.job}, nil
	}
	return []domain.MigrationJobResponse{}, nil
}

func TestMigrationHTTPHandlers(t *testing.T) {
	mockSvc := &mockMigrationServiceForHandler{}
	hub := migration.NewProgressHub()
	handler := handlers.NewMigrationHandler(mockSvc, hub)

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

	// 1. Test POST /v1/organizations/org-1/projects/proj-1/migrations (Start Migration)
	startPayload := []byte(`{
		"source_connection_id": "11111111-1111-1111-1111-111111111111",
		"target_connection_id": "22222222-2222-2222-2222-222222222222",
		"source_table": "users",
		"target_table": "users",
		"batch_size": 250
	}`)
	req := httptest.NewRequest(http.MethodPost, "/v1/organizations/org-1/projects/proj-1/migrations", bytes.NewBuffer(startPayload))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected status 201 Created, got %d", resp.StatusCode)
	}

	var res domain.Response
	json.NewDecoder(resp.Body).Decode(&res)
	if !res.Success {
		t.Errorf("expected success true, got false")
	}

	// 2. Test GET /v1/organizations/org-1/projects/proj-1/migrations (List Migrations)
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/projects/proj-1/migrations", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	// 3. Test GET /v1/organizations/org-1/projects/proj-1/migrations/11111111-1111-1111-1111-111111111111 (Get Migration)
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/projects/proj-1/migrations/11111111-1111-1111-1111-111111111111", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	// 4. Test DELETE /v1/organizations/org-1/projects/proj-1/migrations/11111111-1111-1111-1111-111111111111 (Cancel Migration)
	req = httptest.NewRequest(http.MethodDelete, "/v1/organizations/org-1/projects/proj-1/migrations/11111111-1111-1111-1111-111111111111", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}
}
