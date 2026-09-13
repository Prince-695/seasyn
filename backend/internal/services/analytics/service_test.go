package analytics_test

import (
	"context"
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/services/analytics"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

type mockAnalyticsRepo struct {
	orgOverview  *domain.OrgAnalyticsOverview
	projOverview *domain.ProjectAnalytics
	migOverview  *domain.MigrationAnalytics
}

func (m *mockAnalyticsRepo) GetOrgAnalyticsOverview(ctx context.Context, orgID, userID string) (*domain.OrgAnalyticsOverview, error) {
	return m.orgOverview, nil
}
func (m *mockAnalyticsRepo) GetProjectAnalytics(ctx context.Context, orgID, projectID string) (*domain.ProjectAnalytics, error) {
	return m.projOverview, nil
}
func (m *mockAnalyticsRepo) GetMigrationAnalytics(ctx context.Context, orgID, projectID string) (*domain.MigrationAnalytics, error) {
	return m.migOverview, nil
}

type mockOrgRepo struct {
	members map[string]*domain.OrganizationMember
}

func (m *mockOrgRepo) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepo) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	return &domain.Organization{ID: id}, nil
}
func (m *mockOrgRepo) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	return nil, nil
}
func (m *mockOrgRepo) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	return &org, nil
}
func (m *mockOrgRepo) Delete(ctx context.Context, id string) error { return nil }
func (m *mockOrgRepo) SlugExists(ctx context.Context, slug string) (bool, error) {
	return false, nil
}
func (m *mockOrgRepo) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepo) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	if mem, ok := m.members[orgID+":"+userID]; ok {
		return mem, nil
	}
	return nil, apperrors.Forbidden("not a member")
}
func (m *mockOrgRepo) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	return nil
}
func (m *mockOrgRepo) RemoveMember(ctx context.Context, orgID, userID string) error { return nil }
func (m *mockOrgRepo) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	return nil, nil
}
func (m *mockOrgRepo) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	return nil, nil
}
func (m *mockOrgRepo) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	return 0, nil
}
func (m *mockOrgRepo) CountUserOrgs(ctx context.Context, userID string) (int64, error) {
	return 1, nil
}
func (m *mockOrgRepo) CountOrgMembers(ctx context.Context, orgID string) (int64, error) {
	return 1, nil
}

type mockProjectRepo struct {
	projects map[string]*domain.Project
}

func (m *mockProjectRepo) CreateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	return &p, nil
}
func (m *mockProjectRepo) GetProjectByID(ctx context.Context, id string) (*domain.Project, error) {
	if p, ok := m.projects[id]; ok {
		return p, nil
	}
	return nil, apperrors.NotFound("project not found")
}
func (m *mockProjectRepo) GetProjectBySlug(ctx context.Context, orgID, slug string) (*domain.Project, error) {
	return nil, nil
}
func (m *mockProjectRepo) ListProjectsByOrg(ctx context.Context, orgID string) ([]*domain.Project, error) {
	return nil, nil
}
func (m *mockProjectRepo) UpdateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	return &p, nil
}
func (m *mockProjectRepo) DeleteProject(ctx context.Context, id string) error { return nil }
func (m *mockProjectRepo) ProjectSlugExists(ctx context.Context, orgID, slug string) (bool, error) {
	return false, nil
}
func (m *mockProjectRepo) CountProjectsByOrg(ctx context.Context, orgID string) (int64, error) {
	return 1, nil
}
func (m *mockProjectRepo) CreateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	return &conn, nil
}
func (m *mockProjectRepo) GetConnectionByID(ctx context.Context, id string) (*domain.DatabaseConnection, error) {
	return nil, nil
}
func (m *mockProjectRepo) ListConnectionsByProject(ctx context.Context, projectID string) ([]*domain.DatabaseConnection, error) {
	return nil, nil
}
func (m *mockProjectRepo) UpdateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	return &conn, nil
}
func (m *mockProjectRepo) DeleteConnection(ctx context.Context, id string) error { return nil }
func (m *mockProjectRepo) CountConnectionsByProject(ctx context.Context, projectID string) (int64, error) {
	return 1, nil
}

func TestAnalyticsService(t *testing.T) {
	ctx := context.Background()

	analyticsRepo := &mockAnalyticsRepo{
		orgOverview: &domain.OrgAnalyticsOverview{
			Quotas: domain.OrgQuotasSummary{
				Projects: domain.QuotaUsage{Used: 2, Max: 5, Percentage: 40},
			},
		},
		projOverview: &domain.ProjectAnalytics{
			ConnectionQuota: domain.ProjectConnectionQuota{Used: 3, Max: 6},
		},
		migOverview: &domain.MigrationAnalytics{
			Summary: domain.MigrationIntelligenceSummary{TotalPipelines: 5},
		},
	}

	orgRepo := &mockOrgRepo{
		members: map[string]*domain.OrganizationMember{
			"org-1:usr-valid": {OrganizationID: "org-1", UserID: "usr-valid", Role: domain.OrgRoleAdmin},
		},
	}

	projectRepo := &mockProjectRepo{
		projects: map[string]*domain.Project{
			"proj-1": {ID: "proj-1", OrganizationID: "org-1"},
		},
	}

	svc := analytics.NewAnalyticsService(analyticsRepo, orgRepo, projectRepo)

	// 1. Valid Org Overview
	res, err := svc.GetOrgAnalyticsOverview(ctx, "usr-valid", "org-1")
	if err != nil {
		t.Fatalf("unexpected error on valid org overview: %v", err)
	}
	if res.Quotas.Projects.Used != 2 {
		t.Errorf("expected 2 projects used, got %d", res.Quotas.Projects.Used)
	}

	// 2. Unauthorized Org Overview
	_, err = svc.GetOrgAnalyticsOverview(ctx, "usr-invalid", "org-1")
	if err == nil {
		t.Fatal("expected error for unauthorized user, got nil")
	}

	// 3. Valid Project Analytics
	pRes, err := svc.GetProjectAnalytics(ctx, "usr-valid", "org-1", "proj-1")
	if err != nil {
		t.Fatalf("unexpected error on valid project analytics: %v", err)
	}
	if pRes.ConnectionQuota.Used != 3 {
		t.Errorf("expected 3 connections used, got %d", pRes.ConnectionQuota.Used)
	}

	// 4. Valid Migration Analytics
	mRes, err := svc.GetMigrationAnalytics(ctx, "usr-valid", "org-1", "proj-1")
	if err != nil {
		t.Fatalf("unexpected error on valid migration analytics: %v", err)
	}
	if mRes.Summary.TotalPipelines != 5 {
		t.Errorf("expected 5 pipelines, got %d", mRes.Summary.TotalPipelines)
	}
}
