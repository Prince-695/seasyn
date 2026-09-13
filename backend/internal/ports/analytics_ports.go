package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// AnalyticsRepository defines database operations for analytical queries.
type AnalyticsRepository interface {
	GetOrgAnalyticsOverview(ctx context.Context, orgID, userID string) (*domain.OrgAnalyticsOverview, error)
	GetProjectAnalytics(ctx context.Context, orgID, projectID string) (*domain.ProjectAnalytics, error)
	GetMigrationAnalytics(ctx context.Context, orgID, projectID string) (*domain.MigrationAnalytics, error)
}

// AnalyticsService defines business operations for analytics.
type AnalyticsService interface {
	GetOrgAnalyticsOverview(ctx context.Context, userID, orgID string) (*domain.OrgAnalyticsOverview, error)
	GetProjectAnalytics(ctx context.Context, userID, orgID, projectID string) (*domain.ProjectAnalytics, error)
	GetMigrationAnalytics(ctx context.Context, userID, orgID, projectID string) (*domain.MigrationAnalytics, error)
}
