package audit_test

import (
	"context"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/services/audit"
)

type mockAuditRepo struct {
	logs []domain.AuditLog
}

func (m *mockAuditRepo) Create(ctx context.Context, log domain.AuditLog) error {
	m.logs = append(m.logs, log)
	return nil
}

func (m *mockAuditRepo) List(ctx context.Context, filter domain.AuditLogFilter) (*domain.AuditLogListResponse, error) {
	var filtered []domain.AuditLog
	for _, l := range m.logs {
		if l.OrgID == filter.OrgID {
			filtered = append(filtered, l)
		}
	}
	return &domain.AuditLogListResponse{
		Logs:       filtered,
		TotalCount: int64(len(filtered)),
		Page:       1,
		Limit:      50,
		TotalPages: 1,
	}, nil
}

type mockOrgRepoForAudit struct {
	role domain.OrgRole
}

func (m *mockOrgRepoForAudit) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForAudit) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForAudit) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepoForAudit) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepoForAudit) Delete(ctx context.Context, id string) error { return nil }
func (m *mockOrgRepoForAudit) SlugExists(ctx context.Context, slug string) (bool, error) {
	return false, nil
}
func (m *mockOrgRepoForAudit) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForAudit) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	return &domain.OrganizationMember{
		OrganizationID: orgID,
		UserID:         userID,
		Role:           m.role,
	}, nil
}
func (m *mockOrgRepoForAudit) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepoForAudit) RemoveMember(ctx context.Context, orgID, userID string) error {
	return nil
}
func (m *mockOrgRepoForAudit) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	return nil, nil
}
func (m *mockOrgRepoForAudit) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	return nil, nil
}
func (m *mockOrgRepoForAudit) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	return 0, nil
}

func TestAuditService_LogAndList(t *testing.T) {
	auditRepo := &mockAuditRepo{}
	orgRepo := &mockOrgRepoForAudit{role: domain.OrgRoleAdmin}
	svc := audit.NewAuditService(auditRepo, orgRepo)
	ctx := context.Background()

	// 1. Log an event
	svc.Log(ctx, domain.AuditLog{
		OrgID:        "org-1",
		UserID:       "user-1",
		Action:       domain.AuditActionProjectCreated,
		ResourceType: "project",
		ResourceID:   "proj-123",
	})

	// Wait briefly for asynchronous goroutine
	time.Sleep(50 * time.Millisecond)

	// 2. Query logs as Admin
	res, err := svc.ListLogs(ctx, "user-1", "org-1", domain.AuditLogFilter{})
	if err != nil {
		t.Fatalf("failed to list logs: %v", err)
	}
	if len(res.Logs) != 1 {
		t.Errorf("expected 1 log, got %d", len(res.Logs))
	}

	// 3. Query logs as Viewer (should fail RBAC)
	viewerOrgRepo := &mockOrgRepoForAudit{role: domain.OrgRoleViewer}
	viewerSvc := audit.NewAuditService(auditRepo, viewerOrgRepo)

	_, err = viewerSvc.ListLogs(ctx, "viewer-1", "org-1", domain.AuditLogFilter{})
	if err == nil {
		t.Error("expected RBAC forbidden error for viewer listing audit logs, got nil")
	}
}
