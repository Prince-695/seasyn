package project_test

import (
	"context"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/adapters"
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/services/project"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// MockProjectRepo in-memory
type mockProjectRepo struct {
	projects    map[string]*domain.Project
	connections map[string]*domain.DatabaseConnection
}

func newMockProjectRepo() *mockProjectRepo {
	return &mockProjectRepo{
		projects:    make(map[string]*domain.Project),
		connections: make(map[string]*domain.DatabaseConnection),
	}
}

func (m *mockProjectRepo) CreateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	p.ID = "proj-" + p.Slug
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	m.projects[p.ID] = &p
	return &p, nil
}

func (m *mockProjectRepo) GetProjectByID(ctx context.Context, id string) (*domain.Project, error) {
	if p, ok := m.projects[id]; ok {
		return p, nil
	}
	return nil, apperrors.NotFound("project")
}

func (m *mockProjectRepo) GetProjectBySlug(ctx context.Context, orgID, slug string) (*domain.Project, error) {
	for _, p := range m.projects {
		if p.OrganizationID == orgID && p.Slug == slug {
			return p, nil
		}
	}
	return nil, apperrors.NotFound("project")
}

func (m *mockProjectRepo) ListProjectsByOrg(ctx context.Context, orgID string) ([]*domain.Project, error) {
	var list []*domain.Project
	for _, p := range m.projects {
		if p.OrganizationID == orgID {
			list = append(list, p)
		}
	}
	return list, nil
}

func (m *mockProjectRepo) UpdateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	m.projects[p.ID] = &p
	return &p, nil
}

func (m *mockProjectRepo) DeleteProject(ctx context.Context, id string) error {
	delete(m.projects, id)
	return nil
}

func (m *mockProjectRepo) ProjectSlugExists(ctx context.Context, orgID, slug string) (bool, error) {
	for _, p := range m.projects {
		if p.OrganizationID == orgID && p.Slug == slug {
			return true, nil
		}
	}
	return false, nil
}

func (m *mockProjectRepo) CreateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	conn.ID = "conn-1"
	conn.CreatedAt = time.Now()
	conn.UpdatedAt = time.Now()
	m.connections[conn.ID] = &conn
	return &conn, nil
}

func (m *mockProjectRepo) GetConnectionByID(ctx context.Context, id string) (*domain.DatabaseConnection, error) {
	if c, ok := m.connections[id]; ok {
		return c, nil
	}
	return nil, apperrors.NotFound("connection")
}

func (m *mockProjectRepo) ListConnectionsByProject(ctx context.Context, projectID string) ([]*domain.DatabaseConnection, error) {
	var list []*domain.DatabaseConnection
	for _, c := range m.connections {
		if c.ProjectID == projectID {
			list = append(list, c)
		}
	}
	return list, nil
}

func (m *mockProjectRepo) UpdateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	m.connections[conn.ID] = &conn
	return &conn, nil
}

func (m *mockProjectRepo) DeleteConnection(ctx context.Context, id string) error {
	delete(m.connections, id)
	return nil
}

// MockOrgRepo for project tests
type mockOrgRepoForProject struct {
	members map[string]map[string]*domain.OrganizationMember
}

func (m *mockOrgRepoForProject) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForProject) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForProject) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForProject) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForProject) Delete(ctx context.Context, id string) error { return nil }
func (m *mockOrgRepoForProject) SlugExists(ctx context.Context, slug string) (bool, error) {
	return false, nil
}
func (m *mockOrgRepoForProject) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForProject) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	if orgMembers, ok := m.members[orgID]; ok {
		if mem, ok := orgMembers[userID]; ok {
			return mem, nil
		}
	}
	return nil, apperrors.NotFound("member")
}
func (m *mockOrgRepoForProject) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForProject) RemoveMember(ctx context.Context, orgID, userID string) error {
	return nil
}
func (m *mockOrgRepoForProject) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	return nil, nil
}
func (m *mockOrgRepoForProject) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	return nil, nil
}
func (m *mockOrgRepoForProject) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	return 0, nil
}

// --- QA Test Suites for Project & Connection Management ---

