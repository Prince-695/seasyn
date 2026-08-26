package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/adapters"
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/handlers"
	"github.com/Prince-695/seasyn/backend/internal/services/project"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/gofiber/fiber/v2"
)

type mockProjectRepoForHandler struct {
	projects    map[string]*domain.Project
	connections map[string]*domain.DatabaseConnection
}

func newMockProjectRepoForHandler() *mockProjectRepoForHandler {
	return &mockProjectRepoForHandler{
		projects:    make(map[string]*domain.Project),
		connections: make(map[string]*domain.DatabaseConnection),
	}
}

func (m *mockProjectRepoForHandler) CreateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	p.ID = "proj-1"
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	m.projects[p.ID] = &p
	return &p, nil
}

func (m *mockProjectRepoForHandler) GetProjectByID(ctx context.Context, id string) (*domain.Project, error) {
	if p, ok := m.projects[id]; ok {
		return p, nil
	}
	return nil, apperrors.NotFound("project")
}

func (m *mockProjectRepoForHandler) GetProjectBySlug(ctx context.Context, orgID, slug string) (*domain.Project, error) {
	return nil, apperrors.NotFound("project")
}

func (m *mockProjectRepoForHandler) ListProjectsByOrg(ctx context.Context, orgID string) ([]*domain.Project, error) {
	var list []*domain.Project
	for _, p := range m.projects {
		list = append(list, p)
	}
	return list, nil
}

func (m *mockProjectRepoForHandler) UpdateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	m.projects[p.ID] = &p
	return &p, nil
}

func (m *mockProjectRepoForHandler) DeleteProject(ctx context.Context, id string) error {
	delete(m.projects, id)
	return nil
}

func (m *mockProjectRepoForHandler) ProjectSlugExists(ctx context.Context, orgID, slug string) (bool, error) {
	return false, nil
}

func (m *mockProjectRepoForHandler) CreateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	conn.ID = "conn-1"
	conn.CreatedAt = time.Now()
	conn.UpdatedAt = time.Now()
	m.connections[conn.ID] = &conn
	return &conn, nil
}

func (m *mockProjectRepoForHandler) GetConnectionByID(ctx context.Context, id string) (*domain.DatabaseConnection, error) {
	if c, ok := m.connections[id]; ok {
		return c, nil
	}
	return nil, apperrors.NotFound("connection")
}

func (m *mockProjectRepoForHandler) ListConnectionsByProject(ctx context.Context, projectID string) ([]*domain.DatabaseConnection, error) {
	return []*domain.DatabaseConnection{}, nil
}

func (m *mockProjectRepoForHandler) UpdateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	m.connections[conn.ID] = &conn
	return &conn, nil
}

func (m *mockProjectRepoForHandler) DeleteConnection(ctx context.Context, id string) error {
	delete(m.connections, id)
	return nil
}

type mockOrgRepoForProjectHandler struct{}

func (m *mockOrgRepoForProjectHandler) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForProjectHandler) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForProjectHandler) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForProjectHandler) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForProjectHandler) Delete(ctx context.Context, id string) error { return nil }
func (m *mockOrgRepoForProjectHandler) SlugExists(ctx context.Context, slug string) (bool, error) {
	return false, nil
}
func (m *mockOrgRepoForProjectHandler) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForProjectHandler) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	return &domain.OrganizationMember{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           domain.OrgRoleAdmin,
	}, nil
}
func (m *mockOrgRepoForProjectHandler) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForProjectHandler) RemoveMember(ctx context.Context, orgID, userID string) error {
	return nil
}
func (m *mockOrgRepoForProjectHandler) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	return nil, nil
}
func (m *mockOrgRepoForProjectHandler) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	return nil, nil
}
func (m *mockOrgRepoForProjectHandler) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	return 0, nil
}

func TestProjectHTTPHandlers(t *testing.T) {
	projRepo := newMockProjectRepoForHandler()
	orgRepo := &mockOrgRepoForProjectHandler{}
	enc := crypto.NewEncryptor("test-secret-key-1234567890123456")
	connector := adapters.NewConnector()
	projectService := project.NewProjectService(projRepo, orgRepo, enc, connector)
	projectHandler := handlers.NewProjectHandler(projectService)

	app := fiber.New()
	v1 := app.Group("/v1")

	mockAuth := func(c *fiber.Ctx) error {
		c.Locals("userID", "user-123")
		return c.Next()
	}
	mockVerified := func(c *fiber.Ctx) error {
		return c.Next()
	}

	projectHandler.RegisterRoutes(v1, mockAuth, mockVerified)

	// 1. Test POST /v1/organizations/org-1/projects (Create Project)
	payload := []byte(`{"name":"Sync Pipeline","slug":"sync-pipeline","description":"Test project"}`)
	req := httptest.NewRequest(http.MethodPost, "/v1/organizations/org-1/projects", bytes.NewBuffer(payload))
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

	// 2. Test GET /v1/organizations/org-1/projects (List Projects)
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/projects", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	// 3. Test POST /v1/organizations/org-1/projects/proj-1/connections (Create Connection)
	connPayload := []byte(`{"name":"Source PostgreSQL","db_type":"postgres","host":"localhost","port":5432,"database":"db","username":"u","password":"p"}`)
	req = httptest.NewRequest(http.MethodPost, "/v1/organizations/org-1/projects/proj-1/connections", bytes.NewBuffer(connPayload))
	req.Header.Set("Content-Type", "application/json")

	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected status 201 Created, got %d", resp.StatusCode)
	}
}
