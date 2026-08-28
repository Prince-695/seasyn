package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// AuditRepository defines persistence operations for audit logs.
type AuditRepository interface {
	Create(ctx context.Context, log domain.AuditLog) error
	List(ctx context.Context, filter domain.AuditLogFilter) (*domain.AuditLogListResponse, error)
}

// AuditService defines business logic for recording and querying audit logs.
type AuditService interface {
	Log(ctx context.Context, log domain.AuditLog)
	ListLogs(ctx context.Context, userID, orgID string, filter domain.AuditLogFilter) (*domain.AuditLogListResponse, error)
}
