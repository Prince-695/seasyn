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
	"github.com/Prince-695/seasyn/backend/internal/services/orgs"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/gofiber/fiber/v2"
)

type mockOrgRepoForHandler struct {
	orgs    map[string]*domain.Organization
	members map[string]map[string]*domain.OrganizationMember
}

func newMockOrgRepoForHandler() *mockOrgRepoForHandler {
	return &mockOrgRepoForHandler{
		orgs:    make(map[string]*domain.Organization),
		members: make(map[string]map[string]*domain.OrganizationMember),
	}
}

func (m *mockOrgRepoForHandler) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	org.ID = "org-1"
	org.CreatedAt = time.Now()
	org.UpdatedAt = time.Now()
	m.orgs[org.ID] = &org
	return &org, nil
}

func (m *mockOrgRepoForHandler) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	if org, ok := m.orgs[id]; ok {
		return org, nil
	}
	return nil, apperrors.NotFound("organization")
}

func (m *mockOrgRepoForHandler) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	for _, o := range m.orgs {
		if o.Slug == slug {
			return o, nil
		}
	}
	return nil, apperrors.NotFound("organization")
}

func (m *mockOrgRepoForHandler) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	m.orgs[org.ID] = &org
	return &org, nil
}

func (m *mockOrgRepoForHandler) Delete(ctx context.Context, id string) error {
	delete(m.orgs, id)
	return nil
}

func (m *mockOrgRepoForHandler) SlugExists(ctx context.Context, slug string) (bool, error) {
	for _, o := range m.orgs {
		if o.Slug == slug {
			return true, nil
		}
	}
	return false, nil
}

func (m *mockOrgRepoForHandler) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	if _, ok := m.members[orgID]; !ok {
		m.members[orgID] = make(map[string]*domain.OrganizationMember)
	}
	m.members[orgID][userID] = &domain.OrganizationMember{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           role,
		InvitedBy:      invitedBy,
		JoinedAt:       time.Now(),
	}
	return nil
}

func (m *mockOrgRepoForHandler) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	if orgMembers, ok := m.members[orgID]; ok {
		if mem, ok := orgMembers[userID]; ok {
			return mem, nil
		}
	}
	return nil, apperrors.NotFound("member")
}

func (m *mockOrgRepoForHandler) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return nil
}

func (m *mockOrgRepoForHandler) RemoveMember(ctx context.Context, orgID, userID string) error {
	return nil
}

func (m *mockOrgRepoForHandler) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	return []*domain.OrgMemberDetail{}, nil
}

func (m *mockOrgRepoForHandler) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	var list []*domain.OrgWithRole
	for _, o := range m.orgs {
		list = append(list, &domain.OrgWithRole{
			Organization: *o,
			Role:         domain.OrgRoleOwner,
		})
	}
	return list, nil
}

func (m *mockOrgRepoForHandler) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	return int64(len(m.orgs)), nil
}

type mockUserRepoForHandler struct{}

func (m *mockUserRepoForHandler) Create(ctx context.Context, u domain.User) (*domain.User, error) {
	return &u, nil
}
func (m *mockUserRepoForHandler) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	return &domain.User{ID: "invited-user", Email: email}, nil
}
func (m *mockUserRepoForHandler) GetByID(ctx context.Context, id string) (*domain.User, error) {
	return &domain.User{ID: id, Email: "test@example.com"}, nil
}
func (m *mockUserRepoForHandler) Update(ctx context.Context, u domain.User) (*domain.User, error) {
	return &u, nil
}
func (m *mockUserRepoForHandler) UpdatePassword(ctx context.Context, email, hashedPassword string) error {
	return nil
}
func (m *mockUserRepoForHandler) CheckUsername(ctx context.Context, username string) (bool, error) {
	return false, nil
}

func TestOrgHTTPHandlers(t *testing.T) {
	orgRepo := newMockOrgRepoForHandler()
	userRepo := &mockUserRepoForHandler{}
	orgService := orgs.NewOrgService(orgRepo, userRepo)
	orgHandler := handlers.NewOrgHandler(orgService)

	app := fiber.New()
	v1 := app.Group("/v1")

	// Dummy auth middleware that sets userID
	mockAuth := func(c *fiber.Ctx) error {
		c.Locals("userID", "user-123")
		return c.Next()
	}
	mockVerified := func(c *fiber.Ctx) error {
		return c.Next()
	}

	orgHandler.RegisterRoutes(v1, mockAuth, mockVerified)

	// 1. Test POST /v1/organizations (Create Org)
	payload := []byte(`{"name":"DevOps Hub","slug":"devops-hub","description":"Team repo"}`)
	req := httptest.NewRequest(http.MethodPost, "/v1/organizations", bytes.NewBuffer(payload))
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

	// 2. Test GET /v1/organizations (List Orgs)
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}
}
