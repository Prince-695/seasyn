package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"gorm.io/gorm"
)

type projectRepo struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) ports.ProjectRepository {
	return &projectRepo{db: db}
}

// --- Project CRUD ---

func (r *projectRepo) CreateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	model := ProjectModel{
		OrganizationID: p.OrganizationID,
		Name:           p.Name,
		Slug:           p.Slug,
		Description:    p.Description,
		Environment:    p.Environment,
		CreatedBy:      p.CreatedBy,
	}
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return nil, fmt.Errorf("create project: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *projectRepo) GetProjectByID(ctx context.Context, id string) (*domain.Project, error) {
	var model ProjectModel
	err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperrors.NotFound("project")
	}
	if err != nil {
		return nil, fmt.Errorf("get project by id: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *projectRepo) GetProjectBySlug(ctx context.Context, orgID, slug string) (*domain.Project, error) {
	var model ProjectModel
	err := r.db.WithContext(ctx).
		Where("organization_id = ? AND slug = ?", orgID, slug).
		First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperrors.NotFound("project")
	}
	if err != nil {
		return nil, fmt.Errorf("get project by slug: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *projectRepo) ListProjectsByOrg(ctx context.Context, orgID string) ([]*domain.Project, error) {
	var models []ProjectModel
	err := r.db.WithContext(ctx).
		Where("organization_id = ?", orgID).
		Order("created_at DESC").
		Find(&models).Error
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}

	projects := make([]*domain.Project, 0, len(models))
	for _, m := range models {
		projects = append(projects, m.ToDomain())
	}
	return projects, nil
}

func (r *projectRepo) UpdateProject(ctx context.Context, p domain.Project) (*domain.Project, error) {
	updates := map[string]any{
		"name":        p.Name,
		"description": p.Description,
		"environment": p.Environment,
	}
	if err := r.db.WithContext(ctx).
		Model(&ProjectModel{}).
		Where("id = ?", p.ID).
		Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update project: %w", err)
	}
	return r.GetProjectByID(ctx, p.ID)
}

func (r *projectRepo) DeleteProject(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&ProjectModel{}).Error
}

func (r *projectRepo) ProjectSlugExists(ctx context.Context, orgID, slug string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&ProjectModel{}).
		Where("organization_id = ? AND slug = ?", orgID, slug).
		Count(&count).Error
	return count > 0, err
}

// --- Connection CRUD ---

func (r *projectRepo) CreateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	model := DatabaseConnectionModel{
		ProjectID:         conn.ProjectID,
		Name:              conn.Name,
		DBType:            string(conn.DBType),
		Host:              conn.Host,
		Port:              conn.Port,
		Database:          conn.Database,
		Username:          conn.Username,
		EncryptedPassword: conn.EncryptedPassword,
		SSLMode:           conn.SSLMode,
		FilePath:          conn.FilePath,
		URI:               conn.URI,
		IsSource:          conn.IsSource,
	}
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return nil, fmt.Errorf("create connection: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *projectRepo) GetConnectionByID(ctx context.Context, id string) (*domain.DatabaseConnection, error) {
	var model DatabaseConnectionModel
	err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperrors.NotFound("connection")
	}
	if err != nil {
		return nil, fmt.Errorf("get connection by id: %w", err)
	}
	return model.ToDomain(), nil
}

func (r *projectRepo) ListConnectionsByProject(ctx context.Context, projectID string) ([]*domain.DatabaseConnection, error) {
	var models []DatabaseConnectionModel
	err := r.db.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("created_at ASC").
		Find(&models).Error
	if err != nil {
		return nil, fmt.Errorf("list connections: %w", err)
	}

	conns := make([]*domain.DatabaseConnection, 0, len(models))
	for _, m := range models {
		conns = append(conns, m.ToDomain())
	}
	return conns, nil
}

func (r *projectRepo) UpdateConnection(ctx context.Context, conn domain.DatabaseConnection) (*domain.DatabaseConnection, error) {
	updates := map[string]any{
		"name":      conn.Name,
		"host":      conn.Host,
		"port":      conn.Port,
		"database":  conn.Database,
		"username":  conn.Username,
		"ssl_mode":  conn.SSLMode,
		"file_path": conn.FilePath,
		"is_source": conn.IsSource,
	}
	if conn.EncryptedPassword != "" {
		updates["encrypted_password"] = conn.EncryptedPassword
	}
	if conn.URI != "" {
		updates["uri"] = conn.URI
	}

	if err := r.db.WithContext(ctx).
		Model(&DatabaseConnectionModel{}).
		Where("id = ?", conn.ID).
		Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update connection: %w", err)
	}
	return r.GetConnectionByID(ctx, conn.ID)
}

func (r *projectRepo) DeleteConnection(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&DatabaseConnectionModel{}).Error
}
