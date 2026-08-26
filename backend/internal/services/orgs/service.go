package orgs

import (
	"context"
	"regexp"
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/pkg/errors"
)

type orgService struct {
	repo     ports.OrgRepository
	userRepo ports.UserRepository
}

func NewOrgService(repo ports.OrgRepository, userRepo ports.UserRepository) ports.OrgService {
	return &orgService{repo: repo, userRepo: userRepo}
}

// slugify converts a name to a URL-safe slug. e.g. "Acme Corp" → "acme-corp"
func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = regexp.MustCompile(`[^a-z0-9\-]+`).ReplaceAllString(s, "-")
	s = regexp.MustCompile(`-+`).ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func isValidSlug(s string) bool {
	matched, _ := regexp.MatchString(`^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$`, s)
	return matched
}

func (s *orgService) CreateOrg(ctx context.Context, userID string, req domain.CreateOrgRequest) (*domain.Organization, error) {
	// Use provided slug or auto-generate from name
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Name)
	} else {
		slug = slugify(slug)
	}

	if !isValidSlug(slug) {
		return nil, errors.BadRequest("Slug must be 3-50 lowercase alphanumeric characters or hyphens")
	}

	exists, err := s.repo.SlugExists(ctx, slug)
	if err != nil {
		return nil, errors.Internal("Failed to check slug availability")
	}
	if exists {
		return nil, errors.BadRequest("An organization with this slug already exists")
	}

	org := domain.Organization{
		Name:        strings.TrimSpace(req.Name),
		Slug:        slug,
		Description: strings.TrimSpace(req.Description),
		OwnerID:     userID,
	}

	created, err := s.repo.Create(ctx, org)
	if err != nil {
		return nil, errors.Internal("Failed to create organization")
	}

	// Auto-add the creator as owner
	if err := s.repo.AddMember(ctx, created.ID, userID, "", domain.OrgRoleOwner); err != nil {
		return nil, errors.Internal("Failed to set organization owner")
	}

	return created, nil
}

func (s *orgService) GetOrg(ctx context.Context, userID, orgID string) (*domain.Organization, error) {
	// Verify user is a member
	if _, err := s.repo.GetMember(ctx, orgID, userID); err != nil {
		return nil, errors.Forbidden("You are not a member of this organization")
	}
	return s.repo.GetByID(ctx, orgID)
}

func (s *orgService) UpdateOrg(ctx context.Context, userID, orgID string, req domain.UpdateOrgRequest) (*domain.Organization, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return nil, err
	}

	org, err := s.repo.GetByID(ctx, orgID)
	if err != nil {
		return nil, err
	}

	org.Name = strings.TrimSpace(req.Name)
	org.Description = strings.TrimSpace(req.Description)
	return s.repo.Update(ctx, *org)
}

func (s *orgService) DeleteOrg(ctx context.Context, userID, orgID string) error {
	if err := s.requireOwner(ctx, orgID, userID); err != nil {
		return err
	}
	return s.repo.Delete(ctx, orgID)
}

func (s *orgService) ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error) {
	return s.repo.ListUserOrgs(ctx, userID)
}

func (s *orgService) InviteMember(ctx context.Context, userID, orgID string, req domain.InviteMemberRequest) error {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return err
	}

	// Verify target user exists
	targetUser, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return errors.NotFound("No user found with that email address")
	}

	// Check not already a member
	if _, err := s.repo.GetMember(ctx, orgID, targetUser.ID); err == nil {
		return errors.BadRequest("User is already a member of this organization")
	}

	return s.repo.AddMember(ctx, orgID, targetUser.ID, userID, req.Role)
}

func (s *orgService) UpdateMemberRole(ctx context.Context, userID, orgID, targetUserID string, req domain.UpdateMemberRoleRequest) error {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return err
	}

	// Cannot change owner's role via this endpoint
	target, err := s.repo.GetMember(ctx, orgID, targetUserID)
	if err != nil {
		return errors.NotFound("Member not found")
	}
	if target.Role == domain.OrgRoleOwner {
		return errors.Forbidden("Cannot change the owner's role")
	}
	// Cannot set someone to owner via this endpoint
	if req.Role == domain.OrgRoleOwner {
		return errors.BadRequest("Use the transfer ownership endpoint to change the owner")
	}

	return s.repo.UpdateMemberRole(ctx, orgID, targetUserID, req.Role)
}

func (s *orgService) RemoveMember(ctx context.Context, userID, orgID, targetUserID string) error {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return err
	}

	target, err := s.repo.GetMember(ctx, orgID, targetUserID)
	if err != nil {
		return errors.NotFound("Member not found")
	}
	if target.Role == domain.OrgRoleOwner {
		return errors.Forbidden("Cannot remove the owner from the organization")
	}

	return s.repo.RemoveMember(ctx, orgID, targetUserID)
}

func (s *orgService) ListMembers(ctx context.Context, userID, orgID string) ([]*domain.OrgMemberDetail, error) {
	if _, err := s.repo.GetMember(ctx, orgID, userID); err != nil {
		return nil, errors.Forbidden("You are not a member of this organization")
	}
	return s.repo.ListMembers(ctx, orgID)
}

func (s *orgService) GetMemberRole(ctx context.Context, userID, orgID string) (domain.OrgRole, error) {
	m, err := s.repo.GetMember(ctx, orgID, userID)
	if err != nil {
		return "", errors.Forbidden("You are not a member of this organization")
	}
	return m.Role, nil
}

// requireRole checks that the requesting user has at least the given role.
// Role hierarchy: owner > admin > member > viewer.
func (s *orgService) requireRole(ctx context.Context, orgID, userID string, minRole domain.OrgRole) error {
	member, err := s.repo.GetMember(ctx, orgID, userID)
	if err != nil {
		return errors.Forbidden("You are not a member of this organization")
	}
	if !hasPermission(member.Role, minRole) {
		return errors.Forbidden("You do not have permission to perform this action")
	}
	return nil
}

func (s *orgService) requireOwner(ctx context.Context, orgID, userID string) error {
	return s.requireRole(ctx, orgID, userID, domain.OrgRoleOwner)
}

// hasPermission returns true if actualRole >= requiredRole in the hierarchy.
func hasPermission(actual, required domain.OrgRole) bool {
	order := map[domain.OrgRole]int{
		domain.OrgRoleViewer: 0,
		domain.OrgRoleMember: 1,
		domain.OrgRoleAdmin:  2,
		domain.OrgRoleOwner:  3,
	}
	return order[actual] >= order[required]
}
