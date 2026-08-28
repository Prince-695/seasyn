package domain

import "time"

// --- Migration Status ---

// MigrationStatus represents the lifecycle state of a migration job.
type MigrationStatus string

const (
	MigrationStatusPending   MigrationStatus = "pending"
	MigrationStatusRunning   MigrationStatus = "running"
	MigrationStatusCompleted MigrationStatus = "completed"
	MigrationStatusFailed    MigrationStatus = "failed"
	MigrationStatusCancelled MigrationStatus = "cancelled"
)

// --- Migration Job ---

// MigrationJob describes one database transfer request.
type MigrationJob struct {
	ID             string          `json:"id"`
	OrganizationID string          `json:"organization_id"`
	ProjectID      string          `json:"project_id"`
	SourceConnID   string          `json:"source_connection_id"`
	TargetConnID   string          `json:"target_connection_id"`
	SourceTable    string          `json:"source_table"`
	TargetTable    string          `json:"target_table"`
	Status         MigrationStatus `json:"status"`
	TotalRows      int64           `json:"total_rows"`
	MigratedRows   int64           `json:"migrated_rows"`
	BatchSize      int             `json:"batch_size"`
	ErrorMessage   string          `json:"error_message,omitempty"`
	CreatedBy      string          `json:"created_by"`
	StartedAt      *time.Time      `json:"started_at,omitempty"`
	CompletedAt    *time.Time      `json:"completed_at,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

// --- Migration Progress (SSE Event Payload) ---

// MigrationProgress is sent to SSE clients during a running migration.
type MigrationProgress struct {
	JobID        string          `json:"job_id"`
	State        MigrationStatus `json:"state"`
	MigratedRows int64           `json:"migrated_rows"`
	TotalRows    int64           `json:"total_rows"`
	Percentage   float64         `json:"percentage"`
	Message      string          `json:"message,omitempty"`
	Timestamp    time.Time       `json:"timestamp"`
}

// --- Row Batch (channel streaming) ---

// RowBatch is a chunk of rows read from the source database during streaming.
type RowBatch struct {
	Index  int                      `json:"index"`
	Rows   []map[string]interface{} `json:"rows"`
	IsLast bool                     `json:"is_last"`
}

// --- Migration Request / Response DTOs ---

// StartMigrationRequest is the API request to begin a new migration job.
type StartMigrationRequest struct {
	SourceConnectionID string `json:"source_connection_id" validate:"required,uuid" example:"11111111-1111-1111-1111-111111111111"`
	TargetConnectionID string `json:"target_connection_id" validate:"required,uuid" example:"22222222-2222-2222-2222-222222222222"`
	SourceTable        string `json:"source_table" validate:"required,min=1,max=128" example:"users"`
	TargetTable        string `json:"target_table" validate:"required,min=1,max=128" example:"users"`
	BatchSize          int    `json:"batch_size" validate:"omitempty,min=10,max=10000" example:"500"`
}

// MigrationJobResponse is the public-safe representation of a migration job.
type MigrationJobResponse struct {
	ID             string          `json:"id"`
	OrganizationID string          `json:"organization_id"`
	ProjectID      string          `json:"project_id"`
	SourceConnID   string          `json:"source_connection_id"`
	TargetConnID   string          `json:"target_connection_id"`
	SourceTable    string          `json:"source_table"`
	TargetTable    string          `json:"target_table"`
	Status         MigrationStatus `json:"status"`
	TotalRows      int64           `json:"total_rows"`
	MigratedRows   int64           `json:"migrated_rows"`
	BatchSize      int             `json:"batch_size"`
	ErrorMessage   string          `json:"error_message,omitempty"`
	Percentage     float64         `json:"percentage"`
	StartedAt      *time.Time      `json:"started_at,omitempty"`
	CompletedAt    *time.Time      `json:"completed_at,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
}

// ToResponse converts a MigrationJob to a public-safe response DTO.
func (j *MigrationJob) ToResponse() MigrationJobResponse {
	var pct float64
	if j.TotalRows > 0 {
		pct = float64(j.MigratedRows) / float64(j.TotalRows) * 100
	}
	return MigrationJobResponse{
		ID:             j.ID,
		OrganizationID: j.OrganizationID,
		ProjectID:      j.ProjectID,
		SourceConnID:   j.SourceConnID,
		TargetConnID:   j.TargetConnID,
		SourceTable:    j.SourceTable,
		TargetTable:    j.TargetTable,
		Status:         j.Status,
		TotalRows:      j.TotalRows,
		MigratedRows:   j.MigratedRows,
		BatchSize:      j.BatchSize,
		ErrorMessage:   j.ErrorMessage,
		Percentage:     pct,
		StartedAt:      j.StartedAt,
		CompletedAt:    j.CompletedAt,
		CreatedAt:      j.CreatedAt,
	}
}
