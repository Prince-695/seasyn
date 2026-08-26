package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// OrgService defines all business logic for organization management.
type OrgService interface {
	CreateOrg(ctx context.Context, userID string, req domain.CreateOrgRequest) (*domain.Organization, error)
	GetOrg(ctx context.Context, userID, orgID string) (*domain.Organization, error)
	UpdateOrg(ctx context.Context, userID, orgID string, req domain.UpdateOrgRequest) (*domain.Organization, error)
	DeleteOrg(ctx context.Context, userID, orgID string) error
	ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error)

	InviteMember(ctx context.Context, userID, orgID string, req domain.InviteMemberRequest) error
	UpdateMemberRole(ctx context.Context, userID, orgID, targetUserID string, req domain.UpdateMemberRoleRequest) error
	RemoveMember(ctx context.Context, userID, orgID, targetUserID string) error
	ListMembers(ctx context.Context, userID, orgID string) ([]*domain.OrgMemberDetail, error)

	// GetMemberRole returns the role of a user within an organization, or error if not a member.
	GetMemberRole(ctx context.Context, userID, orgID string) (domain.OrgRole, error)
}
