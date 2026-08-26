package orgs_test

import (
	"context"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/services/orgs"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// MockOrgRepo implements ports.OrgRepository in-memory for unit testing
type mockOrgRepo struct {
	orgs    map[string]*domain.Organization
	members map[string]map[string]*domain.OrganizationMember // orgID -> userID -> member
}

func newMockOrgRepo() *mockOrgRepo {
	return &mockOrgRepo{
		orgs:    make(map[string]*domain.Organization),
		members: make(map[string]map[string]*domain.OrganizationMember),
	}
}

func (m *mockOrgRepo) Create(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	org.ID = "org-" + org.Slug
	org.CreatedAt = time.Now()
	org.UpdatedAt = time.Now()
	m.orgs[org.ID] = &org
	return &org, nil
}

func (m *mockOrgRepo) GetByID(ctx context.Context, id string) (*domain.Organization, error) {
	org, ok := m.orgs[id]
	if !ok {
		return nil, apperrors.NotFound("organization")
	}
	return org, nil
}

func (m *mockOrgRepo) GetBySlug(ctx context.Context, slug string) (*domain.Organization, error) {
	for _, org := range m.orgs {
		if org.Slug == slug {
			return org, nil
		}
	}
	return nil, apperrors.NotFound("organization")
}

func (m *mockOrgRepo) Update(ctx context.Context, org domain.Organization) (*domain.Organization, error) {
	existing, ok := m.orgs[org.ID]
	if !ok {
		return nil, apperrors.NotFound("organization")
	}
	existing.Name = org.Name
	existing.Description = org.Description
	existing.UpdatedAt = time.Now()
	return existing, nil
}

func (m *mockOrgRepo) Delete(ctx context.Context, id string) error {
	delete(m.orgs, id)
	delete(m.members, id)
	return nil
}

func (m *mockOrgRepo) SlugExists(ctx context.Context, slug string) (bool, error) {
	for _, org := range m.orgs {
		if org.Slug == slug {
			return true, nil
		}
	}
	return false, nil
}

func (m *mockOrgRepo) AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error {
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

func (m *mockOrgRepo) GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error) {
	if orgMembers, ok := m.members[orgID]; ok {
		if member, ok := orgMembers[userID]; ok {
			return member, nil
		}
	}
	return nil, apperrors.NotFound("member")
}

func (m *mockOrgRepo) UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error {
	if orgMembers, ok := m.members[orgID]; ok {
		if member, ok := orgMembers[userID]; ok {
			member.Role = role
			return nil
		}
	}
	return apperrors.NotFound("member")
}

func (m *mockOrgRepo) RemoveMember(ctx context.Context, orgID, userID string) error {
	if orgMembers, ok := m.members[orgID]; ok {
		delete(orgMembers, userID)
	}
	return nil
}

func (m *mockOrgRepo) ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error) {
	var list []*domain.OrgMemberDetail
	if orgMembers, ok := m.members[orgID]; ok {
		for _, mem := range orgMembers {
			list = append(list, &domain.OrgMemberDetail{
				UserID: mem.UserID,
				Role:   mem.Role,
			})
		}
	}
	return list, nil
}

func (m *mockOrgRepo) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	var list []*domain.OrgWithRole
	for orgID, orgMembers := range m.members {
		if mem, ok := orgMembers[userID]; ok {
			if org, ok := m.orgs[orgID]; ok {
				list = append(list, &domain.OrgWithRole{
					Organization: *org,
					Role:         mem.Role,
				})
			}
		}
	}
	return list, nil
}

func (m *mockOrgRepo) CountOwnerOrgs(ctx context.Context, userID string) (int64, error) {
	var count int64
	for _, org := range m.orgs {
		if org.OwnerID == userID {
			count++
		}
	}
	return count, nil
}

// MockUserRepo implements ports.UserRepository
type mockUserRepo struct {
	users map[string]*domain.User
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users: make(map[string]*domain.User),
	}
}

func (m *mockUserRepo) Create(ctx context.Context, u domain.User) (*domain.User, error) {
	m.users[u.ID] = &u
	return &u, nil
}

func (m *mockUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, apperrors.NotFound("user")
}

func (m *mockUserRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	u, ok := m.users[id]
	if !ok {
		return nil, apperrors.NotFound("user")
	}
	return u, nil
}

func (m *mockUserRepo) Update(ctx context.Context, u domain.User) (*domain.User, error) {
	m.users[u.ID] = &u
	return &u, nil
}

func (m *mockUserRepo) UpdatePassword(ctx context.Context, email, hashedPassword string) error {
	return nil
}

func (m *mockUserRepo) CheckUsername(ctx context.Context, username string) (bool, error) {
	for _, u := range m.users {
		if u.Username == username {
			return true, nil
		}
	}
	return false, nil
}

// --- QA Test Suites ---

