package migration_test

import (
	"context"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/internal/services/migration"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// Mock MigrationRepository
type mockMigrationRepo struct {
	jobs map[string]*domain.MigrationJob
}

func newMockMigrationRepo() *mockMigrationRepo {
	return &mockMigrationRepo{jobs: make(map[string]*domain.MigrationJob)}
}

func (m *mockMigrationRepo) Create(ctx context.Context, job domain.MigrationJob) (*domain.MigrationJob, error) {
	job.ID = "mig-job-1"
	job.Status = domain.MigrationStatusPending
	job.CreatedAt = time.Now()
	m.jobs[job.ID] = &job
	return &job, nil
}

func (m *mockMigrationRepo) GetByID(ctx context.Context, id string) (*domain.MigrationJob, error) {
	if j, ok := m.jobs[id]; ok {
		return j, nil
	}
	return nil, apperrors.NotFound("migration job")
}

func (m *mockMigrationRepo) UpdateStatus(ctx context.Context, id string, status domain.MigrationStatus, migratedRows, totalRows int64, errMsg string) error {
	if j, ok := m.jobs[id]; ok {
		j.Status = status
		j.MigratedRows = migratedRows
		j.TotalRows = totalRows
		j.ErrorMessage = errMsg
		return nil
	}
	return apperrors.NotFound("migration job")
}

func (m *mockMigrationRepo) ListByProject(ctx context.Context, projectID string) ([]*domain.MigrationJob, error) {
	var list []*domain.MigrationJob
	for _, j := range m.jobs {
		if j.ProjectID == projectID {
			list = append(list, j)
		}
	}
	return list, nil
}

func (m *mockMigrationRepo) ListByOrg(ctx context.Context, orgID string) ([]*domain.MigrationJob, error) {
	var list []*domain.MigrationJob
	for _, j := range m.jobs {
		if j.OrganizationID == orgID {
			list = append(list, j)
		}
	}
	return list, nil
}

// Mock ProjectRepository
type mockProjectRepoForMigration struct {
	project     *domain.Project
	connections map[string]*domain.DatabaseConnection
}

func (m *mockProjectRepoForMigration) CreateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	return &p, nil
}
func (m *mockProjectRepoForMigration) GetProjectByID(ctx context.Context, id string) (*domain.Project, error) {
	if m.project != nil && m.project.ID == id {
		return m.project, nil
	}
	return nil, apperrors.NotFound("project")
}
func (m *mockProjectRepoForMigration) GetProjectBySlug(ctx context.Context, orgID, slug string) (*domain.Project, error) {
	return m.project, nil
}
func (m *mockProjectRepoForMigration) ListProjectsByOrg(ctx context.Context, orgID string) ([]*domain.Project, error) {
	return []*domain.Project{m.project}, nil
}
func (m *mockProjectRepoForMigration) UpdateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	return &p, nil
}
func (m *mockProjectRepoForMigration) DeleteProject(ctx context.Context, id string) error {
	return nil
}
func (m *mockProjectRepoForMigration) ProjectSlugExists(ctx context.Context, orgID, slug string) (bool, error) {
	return false, nil
}
func (m *mockProjectRepoForMigration) CreateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	return &conn, nil
}
func (m *mockProjectRepoForMigration) GetConnectionByID(ctx context.Context, id string) (*domain.DatabaseConnection, error) {
	if c, ok := m.connections[id]; ok {
		return c, nil
	}
	return nil, apperrors.NotFound("connection")
}
func (m *mockProjectRepoForMigration) ListConnectionsByProject(ctx context.Context, projectID string) ([]*domain.DatabaseConnection, error) {
	return nil, nil
}
func (m *mockProjectRepoForMigration) UpdateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	return &conn, nil
}
func (m *mockProjectRepoForMigration) DeleteConnection(ctx context.Context, id string) error {
	return nil
}

// Mock OrgRepository
type mockOrgRepoForMigration struct{}

func (m *mockOrgRepoForMigration) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForMigration) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForMigration) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForMigration) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForMigration) Delete(ctx context.Context, id string) error { return nil }
func (m *mockOrgRepoForMigration) SlugExists(ctx context.Context, slug string) (bool, error) {
	return false, nil
}
func (m *mockOrgRepoForMigration) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForMigration) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	return &domain.OrganizationMember{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           domain.OrgRoleAdmin,
	}, nil
}
func (m *mockOrgRepoForMigration) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForMigration) RemoveMember(ctx context.Context, orgID, userID string) error {
	return nil
}
func (m *mockOrgRepoForMigration) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	return nil, nil
}
func (m *mockOrgRepoForMigration) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	return nil, nil
}
func (m *mockOrgRepoForMigration) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	return 0, nil
}

// Mock DBConnection & Adapter
type mockStreamDBConn struct{}

