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
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/internal/services/editor"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	"github.com/gofiber/fiber/v2"
)

type mockDBConnForHandler struct{}

func (m *mockDBConnForHandler) Ping(ctx context.Context) error { return nil }
func (m *mockDBConnForHandler) ListTables(ctx context.Context) ([]string, error) {
	return []string{"users", "orders"}, nil
}
func (m *mockDBConnForHandler) GetTableSchema(ctx context.Context, tableName string) (*domain.TableSchema, error) {
	return &domain.TableSchema{
		Name: tableName,
		Columns: []domain.ColumnSchema{
			{Name: "id", DataType: "uuid", SeasonType: domain.SeasonTypeUUID, IsPrimaryKey: true},
		},
		PrimaryKeys: []string{"id"},
	}, nil
}
func (m *mockDBConnForHandler) GetSchema(ctx context.Context) (*domain.DatabaseSchema, error) {
	return &domain.DatabaseSchema{
		DBType:       domain.DBTypePostgres,
		DatabaseName: "app_db",
		Tables: []domain.TableSchema{
			{
				Name: "users",
				Columns: []domain.ColumnSchema{
					{Name: "id", DataType: "uuid", SeasonType: domain.SeasonTypeUUID, IsPrimaryKey: true},
				},
				PrimaryKeys: []string{"id"},
			},
		},
		InspectedAt: time.Now(),
	}, nil
}
func (m *mockDBConnForHandler) QueryRows(ctx context.Context, table string, req domain.QueryRequest) (*domain.QueryResult, error) {
	return &domain.QueryResult{
		TableName: table,
		Columns:   []string{"id"},
		Rows:      []map[string]interface{}{{"id": "1"}},
		TotalRows: 1,
	}, nil
}
func (m *mockDBConnForHandler) InsertRow(ctx context.Context, table string, data map[string]interface{}) (map[string]interface{}, error) {
	return data, nil
}
func (m *mockDBConnForHandler) UpdateRow(ctx context.Context, table string, primaryKey map[string]interface{}, data map[string]interface{}) error {
	return nil
}
func (m *mockDBConnForHandler) DeleteRow(ctx context.Context, table string, primaryKey map[string]interface{}) error {
	return nil
}
func (m *mockDBConnForHandler) StreamRows(ctx context.Context, table string, batchSize int) (<-chan domain.RowBatch, <-chan error) {
	rowCh := make(chan domain.RowBatch)
	errCh := make(chan error)
	close(rowCh)
	close(errCh)
	return rowCh, errCh
}
func (m *mockDBConnForHandler) BulkInsert(ctx context.Context, table string, rows []map[string]interface{}) error {
	return nil
}
func (m *mockDBConnForHandler) ExecDDL(ctx context.Context, ddl string) error {
	return nil
}
func (m *mockDBConnForHandler) Close() error { return nil }

type mockAdapterForHandler struct{}

func (m *mockAdapterForHandler) Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (ports.DatabaseConnection, error) {
	return &mockDBConnForHandler{}, nil
}

type mockRegistryForHandler struct{}

func (m *mockRegistryForHandler) Register(dbType domain.DBType, adapter ports.DatabaseAdapter) {}
func (m *mockRegistryForHandler) Get(dbType domain.DBType) (ports.DatabaseAdapter, error) {
	return &mockAdapterForHandler{}, nil
}

type mockProjectRepoForSchemaHandler struct{}