func TestCreateOrg(t *testing.T) {
	orgRepo := newMockOrgRepo()
	userRepo := newMockUserRepo()
	service := orgs.NewOrgService(orgRepo, userRepo)
	ctx := context.Background()

	// 1. Successful creation with auto-generated slug
	org, err := service.CreateOrg(ctx, "user-1", domain.CreateOrgRequest{
		Name:        "Acme Corporation",
		Description: "Cloud database migrations",
	})
	if err != nil {
		t.Fatalf("unexpected error creating org: %v", err)
	}
	if org.Slug != "acme-corporation" {
		t.Errorf("expected slug 'acme-corporation', got '%s'", org.Slug)
	}
	if org.OwnerID != "user-1" {
		t.Errorf("expected owner 'user-1', got '%s'", org.OwnerID)
	}

	// Verify creator became owner
	role, err := service.GetMemberRole(ctx, "user-1", org.ID)
	if err != nil || role != domain.OrgRoleOwner {
		t.Errorf("expected creator to be owner, got role '%s', err: %v", role, err)
	}

	// 2. Duplicate slug rejection
	_, err = service.CreateOrg(ctx, "user-2", domain.CreateOrgRequest{
		Name: "Acme Corporation",
		Slug: "acme-corporation",
	})
	if err == nil {
		t.Fatal("expected error on duplicate slug, got nil")
	}
}

func TestOrgRBACAndMembership(t *testing.T) {
	orgRepo := newMockOrgRepo()
	userRepo := newMockUserRepo()
	service := orgs.NewOrgService(orgRepo, userRepo)
	ctx := context.Background()

	// Register sample users
	userRepo.users["user-owner"] = &domain.User{ID: "user-owner", Email: "owner@seasyn.io"}
	userRepo.users["user-admin"] = &domain.User{ID: "user-admin", Email: "admin@seasyn.io"}
	userRepo.users["user-member"] = &domain.User{ID: "user-member", Email: "member@seasyn.io"}
	userRepo.users["user-outsider"] = &domain.User{ID: "user-outsider", Email: "outsider@seasyn.io"}

	// Create org as Owner
	org, err := service.CreateOrg(ctx, "user-owner", domain.CreateOrgRequest{
		Name: "DataOps Team",
		Slug: "dataops-team",
	})
	if err != nil {
		t.Fatalf("failed to create org: %v", err)
	}

	// 1. Owner invites Admin
	err = service.InviteMember(ctx, "user-owner", org.ID, domain.InviteMemberRequest{
		Email: "admin@seasyn.io",
		Role:  domain.OrgRoleAdmin,
	})
	if err != nil {
		t.Fatalf("owner failed to invite admin: %v", err)
	}

	// 2. Admin invites Member
	err = service.InviteMember(ctx, "user-admin", org.ID, domain.InviteMemberRequest{
		Email: "member@seasyn.io",
		Role:  domain.OrgRoleMember,
	})
	if err != nil {
		t.Fatalf("admin failed to invite member: %v", err)
	}

	// 3. Member attempts to invite (Should Fail - Member lacks invite permission)
	err = service.InviteMember(ctx, "user-member", org.ID, domain.InviteMemberRequest{
		Email: "outsider@seasyn.io",
		Role:  domain.OrgRoleMember,
	})
	if err == nil {
		t.Fatal("expected member invite to fail with forbidden, but it succeeded")
	}

	// 4. Outsider attempts to read org (Should Fail)
	_, err = service.GetOrg(ctx, "user-outsider", org.ID)
	if err == nil {
		t.Fatal("expected outsider access to be forbidden, but it succeeded")
	}

	// 5. Admin tries to change Owner's role (Should Fail - Owner is protected)
	err = service.UpdateMemberRole(ctx, "user-admin", org.ID, "user-owner", domain.UpdateMemberRoleRequest{
		Role: domain.OrgRoleMember,
	})
	if err == nil {
		t.Fatal("expected demoting owner to fail, but it succeeded")
	}

	// 6. Admin updates Member role to Viewer
	err = service.UpdateMemberRole(ctx, "user-admin", org.ID, "user-member", domain.UpdateMemberRoleRequest{
		Role: domain.OrgRoleViewer,
	})
	if err != nil {
		t.Fatalf("failed to update member role: %v", err)
	}

	role, _ := service.GetMemberRole(ctx, "user-member", org.ID)
	if role != domain.OrgRoleViewer {
		t.Errorf("expected role viewer, got %s", role)
	}

	// 7. Non-owner tries to delete org (Should Fail)
	err = service.DeleteOrg(ctx, "user-admin", org.ID)
	if err == nil {
		t.Fatal("expected admin delete org to fail, but it succeeded")
	}

	// 8. Owner deletes org (Should Succeed)
	err = service.DeleteOrg(ctx, "user-owner", org.ID)
	if err != nil {
		t.Fatalf("owner failed to delete org: %v", err)
	}
}
