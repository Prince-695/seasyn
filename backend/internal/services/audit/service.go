package audit

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

type auditService struct {
	auditRepo ports.AuditRepository
	orgRepo   ports.OrgRepository
}

// NewAuditService creates a new AuditService.
func NewAuditService(
	auditRepo ports.AuditRepository,
	orgRepo ports.OrgRepository,
) ports.AuditService {
	return &auditService{
		auditRepo: auditRepo,
		orgRepo:   orgRepo,
	}
}

func (s *auditService) requireRole(ctx context.Context, orgID, userID string, minRole domain.OrgRole) error {
	member, err := s.orgRepo.GetMember(ctx, orgID, userID)
	if err != nil {
		return apperrors.Forbidden("You are not a member of this organization")
	}
	order := map[domain.OrgRole]int{
		domain.OrgRoleViewer: 0,
		domain.OrgRoleMember: 1,
		domain.OrgRoleAdmin:  2,
		domain.OrgRoleOwner:  3,
	}
	if order[member.Role] < order[minRole] {
		return apperrors.Forbidden("You do not have permission to perform this action")
	}
	return nil
}

// Log records an audit entry asynchronously to avoid blocking the calling request.
func (s *auditService) Log(ctx context.Context, log domain.AuditLog) {
	go func(entry domain.AuditLog) {
		_ = s.auditRepo.Create(context.Background(), entry)
	}(log)
}

// ListLogs returns paginated audit records for an organization with optional filters.
func (s *auditService) ListLogs(ctx context.Context, userID, orgID string, filter domain.AuditLogFilter) (*domain.AuditLogListResponse, error) {
	// Only admins and owners can view audit logs
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return nil, err
	}

	filter.OrgID = orgID
	return s.auditRepo.List(ctx, filter)
}
