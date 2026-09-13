package analytics

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
)

type service struct {
	analyticsRepo ports.AnalyticsRepository
	orgRepo       ports.OrgRepository
	projectRepo   ports.ProjectRepository
}

// NewAnalyticsService creates a new AnalyticsService with permission checks.
func NewAnalyticsService(
	analyticsRepo ports.AnalyticsRepository,
	orgRepo ports.OrgRepository,
	projectRepo ports.ProjectRepository,
) ports.AnalyticsService {
	return &service{
		analyticsRepo: analyticsRepo,
		orgRepo:       orgRepo,
		projectRepo:   projectRepo,
	}
}

func (s *service) GetOrgAnalyticsOverview(ctx context.Context, userID, orgID string) (*domain.OrgAnalyticsOverview, error) {
	// Verify membership
	member, err := s.orgRepo.GetMember(ctx, orgID, userID)
	if err != nil || member == nil {
		return nil, apperrors.Forbidden("You are not a member of this organization")
	}

	return s.analyticsRepo.GetOrgAnalyticsOverview(ctx, orgID, userID)
}

func (s *service) GetProjectAnalytics(ctx context.Context, userID, orgID, projectID string) (*domain.ProjectAnalytics, error) {
	// Verify membership
	member, err := s.orgRepo.GetMember(ctx, orgID, userID)
	if err != nil || member == nil {
		return nil, apperrors.Forbidden("You are not a member of this organization")
	}

	// Verify project belongs to org
	project, err := s.projectRepo.GetProjectByID(ctx, projectID)
	if err != nil || project == nil {
		return nil, apperrors.NotFound("Project not found")
	}
	if project.OrganizationID != orgID {
		return nil, apperrors.Forbidden("Project does not belong to this organization")
	}

	return s.analyticsRepo.GetProjectAnalytics(ctx, orgID, projectID)
}

func (s *service) GetMigrationAnalytics(ctx context.Context, userID, orgID, projectID string) (*domain.MigrationAnalytics, error) {
	// Verify membership
	member, err := s.orgRepo.GetMember(ctx, orgID, userID)
	if err != nil || member == nil {
		return nil, apperrors.Forbidden("You are not a member of this organization")
	}

	// Verify project belongs to org
	project, err := s.projectRepo.GetProjectByID(ctx, projectID)
	if err != nil || project == nil {
		return nil, apperrors.NotFound("Project not found")
	}
	if project.OrganizationID != orgID {
		return nil, apperrors.Forbidden("Project does not belong to this organization")
	}

	return s.analyticsRepo.GetMigrationAnalytics(ctx, orgID, projectID)
}
