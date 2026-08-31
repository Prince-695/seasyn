package editor_test

import (
	"context"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/internal/services/editor"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// Mock DatabaseConnection
type mockDBConn struct {
	schema *domain.DatabaseSchema
}

func (m *mockDBConn) Ping(ctx context.Context) error { return nil }
func (m *mockDBConn) ListTables(ctx context.Context) ([]string, error) {
	var tables []string
	for _, t := range m.schema.Tables {
		tables = append(tables, t.Name)
	}
	return tables, nil
}
func (m *mockDBConn) GetTableSchema(ctx context.Context, tableName string) (*domain.TableSchema, error) {
	for _, t := range m.schema.Tables {
		if t.Name == tableName {
			return &t, nil
		}
	}
	return nil, apperrors.NotFound("table not found")
}
func (m *mockDBConn) GetSchema(ctx context.Context) (*domain.DatabaseSchema, error) {
	return m.schema, nil
}
func (m *mockDBConn) QueryRows(ctx context.Context, table string, req domain.QueryRequest) (*domain.QueryResult, error) {
	return &domain.QueryResult{
		TableName:  table,
		Columns:    []string{"id", "email"},
		Rows:       []map[string]interface{}{{"id": "1", "email": "test@example.com"}},
		TotalRows:  1,
		Page:       1,
		Limit:      50,
		TotalPages: 1,
	}, nil
}
func (m *mockDBConn) InsertRow(ctx context.Context, table string, data map[string]interface{}) (map[string]interface{}, error) {
	return data, nil
}
func (m *mockDBConn) UpdateRow(ctx context.Context, table string, primaryKey map[string]interface{}, data map[string]interface{}) error {
	return nil
}
func (m *mockDBConn) DeleteRow(ctx context.Context, table string, primaryKey map[string]interface{}) error {
	return nil
}
func (m *mockDBConn) StreamRows(ctx context.Context, table string, batchSize int) (<-chan domain.RowBatch, <-chan error) {
	rowCh := make(chan domain.RowBatch)
	errCh := make(chan error)
	close(rowCh)
	close(errCh)
	return rowCh, errCh
}
func (m *mockDBConn) BulkInsert(ctx context.Context, table string, rows []map[string]interface{}) error {
	return nil
}
func (m *mockDBConn) ExecDDL(ctx context.Context, ddl string) error {
	return nil
}
func (m *mockDBConn) Close() error { return nil }

// Mock Adapter
type mockAdapter struct {
	conn *mockDBConn
}

func (m *mockAdapter) Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (ports.DatabaseConnection, error) {
	return m.conn, nil
}

// Mock AdapterRegistry
type mockRegistry struct {
	adapter ports.DatabaseAdapter
}

func (m *mockRegistry) Register(dbType domain.DBType, adapter ports.DatabaseAdapter) {
	m.adapter = adapter
}
func (m *mockRegistry) Get(dbType domain.DBType) (ports.DatabaseAdapter, error) {
	return m.adapter, nil
}

// Mock ProjectRepo
type mockProjectRepoForEditor struct {
	project     *domain.Project
	connections map[string]*domain.DatabaseConnection
}

func (m *mockProjectRepoForEditor) CreateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	return &p, nil
}
func (m *mockProjectRepoForEditor) GetProjectByID(ctx context.Context, id string) (*domain.Project, error) {
	if m.project != nil && m.project.ID == id {
		return m.project, nil
	}
	return nil, apperrors.NotFound("project")
}
func (m *mockProjectRepoForEditor) GetProjectBySlug(ctx context.Context, orgID, slug string) (*domain.Project, error) {
	return m.project, nil
}
func (m *mockProjectRepoForEditor) ListProjectsByOrg(ctx context.Context, orgID string) ([]*domain.Project, error) {
	return []*domain.Project{m.project}, nil
}
func (m *mockProjectRepoForEditor) UpdateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	return &p, nil
}
func (m *mockProjectRepoForEditor) DeleteProject(ctx context.Context, id string) error { return nil }
func (m *mockProjectRepoForEditor) ProjectSlugExists(ctx context.Context, orgID, slug string) (bool, error) {
	return false, nil
}
func (m *mockProjectRepoForEditor) CreateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	return &conn, nil
}
func (m *mockProjectRepoForEditor) GetConnectionByID(ctx context.Context, id string) (*domain.DatabaseConnection, error) {
	if c, ok := m.connections[id]; ok {
		return c, nil
	}
	return nil, apperrors.NotFound("connection")
}
func (m *mockProjectRepoForEditor) ListConnectionsByProject(ctx context.Context, projectID string) ([]*domain.DatabaseConnection, error) {
	var list []*domain.DatabaseConnection
	for _, c := range m.connections {
		list = append(list, c)
	}
	return list, nil
}
func (m *mockProjectRepoForEditor) UpdateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	return &conn, nil
}
func (m *mockProjectRepoForEditor) DeleteConnection(ctx context.Context, id string) error { return nil }

// Mock OrgRepo
type mockOrgRepoForEditor struct{}

func (m *mockOrgRepoForEditor) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForEditor) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForEditor) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForEditor) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForEditor) Delete(ctx context.Context, id string) error { return nil }
func (m *mockOrgRepoForEditor) SlugExists(ctx context.Context, slug string) (bool, error) {
	return false, nil
}
func (m *mockOrgRepoForEditor) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForEditor) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	return &domain.OrganizationMember{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           domain.OrgRoleAdmin,
	}, nil
}
func (m *mockOrgRepoForEditor) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForEditor) RemoveMember(ctx context.Context, orgID, userID string) error {
	return nil
}
func (m *mockOrgRepoForEditor) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	return nil, nil
}
func (m *mockOrgRepoForEditor) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	return nil, nil
}
func (m *mockOrgRepoForEditor) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	return 0, nil
}

