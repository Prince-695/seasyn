package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// OrgRepository defines database operations for organizations.
type OrgRepository interface {
	// Org CRUD
	Create(ctx context.Context, org domain.Organization) (*domain.Organization, error)
	GetByID(ctx context.Context, id string) (*domain.Organization, error)
	GetBySlug(ctx context.Context, slug string) (*domain.Organization, error)
	Update(ctx context.Context, org domain.Organization) (*domain.Organization, error)
	Delete(ctx context.Context, id string) error
	SlugExists(ctx context.Context, slug string) (bool, error)

	// Membership
	AddMember(ctx context.Context, orgID, userID, invitedBy string, role domain.OrgRole) error
	GetMember(ctx context.Context, orgID, userID string) (*domain.OrganizationMember, error)
	UpdateMemberRole(ctx context.Context, orgID, userID string, role domain.OrgRole) error
	RemoveMember(ctx context.Context, orgID, userID string) error
	ListMembers(ctx context.Context, orgID string) ([]*domain.OrgMemberDetail, error)
	ListUserOrgs(ctx context.Context, userID string) ([]*domain.OrgWithRole, error)
	CountOwnerOrgs(ctx context.Context, userID string) (int64, error)
}