func (m *mockProjectRepoForSchemaHandler) CreateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	return &p, nil
}
func (m *mockProjectRepoForSchemaHandler) GetProjectByID(ctx context.Context, id string) (*domain.Project, error) {
	return &domain.Project{ID: id, OrganizationID: "org-1"}, nil
}
func (m *mockProjectRepoForSchemaHandler) GetProjectBySlug(ctx context.Context, orgID, slug string) (*domain.Project, error) {
	return nil, nil
}
func (m *mockProjectRepoForSchemaHandler) ListProjectsByOrg(ctx context.Context, orgID string) ([]*domain.Project, error) {
	return nil, nil
}
func (m *mockProjectRepoForSchemaHandler) UpdateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	return &p, nil
}
func (m *mockProjectRepoForSchemaHandler) DeleteProject(ctx context.Context, id string) error {
	return nil
}
func (m *mockProjectRepoForSchemaHandler) ProjectSlugExists(ctx context.Context, orgID, slug string) (bool, error) {
	return false, nil
}
func (m *mockProjectRepoForSchemaHandler) CreateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	return &conn, nil
}
func (m *mockProjectRepoForSchemaHandler) GetConnectionByID(ctx context.Context, id string) (*domain.DatabaseConnection, error) {
	return &domain.DatabaseConnection{
		ID:        id,
		ProjectID: "proj-1",
		DBType:    domain.DBTypePostgres,
	}, nil
}
func (m *mockProjectRepoForSchemaHandler) ListConnectionsByProject(ctx context.Context, projectID string) ([]*domain.DatabaseConnection, error) {
	return nil, nil
}
func (m *mockProjectRepoForSchemaHandler) UpdateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	return &conn, nil
}
func (m *mockProjectRepoForSchemaHandler) DeleteConnection(ctx context.Context, id string) error {
	return nil
}

type mockOrgRepoForSchemaHandler struct{}

func (m *mockOrgRepoForSchemaHandler) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForSchemaHandler) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForSchemaHandler) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForSchemaHandler) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForSchemaHandler) Delete(ctx context.Context, id string) error { return nil }
func (m *mockOrgRepoForSchemaHandler) SlugExists(ctx context.Context, slug string) (bool, error) {
	return false, nil
}
func (m *mockOrgRepoForSchemaHandler) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForSchemaHandler) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	return &domain.OrganizationMember{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           domain.OrgRoleAdmin,
	}, nil
}
func (m *mockOrgRepoForSchemaHandler) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForSchemaHandler) RemoveMember(ctx context.Context, orgID, userID string) error {
	return nil
}
func (m *mockOrgRepoForSchemaHandler) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	return nil, nil
}
func (m *mockOrgRepoForSchemaHandler) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	return nil, nil
}
func (m *mockOrgRepoForSchemaHandler) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	return 0, nil
}

func TestSchemaHTTPHandlers(t *testing.T) {
	projRepo := &mockProjectRepoForSchemaHandler{}
	orgRepo := &mockOrgRepoForSchemaHandler{}
	registry := &mockRegistryForHandler{}
	enc := crypto.NewEncryptor("test-secret-1234567890123456")

	schemaService := editor.NewSchemaService(projRepo, orgRepo, registry, enc)
	schemaHandler := handlers.NewSchemaHandler(schemaService)

	app := fiber.New()
	v1 := app.Group("/v1")

	mockAuth := func(c *fiber.Ctx) error {
		c.Locals("userID", "user-123")
		return c.Next()
	}
	mockVerified := func(c *fiber.Ctx) error {
		return c.Next()
	}

	schemaHandler.RegisterRoutes(v1, mockAuth, mockVerified)

	// 1. Test GET /v1/organizations/org-1/projects/proj-1/connections/conn-1/schema (Inspect Schema)
	req := httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/projects/proj-1/connections/conn-1/schema", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	var res domain.Response
	_ = json.NewDecoder(resp.Body).Decode(&res)
	if !res.Success {
		t.Errorf("expected success true, got false")
	}

	// 2. Test GET /v1/organizations/org-1/projects/proj-1/connections/conn-1/tables (List Tables)
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/projects/proj-1/connections/conn-1/tables", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	// 3. Test GET /v1/organizations/org-1/projects/proj-1/connections/conn-1/tables/users/rows (Query Rows)
	req = httptest.NewRequest(http.MethodGet, "/v1/organizations/org-1/projects/proj-1/connections/conn-1/tables/users/rows?page=1&limit=50", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}

	// 4. Test POST /v1/organizations/org-1/projects/proj-1/schema/diff (Compare Schemas)
	diffPayload := []byte(`{"source_connection_id":"11111111-1111-1111-1111-111111111111","target_connection_id":"22222222-2222-2222-2222-222222222222"}`)
	req = httptest.NewRequest(http.MethodPost, "/v1/organizations/org-1/projects/proj-1/schema/diff", bytes.NewBuffer(diffPayload))
	req.Header.Set("Content-Type", "application/json")

	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("failed test request: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200 OK, got %d", resp.StatusCode)
	}
}
