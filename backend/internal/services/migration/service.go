package migration

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

// Service orchestrates the full migration lifecycle: start, cancel, get, and list.
type Service struct {
	migrationRepo ports.MigrationRepository
	orgRepo       ports.OrgRepository
	projectRepo   ports.ProjectRepository
	streamer      *Streamer
	hub           *ProgressHub

	// Execution lock: prevents duplicate concurrent migrations on the same source+target+table
	runningJobs sync.Map // key: "sourceConnID:targetConnID:table" -> context.CancelFunc

	// Cancel functions for running migrations, keyed by migration job ID
	cancelFuncs sync.Map // key: jobID -> context.CancelFunc
}

// NewService creates a new MigrationService.
func NewService(
	migrationRepo ports.MigrationRepository,
	orgRepo ports.OrgRepository,
	projectRepo ports.ProjectRepository,
	streamer *Streamer,
	hub *ProgressHub,
) ports.MigrationService {
	return &Service{
		migrationRepo: migrationRepo,
		orgRepo:       orgRepo,
		projectRepo:   projectRepo,
		streamer:      streamer,
		hub:           hub,
	}
}

// requireRole checks that the user has at least minRole in the organization
func (s *Service) requireRole(ctx context.Context, orgID, userID string, minRole domain.OrgRole) error {
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

func (s *Service) executionLockKey(srcConnID, dstConnID, table string) string {
	return fmt.Sprintf("%s:%s:%s", srcConnID, dstConnID, table)
}

// StartMigration creates a migration job, launches the streamer in a background goroutine, and returns immediately.
func (s *Service) StartMigration(ctx context.Context, userID, orgID, projectID string, req domain.StartMigrationRequest) (*domain.MigrationJobResponse, error) {
	// RBAC: require admin or higher to start migrations
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return nil, err
	}

	// Verify project belongs to org
	proj, err := s.projectRepo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if proj.OrganizationID != orgID {
		return nil, apperrors.Forbidden("Project does not belong to this organization")
	}

	// Verify connections belong to project
	srcConn, err := s.projectRepo.GetConnectionByID(ctx, req.SourceConnectionID)
	if err != nil {
		return nil, apperrors.NotFound("source connection not found")
	}
	if srcConn.ProjectID != projectID {
		return nil, apperrors.Forbidden("Source connection does not belong to this project")
	}

	dstConn, err := s.projectRepo.GetConnectionByID(ctx, req.TargetConnectionID)
	if err != nil {
		return nil, apperrors.NotFound("target connection not found")
	}
	if dstConn.ProjectID != projectID {
		return nil, apperrors.Forbidden("Target connection does not belong to this project")
	}

	// Execution lock: prevent duplicate concurrent migrations
	lockKey := s.executionLockKey(req.SourceConnectionID, req.TargetConnectionID, req.SourceTable)
	if _, loaded := s.runningJobs.LoadOrStore(lockKey, true); loaded {
		return nil, apperrors.New(409, "MIGRATION_ALREADY_RUNNING", "A migration is already running for this source, target, and table combination")
	}

	batchSize := req.BatchSize
	if batchSize < 10 {
		batchSize = 500
	}

	// Create job record
	job := domain.MigrationJob{
		OrganizationID: orgID,
		ProjectID:      projectID,
		SourceConnID:   req.SourceConnectionID,
		TargetConnID:   req.TargetConnectionID,
		SourceTable:    req.SourceTable,
		TargetTable:    req.TargetTable,
		BatchSize:      batchSize,
		CreatedBy:      userID,
	}

	created, err := s.migrationRepo.Create(ctx, job)
	if err != nil {
		s.runningJobs.Delete(lockKey)
		return nil, err
	}

	// Count source rows (for progress percentage)
	totalRows, err := s.streamer.CountSourceRows(ctx, *created)
	if err != nil {
		s.runningJobs.Delete(lockKey)
		return nil, fmt.Errorf("count source rows: %w", err)
	}
	created.TotalRows = totalRows

	// Launch migration in background goroutine
	bgCtx, cancel := context.WithCancel(context.Background())
	s.cancelFuncs.Store(created.ID, cancel)

	go func() {
		defer s.runningJobs.Delete(lockKey)
		defer s.cancelFuncs.Delete(created.ID)
		defer s.hub.Close(created.ID)

		// Mark as running
		_ = s.migrationRepo.UpdateStatus(bgCtx, created.ID, domain.MigrationStatusRunning, 0, totalRows, "")

		// Broadcast start event
		s.hub.Broadcast(created.ID, domain.MigrationProgress{
			JobID:        created.ID,
			State:        domain.MigrationStatusRunning,
			MigratedRows: 0,
			TotalRows:    totalRows,
			Percentage:   0,
			Message:      "Migration started",
			Timestamp:    time.Now(),
		})

		// Run the streamer (blocks until complete, error, or cancel)
		streamErr := s.streamer.Stream(bgCtx, *created)

		if streamErr != nil {
			if bgCtx.Err() == context.Canceled {
				_ = s.migrationRepo.UpdateStatus(bgCtx, created.ID, domain.MigrationStatusCancelled, 0, totalRows, "Migration was cancelled by user")
			} else {
				_ = s.migrationRepo.UpdateStatus(bgCtx, created.ID, domain.MigrationStatusFailed, 0, totalRows, streamErr.Error())
			}
			return
		}

		_ = s.migrationRepo.UpdateStatus(bgCtx, created.ID, domain.MigrationStatusCompleted, totalRows, totalRows, "")
	}()

	resp := created.ToResponse()
	return &resp, nil
}

// CancelMigration cancels a running migration by calling its stored CancelFunc.
func (s *Service) CancelMigration(ctx context.Context, userID, orgID, projectID, migrationID string) error {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return err
	}

	job, err := s.migrationRepo.GetByID(ctx, migrationID)
	if err != nil {
		return err
	}
	if job.ProjectID != projectID || job.OrganizationID != orgID {
		return apperrors.Forbidden("Migration does not belong to this project")
	}

	if job.Status != domain.MigrationStatusRunning && job.Status != domain.MigrationStatusPending {
		return apperrors.BadRequest(fmt.Sprintf("Cannot cancel migration in '%s' state", job.Status))
	}

	cancelVal, ok := s.cancelFuncs.Load(migrationID)
	if !ok {
		return apperrors.BadRequest("Migration is not currently running")
	}

	cancelFunc := cancelVal.(context.CancelFunc)
	cancelFunc()

	return nil
}

// GetMigration returns the details of a specific migration job.
func (s *Service) GetMigration(ctx context.Context, userID, orgID, projectID, migrationID string) (*domain.MigrationJobResponse, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	job, err := s.migrationRepo.GetByID(ctx, migrationID)
	if err != nil {
		return nil, err
	}
	if job.ProjectID != projectID || job.OrganizationID != orgID {
		return nil, apperrors.Forbidden("Migration does not belong to this project")
	}

	resp := job.ToResponse()
	return &resp, nil
}

// ListMigrations returns all migration jobs for a project.
func (s *Service) ListMigrations(ctx context.Context, userID, orgID, projectID string) ([]domain.MigrationJobResponse, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	jobs, err := s.migrationRepo.ListByProject(ctx, projectID)
	if err != nil {
		return nil, err
	}

	var responses []domain.MigrationJobResponse
	for _, j := range jobs {
		responses = append(responses, j.ToResponse())
	}
	return responses, nil
}