// --- QA Tests ---

func TestCalculateSchemaDiff(t *testing.T) {
	// Source schema: users (id, email, age), orders (id, total)
	srcSchema := &domain.DatabaseSchema{
		DBType:       domain.DBTypePostgres,
		DatabaseName: "source_db",
		Tables: []domain.TableSchema{
			{
				Name: "users",
				Columns: []domain.ColumnSchema{
					{Name: "id", DataType: "uuid", SeasonType: domain.SeasonTypeUUID, IsPrimaryKey: true},
					{Name: "email", DataType: "varchar(255)", SeasonType: domain.SeasonTypeString, IsNullable: false},
					{Name: "age", DataType: "int4", SeasonType: domain.SeasonTypeInt, IsNullable: true},
				},
				PrimaryKeys: []string{"id"},
			},
			{
				Name: "orders",
				Columns: []domain.ColumnSchema{
					{Name: "id", DataType: "uuid", SeasonType: domain.SeasonTypeUUID, IsPrimaryKey: true},
					{Name: "total", DataType: "numeric", SeasonType: domain.SeasonTypeDecimal},
				},
				PrimaryKeys: []string{"id"},
			},
		},
	}

	// Target schema: users (id, email [nullable: true]), products (id, name)
	dstSchema := &domain.DatabaseSchema{
		DBType:       domain.DBTypePostgres,
		DatabaseName: "target_db",
		Tables: []domain.TableSchema{
			{
				Name: "users",
				Columns: []domain.ColumnSchema{
					{Name: "id", DataType: "uuid", SeasonType: domain.SeasonTypeUUID, IsPrimaryKey: true},
					{Name: "email", DataType: "varchar(255)", SeasonType: domain.SeasonTypeString, IsNullable: true}, // altered nullable
				},
				PrimaryKeys: []string{"id"},
			},
			{
				Name: "products",
				Columns: []domain.ColumnSchema{
					{Name: "id", DataType: "uuid", SeasonType: domain.SeasonTypeUUID},
				},
			},
		},
	}

	diff := editor.CalculateSchemaDiff("src-1", "dst-1", domain.DBTypePostgres, domain.DBTypePostgres, srcSchema, dstSchema)

	// Verify added table: orders
	if len(diff.TablesAdded) != 1 || diff.TablesAdded[0] != "orders" {
		t.Errorf("expected added table 'orders', got %v", diff.TablesAdded)
	}

	// Verify removed table: products
	if len(diff.TablesRemoved) != 1 || diff.TablesRemoved[0] != "products" {
		t.Errorf("expected removed table 'products', got %v", diff.TablesRemoved)
	}

	// Verify altered table: users
	if len(diff.TablesAltered) != 1 || diff.TablesAltered[0].Name != "users" {
		t.Fatalf("expected 1 altered table 'users', got %d", len(diff.TablesAltered))
	}

	usersDiff := diff.TablesAltered[0]
	// Should have: column added 'age', column altered 'email'
	if len(usersDiff.ColumnDiffs) != 2 {
		t.Errorf("expected 2 column diffs on 'users', got %d", len(usersDiff.ColumnDiffs))
	}
}

func TestSchemaService_InspectAndQuery(t *testing.T) {
	enc := crypto.NewEncryptor("test-secret-1234567890123456")
	encPass, _ := enc.Encrypt("dbpass")

	sampleSchema := &domain.DatabaseSchema{
		DBType:       domain.DBTypePostgres,
		DatabaseName: "app_db",
		Tables: []domain.TableSchema{
			{
				Name: "accounts",
				Columns: []domain.ColumnSchema{
					{Name: "id", DataType: "int8", SeasonType: domain.SeasonTypeInt, IsPrimaryKey: true},
				},
				PrimaryKeys: []string{"id"},
				RowCount:    100,
			},
		},
		InspectedAt: time.Now(),
	}

	dbConn := &mockDBConn{schema: sampleSchema}
	adapter := &mockAdapter{conn: dbConn}
	reg := &mockRegistry{adapter: adapter}

	projRepo := &mockProjectRepoForEditor{
		project: &domain.Project{ID: "proj-1", OrganizationID: "org-1"},
		connections: map[string]*domain.DatabaseConnection{
			"conn-1": {
				ID:                "conn-1",
				ProjectID:         "proj-1",
				DBType:            domain.DBTypePostgres,
				EncryptedPassword: encPass,
			},
		},
	}
	orgRepo := &mockOrgRepoForEditor{}

	svc := editor.NewSchemaService(projRepo, orgRepo, reg, enc)
	ctx := context.Background()

	// 1. Inspect Database
	schema, err := svc.InspectDatabase(ctx, "user-1", "org-1", "proj-1", "conn-1")
	if err != nil {
		t.Fatalf("inspect database failed: %v", err)
	}
	if len(schema.Tables) != 1 || schema.Tables[0].Name != "accounts" {
		t.Errorf("expected table 'accounts', got %v", schema.Tables)
	}

	// 2. Query Rows
	queryRes, err := svc.QueryTableRows(ctx, "user-1", "org-1", "proj-1", "conn-1", "accounts", domain.QueryRequest{
		Page:  1,
		Limit: 50,
	})
	if err != nil {
		t.Fatalf("query rows failed: %v", err)
	}
	if queryRes.TotalRows != 1 || len(queryRes.Rows) != 1 {
		t.Errorf("expected 1 row, got %d", queryRes.TotalRows)
	}
}
