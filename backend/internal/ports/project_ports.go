package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

// ProjectRepository defines persistence operations for projects and database connections.
type ProjectRepository interface {
	// Project CRUD
	CreateProject(ctx context.Context, p domain.Project) (*domain.Project, error)
	GetProjectByID(ctx context.Context, id string) (*domain.Project, error)
	GetProjectBySlug(ctx context.Context, orgID, slug string) (*domain.Project, error)
	ListProjectsByOrg(ctx context.Context, orgID string) ([]*domain.Project, error)
	UpdateProject(ctx context.Context, p domain.Project) (*domain.Project, error)
	DeleteProject(ctx context.Context, id string) error
	ProjectSlugExists(ctx context.Context, orgID, slug string) (bool, error)

	// Connection CRUD
	CreateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error)
	GetConnectionByID(ctx context.Context, id string) (*domain.DatabaseConnection, error)
	ListConnectionsByProject(ctx context.Context, projectID string) ([]*domain.DatabaseConnection, error)
	UpdateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error)
	DeleteConnection(ctx context.Context, id string) error
}

// ProjectService defines business logic for project & connection management.
type ProjectService interface {
	CreateProject(ctx context.Context, userID, orgID string, req domain.CreateProjectRequest) (*domain.Project, error)
	GetProject(ctx context.Context, userID, orgID, projectID string) (*domain.ProjectDetail, error)
	ListProjects(ctx context.Context, userID, orgID string) ([]*domain.Project, error)
	UpdateProject(ctx context.Context, userID, orgID, projectID string, req domain.UpdateProjectRequest) (*domain.Project, error)
	DeleteProject(ctx context.Context, userID, orgID, projectID string) error

	CreateConnection(ctx context.Context, userID, orgID, projectID string, req domain.CreateConnectionRequest) (*domain.PublicDatabaseConnection, error)
	GetConnection(ctx context.Context, userID, orgID, projectID, connID string) (*domain.PublicDatabaseConnection, error)
	ListConnections(ctx context.Context, userID, orgID, projectID string) ([]domain.PublicDatabaseConnection, error)
	UpdateConnection(ctx context.Context, userID, orgID, projectID, connID string, req domain.UpdateConnectionRequest) (*domain.PublicDatabaseConnection, error)
	DeleteConnection(ctx context.Context, userID, orgID, projectID, connID string) error

	TestDirectConnection(ctx context.Context, req domain.TestConnectionRequest) (*domain.ConnectionTestResult, error)
	TestSavedConnection(ctx context.Context, userID, orgID, projectID, connID string) (*domain.ConnectionTestResult, error)
}