func (m *mockStreamDBConn) Ping(ctx context.Context) error { return nil }
func (m *mockStreamDBConn) ListTables(ctx context.Context) ([]string, error) {
	return []string{"users"}, nil
}
func (m *mockStreamDBConn) GetTableSchema(ctx context.Context, tableName string) (*domain.TableSchema, error) {
	return &domain.TableSchema{Name: tableName}, nil
}
func (m *mockStreamDBConn) GetSchema(ctx context.Context) (*domain.DatabaseSchema, error) {
	return &domain.DatabaseSchema{}, nil
}
func (m *mockStreamDBConn) QueryRows(ctx context.Context, table string, req domain.QueryRequest) (*domain.QueryResult, error) {
	return &domain.QueryResult{TotalRows: 100}, nil
}
func (m *mockStreamDBConn) InsertRow(ctx context.Context, table string, data map[string]interface{}) (map[string]interface{}, error) {
	return data, nil
}
func (m *mockStreamDBConn) UpdateRow(ctx context.Context, table string, primaryKey map[string]interface{}, data map[string]interface{}) error {
	return nil
}
func (m *mockStreamDBConn) DeleteRow(ctx context.Context, table string, primaryKey map[string]interface{}) error {
	return nil
}
func (m *mockStreamDBConn) StreamRows(ctx context.Context, table string, batchSize int) (<-chan domain.RowBatch, <-chan error) {
	rowCh := make(chan domain.RowBatch, 1)
	errCh := make(chan error)
	rowCh <- domain.RowBatch{
		Index:  0,
		Rows:   []map[string]interface{}{{"id": "1", "name": "Alice"}},
		IsLast: true,
	}
	close(rowCh)
	close(errCh)
	return rowCh, errCh
}
func (m *mockStreamDBConn) BulkInsert(ctx context.Context, table string, rows []map[string]interface{}) error {
	return nil
}
func (m *mockStreamDBConn) Close() error { return nil }

type mockStreamAdapter struct{}

func (m *mockStreamAdapter) Connect(ctx context.Context, conn domain.DatabaseConnection, plainPassword, plainURI string) (ports.DatabaseConnection, error) {
	return &mockStreamDBConn{}, nil
}

type mockStreamRegistry struct{}

func (m *mockStreamRegistry) Register(dbType domain.DBType, adapter ports.DatabaseAdapter) {}
func (m *mockStreamRegistry) Get(dbType domain.DBType) (ports.DatabaseAdapter, error) {
	return &mockStreamAdapter{}, nil
}

func TestMigrationService_Lifecycle(t *testing.T) {
	enc := crypto.NewEncryptor("test-secret-1234567890123456")
	encPass, _ := enc.Encrypt("dbpassword")

	migRepo := newMockMigrationRepo()
	orgRepo := &mockOrgRepoForMigration{}
	projRepo := &mockProjectRepoForMigration{
		project: &domain.Project{ID: "proj-1", OrganizationID: "org-1"},
		connections: map[string]*domain.DatabaseConnection{
			"src-conn": {
				ID:                "src-conn",
				ProjectID:         "proj-1",
				DBType:            domain.DBTypePostgres,
				EncryptedPassword: encPass,
			},
			"dst-conn": {
				ID:                "dst-conn",
				ProjectID:         "proj-1",
				DBType:            domain.DBTypePostgres,
				EncryptedPassword: encPass,
			},
		},
	}
	registry := &mockStreamRegistry{}
	hub := migration.NewProgressHub()
	streamer := migration.NewStreamer(projRepo, registry, enc, hub)

	svc := migration.NewService(migRepo, orgRepo, projRepo, streamer, hub, nil, nil)
	ctx := context.Background()

	// 1. Start Migration
	startReq := domain.StartMigrationRequest{
		SourceConnectionID: "src-conn",
		TargetConnectionID: "dst-conn",
		SourceTable:        "users",
		TargetTable:        "users",
		BatchSize:          100,
	}

	jobResp, err := svc.StartMigration(ctx, "user-1", "org-1", "proj-1", startReq)
	if err != nil {
		t.Fatalf("failed to start migration: %v", err)
	}

	if jobResp.ID != "mig-job-1" {
		t.Errorf("expected job ID 'mig-job-1', got %q", jobResp.ID)
	}
	if jobResp.TotalRows != 100 {
		t.Errorf("expected 100 total rows, got %d", jobResp.TotalRows)
	}

	// 2. Execution Lock Test: Duplicate start while running should fail with 409
	_, err = svc.StartMigration(ctx, "user-1", "org-1", "proj-1", startReq)
	if err == nil {
		t.Error("expected error starting duplicate migration on same source/target/table, got nil")
	}

	// 3. Get Migration
	fetched, err := svc.GetMigration(ctx, "user-1", "org-1", "proj-1", jobResp.ID)
	if err != nil {
		t.Fatalf("failed to get migration: %v", err)
	}
	if fetched.ID != jobResp.ID {
		t.Errorf("expected job ID %q, got %q", jobResp.ID, fetched.ID)
	}

	// 4. List Migrations
	list, err := svc.ListMigrations(ctx, "user-1", "org-1", "proj-1")
	if err != nil {
		t.Fatalf("failed to list migrations: %v", err)
	}
	if len(list) != 1 {
		t.Errorf("expected 1 migration in list, got %d", len(list))
	}
}