func TestProjectLifecycleAndRBAC(t *testing.T) {
	projRepo := newMockProjectRepo()
	orgRepo := &mockOrgRepoForProject{
		members: map[string]map[string]*domain.OrganizationMember{
			"org-1": {
				"user-admin":  {OrganizationID: "org-1", UserID: "user-admin", Role: domain.OrgRoleAdmin},
				"user-member": {OrganizationID: "org-1", UserID: "user-member", Role: domain.OrgRoleMember},
				"user-viewer": {OrganizationID: "org-1", UserID: "user-viewer", Role: domain.OrgRoleViewer},
			},
		},
	}
	enc := crypto.NewEncryptor("test-jwt-secret-key-123456789012")
	conn := adapters.NewConnector()
	svc := project.NewProjectService(projRepo, orgRepo, enc, conn)
	ctx := context.Background()

	// 1. Viewer tries to create project (Should Fail - Min Role Member)
	_, err := svc.CreateProject(ctx, "user-viewer", "org-1", domain.CreateProjectRequest{
		Name: "Viewer Project",
	})
	if err == nil {
		t.Fatal("expected viewer create project to fail, but it succeeded")
	}

	// 2. Member creates project (Should Succeed with auto slug)
	p, err := svc.CreateProject(ctx, "user-member", "org-1", domain.CreateProjectRequest{
		Name:        "Production DB Cluster",
		Description: "Main production migration workspace",
		Environment: "production",
	})
	if err != nil {
		t.Fatalf("member failed to create project: %v", err)
	}
	if p.Slug != "production-db-cluster" {
		t.Errorf("expected slug 'production-db-cluster', got '%s'", p.Slug)
	}

	// 3. Duplicate project slug rejection
	_, err = svc.CreateProject(ctx, "user-member", "org-1", domain.CreateProjectRequest{
		Name: "Production DB Cluster",
		Slug: "production-db-cluster",
	})
	if err == nil {
		t.Fatal("expected duplicate project slug to fail, but it succeeded")
	}

	// 4. Member adds a database connection with password
	dbConn, err := svc.CreateConnection(ctx, "user-member", "org-1", p.ID, domain.CreateConnectionRequest{
		Name:     "Primary PostgreSQL",
		DBType:   domain.DBTypePostgres,
		Host:     "db.prod.internal",
		Port:     5432,
		Database: "app_db",
		Username: "db_user",
		Password: "super-secret-password-123!",
		SSLMode:  "require",
		IsSource: true,
	})
	if err != nil {
		t.Fatalf("failed to add database connection: %v", err)
	}

	// Verify public DTO does not expose password
	if dbConn.Name != "Primary PostgreSQL" {
		t.Errorf("expected connection name 'Primary PostgreSQL', got '%s'", dbConn.Name)
	}

	// Verify raw repository holds AES-256-GCM encrypted password (not plaintext)
	savedRaw := projRepo.connections[dbConn.ID]
	if savedRaw.EncryptedPassword == "super-secret-password-123!" {
		t.Fatal("security breach: database password was saved in plaintext!")
	}

	// Verify decrypted password equals original
	decrypted, err := enc.Decrypt(savedRaw.EncryptedPassword)
	if err != nil || decrypted != "super-secret-password-123!" {
		t.Errorf("decrypted password mismatch: got '%s', err: %v", decrypted, err)
	}

	// 5. Viewer gets project details (Should Succeed and include connections)
	detail, err := svc.GetProject(ctx, "user-viewer", "org-1", p.ID)
	if err != nil {
		t.Fatalf("viewer failed to get project details: %v", err)
	}
	if len(detail.Connections) != 1 {
		t.Errorf("expected 1 connection, got %d", len(detail.Connections))
	}

	// 6. Member tries to delete project (Should Fail - Requires Admin)
	err = svc.DeleteProject(ctx, "user-member", "org-1", p.ID)
	if err == nil {
		t.Fatal("expected member delete project to fail, but it succeeded")
	}

	// 7. Admin deletes project (Should Succeed)
	err = svc.DeleteProject(ctx, "user-admin", "org-1", p.ID)
	if err != nil {
		t.Fatalf("admin failed to delete project: %v", err)
	}
}
