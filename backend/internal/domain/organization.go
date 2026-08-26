package domain

import "time"

// OrgRole defines a member's permission level within an organization.
type OrgRole string

const (
	OrgRoleOwner  OrgRole = "owner"
	OrgRoleAdmin  OrgRole = "admin"
	OrgRoleMember OrgRole = "member"
	OrgRoleViewer OrgRole = "viewer"
)

// Organization is a workspace that groups users and projects.
type Organization struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description string    `json:"description,omitempty"`
	OwnerID     string    `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// OrganizationMember links a user to an organization with a role.
type OrganizationMember struct {
	OrganizationID string    `json:"organization_id"`
	UserID         string    `json:"user_id"`
	Role           OrgRole   `json:"role"`
	InvitedBy      string    `json:"invited_by,omitempty"`
	JoinedAt       time.Time `json:"joined_at"`
}

// OrgWithRole extends Organization with the current user's role (for list responses).
type OrgWithRole struct {
	Organization
	Role OrgRole `json:"role"`
}

// OrgMemberDetail is a DTO for member list responses.
type OrgMemberDetail struct {
	UserID    string    `json:"user_id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Username  string    `json:"username,omitempty"`
	Role      OrgRole   `json:"role"`
	JoinedAt  time.Time `json:"joined_at"`
}

// --- Request DTOs ---

type CreateOrgRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100" minLength:"2" maxLength:"100" example:"Acme Corp"`
	Slug        string `json:"slug" validate:"required,min=2,max=50" minLength:"2" maxLength:"50" example:"acme-corp"`
	Description string `json:"description" validate:"max=500" maxLength:"500" example:"Building the future"`
}

type UpdateOrgRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100" minLength:"2" maxLength:"100" example:"Acme Corp"`
	Description string `json:"description" validate:"max=500" maxLength:"500" example:"Building the future"`
}

type InviteMemberRequest struct {
	Email string  `json:"email" validate:"required,email" example:"dev@example.com"`
	Role  OrgRole `json:"role" validate:"required,oneof=admin member viewer" example:"member"`
}

type UpdateMemberRoleRequest struct {
	Role OrgRole `json:"role" validate:"required,oneof=admin member viewer" example:"admin"`
}
