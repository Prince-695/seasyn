package domain

import "time"

// AuditAction defines standard audit event types across the system.
type AuditAction string

const (
	AuditActionOrgCreated          AuditAction = "org.created"
	AuditActionOrgUpdated          AuditAction = "org.updated"
	AuditActionOrgMemberInvited    AuditAction = "org.member.invited"
	AuditActionOrgMemberRoleUpdate AuditAction = "org.member.role_updated"
	AuditActionOrgMemberRemoved    AuditAction = "org.member.removed"

	AuditActionProjectCreated AuditAction = "project.created"
	AuditActionProjectUpdated AuditAction = "project.updated"
	AuditActionProjectDeleted AuditAction = "project.deleted"

	AuditActionConnectionCreated AuditAction = "connection.created"
	AuditActionConnectionUpdated AuditAction = "connection.updated"
	AuditActionConnectionDeleted AuditAction = "connection.deleted"

	AuditActionMigrationStarted   AuditAction = "migration.started"
	AuditActionMigrationCompleted AuditAction = "migration.completed"
	AuditActionMigrationFailed    AuditAction = "migration.failed"
	AuditActionMigrationCancelled AuditAction = "migration.cancelled"

	AuditActionTableRowInserted AuditAction = "table.row.inserted"
	AuditActionTableRowUpdated  AuditAction = "table.row.updated"
	AuditActionTableRowDeleted  AuditAction = "table.row.deleted"

	AuditActionWebhookCreated AuditAction = "webhook.created"
	AuditActionWebhookUpdated AuditAction = "webhook.updated"
	AuditActionWebhookDeleted AuditAction = "webhook.deleted"
)

// AuditLog represents an immutable record of a user action.
type AuditLog struct {
	ID           string                 `json:"id"`
	OrgID        string                 `json:"org_id"`
	ProjectID    *string                `json:"project_id,omitempty"`
	UserID       string                 `json:"user_id"`
	UserEmail    string                 `json:"user_email,omitempty"`
	Action       AuditAction            `json:"action"`
	ResourceType string                 `json:"resource_type"` // "project", "connection", "migration", "org", "table"
	ResourceID   string                 `json:"resource_id"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	IPAddress    string                 `json:"ip_address,omitempty"`
	UserAgent    string                 `json:"user_agent,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
}

// AuditLogFilter defines search and pagination parameters for audit logs.
type AuditLogFilter struct {
	OrgID     string      `json:"org_id"`
	ProjectID string      `json:"project_id,omitempty"`
	UserID    string      `json:"user_id,omitempty"`
	Action    AuditAction `json:"action,omitempty"`
	Page      int         `json:"page"`
	Limit     int         `json:"limit"`
}

// AuditLogListResponse is the paginated response for audit logs.
type AuditLogListResponse struct {
	Logs       []AuditLog `json:"logs"`
	TotalCount int64      `json:"total_count"`
	Page       int        `json:"page"`
	Limit      int        `json:"limit"`
	TotalPages int        `json:"total_pages"`
}
