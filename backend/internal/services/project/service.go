package project

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/adapters"
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	"github.com/Prince-695/seasyn/backend/pkg/errors"
)

type projectService struct {
	repo      ports.ProjectRepository
	orgRepo   ports.OrgRepository
	encryptor *crypto.Encryptor
	connector *adapters.Connector
}

func NewProjectService(
	repo ports.ProjectRepository,
	orgRepo ports.OrgRepository,
	encryptor *crypto.Encryptor,
	connector *adapters.Connector,
) ports.ProjectService {
	return &projectService{
		repo:      repo,
		orgRepo:   orgRepo,
		encryptor: encryptor,
		connector: connector,
	}
}

// slugify converts a project name to a URL-safe slug
func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = regexp.MustCompile(`[^a-z0-9\-]+`).ReplaceAllString(s, "-")
	s = regexp.MustCompile(`-+`).ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

func isValidSlug(s string) bool {
	matched, _ := regexp.MatchString(`^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$`, s)
	return matched
}

// requireRole enforces organization RBAC hierarchy: owner > admin > member > viewer
func (s *projectService) requireRole(ctx context.Context, orgID, userID string, minRole domain.OrgRole) error {
	member, err := s.orgRepo.GetMember(ctx, orgID, userID)
	if err != nil {
		return errors.Forbidden("You are not a member of this organization")
	}
	order := map[domain.OrgRole]int{
		domain.OrgRoleViewer: 0,
		domain.OrgRoleMember: 1,
		domain.OrgRoleAdmin:  2,
		domain.OrgRoleOwner:  3,
	}
	if order[member.Role] < order[minRole] {
		return errors.Forbidden("You do not have permission to perform this action")
	}
	return nil
}

// --- Project Management ---

func (s *projectService) CreateProject(ctx context.Context, userID, orgID string, req domain.CreateProjectRequest) (*domain.Project, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleMember); err != nil {
		return nil, err
	}

	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Name)
	} else {
		slug = slugify(slug)
	}

	if !isValidSlug(slug) {
		return nil, errors.BadRequest("Slug must be 3-50 lowercase alphanumeric characters or hyphens")
	}

	exists, err := s.repo.ProjectSlugExists(ctx, orgID, slug)
	if err != nil {
		return nil, errors.Internal("Failed to verify project slug")
	}
	if exists {
		return nil, errors.BadRequest("A project with this slug already exists in this organization")
	}

	env := req.Environment
	if env == "" {
		env = "development"
	}

	p := domain.Project{
		OrganizationID: orgID,
		Name:           strings.TrimSpace(req.Name),
		Slug:           slug,
		Description:    strings.TrimSpace(req.Description),
		Environment:    env,
		CreatedBy:      userID,
	}

	created, err := s.repo.CreateProject(ctx, p)
	if err != nil {
		return nil, errors.Internal("Failed to create project")
	}
	return created, nil
}

func (s *projectService) GetProject(ctx context.Context, userID, orgID, projectID string) (*domain.ProjectDetail, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	p, err := s.repo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if p.OrganizationID != orgID {
		return nil, errors.Forbidden("Project does not belong to this organization")
	}

	conns, err := s.repo.ListConnectionsByProject(ctx, projectID)
	if err != nil {
		return nil, errors.Internal("Failed to load project database connections")
	}

	pubConns := make([]domain.PublicDatabaseConnection, 0, len(conns))
	for _, c := range conns {
		pubConns = append(pubConns, c.ToPublic())
	}

	return &domain.ProjectDetail{
		Project:     *p,
		Connections: pubConns,
	}, nil
}

func (s *projectService) ListProjects(ctx context.Context, userID, orgID string) ([]*domain.Project, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}
	return s.repo.ListProjectsByOrg(ctx, orgID)
}

func (s *projectService) UpdateProject(ctx context.Context, userID, orgID, projectID string, req domain.UpdateProjectRequest) (*domain.Project, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleMember); err != nil {
		return nil, err
	}

	p, err := s.repo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if p.OrganizationID != orgID {
		return nil, errors.Forbidden("Project does not belong to this organization")
	}

	p.Name = strings.TrimSpace(req.Name)
	p.Description = strings.TrimSpace(req.Description)
	if req.Environment != "" {
		p.Environment = req.Environment
	}

	return s.repo.UpdateProject(ctx, *p)
}

func (s *projectService) DeleteProject(ctx context.Context, userID, orgID, projectID string) error {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return err
	}

	p, err := s.repo.GetProjectByID(ctx, projectID)
	if err != nil {
		return err
	}
	if p.OrganizationID != orgID {
		return errors.Forbidden("Project does not belong to this organization")
	}

	return s.repo.DeleteProject(ctx, projectID)
}

// --- Database Connection Management ---

func (s *projectService) CreateConnection(ctx context.Context, userID, orgID, projectID string, req domain.CreateConnectionRequest) (*domain.PublicDatabaseConnection, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleMember); err != nil {
		return nil, err
	}

	p, err := s.repo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if p.OrganizationID != orgID {
		return nil, errors.Forbidden("Project does not belong to this organization")
	}

	// Encrypt sensitive credentials
	var encryptedPass, encryptedURI string
	if req.Password != "" {
		encryptedPass, err = s.encryptor.Encrypt(req.Password)
		if err != nil {
			return nil, errors.Internal("Failed to securely encrypt database credentials")
		}
	}
	if req.URI != "" {
		encryptedURI, err = s.encryptor.Encrypt(req.URI)
		if err != nil {
			return nil, errors.Internal("Failed to securely encrypt database URI")
		}
	}

	sslMode := req.SSLMode
	if sslMode == "" {
		sslMode = "disable"
	}

	conn := domain.DatabaseConnection{
		ProjectID:         projectID,
		Name:              strings.TrimSpace(req.Name),
		DBType:            req.DBType,
		Host:              strings.TrimSpace(req.Host),
		Port:              req.Port,
		Database:          strings.TrimSpace(req.Database),
		Username:          strings.TrimSpace(req.Username),
		EncryptedPassword: encryptedPass,
		SSLMode:           sslMode,
		FilePath:          strings.TrimSpace(req.FilePath),
		URI:               encryptedURI,
		IsSource:          req.IsSource,
	}

	created, err := s.repo.CreateConnection(ctx, conn)
	if err != nil {
		return nil, errors.Internal("Failed to save database connection")
	}

	pub := created.ToPublic()
	return &pub, nil
}

func (s *projectService) GetConnection(ctx context.Context, userID, orgID, projectID, connID string) (*domain.PublicDatabaseConnection, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	conn, err := s.repo.GetConnectionByID(ctx, connID)
	if err != nil {
		return nil, err
	}
	if conn.ProjectID != projectID {
		return nil, errors.Forbidden("Connection does not belong to this project")
	}

	pub := conn.ToPublic()
	return &pub, nil
}

func (s *projectService) ListConnections(ctx context.Context, userID, orgID, projectID string) ([]domain.PublicDatabaseConnection, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	p, err := s.repo.GetProjectByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if p.OrganizationID != orgID {
		return nil, errors.Forbidden("Project does not belong to this organization")
	}

	conns, err := s.repo.ListConnectionsByProject(ctx, projectID)
	if err != nil {
		return nil, errors.Internal("Failed to list database connections")
	}

	pubConns := make([]domain.PublicDatabaseConnection, 0, len(conns))
	for _, c := range conns {
		pubConns = append(pubConns, c.ToPublic())
	}
	return pubConns, nil
}

func (s *projectService) UpdateConnection(ctx context.Context, userID, orgID, projectID, connID string, req domain.UpdateConnectionRequest) (*domain.PublicDatabaseConnection, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleMember); err != nil {
		return nil, err
	}

	conn, err := s.repo.GetConnectionByID(ctx, connID)
	if err != nil {
		return nil, err
	}
	if conn.ProjectID != projectID {
		return nil, errors.Forbidden("Connection does not belong to this project")
	}

	conn.Name = strings.TrimSpace(req.Name)
	if req.Host != "" {
		conn.Host = strings.TrimSpace(req.Host)
	}
	if req.Port != 0 {
		conn.Port = req.Port
	}
	if req.Database != "" {
		conn.Database = strings.TrimSpace(req.Database)
	}
	if req.Username != "" {
		conn.Username = strings.TrimSpace(req.Username)
	}
	if req.SSLMode != "" {
		conn.SSLMode = req.SSLMode
	}
	if req.FilePath != "" {
		conn.FilePath = strings.TrimSpace(req.FilePath)
	}
	if req.IsSource != nil {
		conn.IsSource = *req.IsSource
	}

	if req.Password != "" {
		encryptedPass, err := s.encryptor.Encrypt(req.Password)
		if err != nil {
			return nil, errors.Internal("Failed to encrypt new password")
		}
		conn.EncryptedPassword = encryptedPass
	}

	if req.URI != "" {
		encryptedURI, err := s.encryptor.Encrypt(req.URI)
		if err != nil {
			return nil, errors.Internal("Failed to encrypt new URI")
		}
		conn.URI = encryptedURI
	}

	updated, err := s.repo.UpdateConnection(ctx, *conn)
	if err != nil {
		return nil, errors.Internal("Failed to update connection")
	}

	pub := updated.ToPublic()
	return &pub, nil
}

func (s *projectService) DeleteConnection(ctx context.Context, userID, orgID, projectID, connID string) error {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleAdmin); err != nil {
		return err
	}

	conn, err := s.repo.GetConnectionByID(ctx, connID)
	if err != nil {
		return err
	}
	if conn.ProjectID != projectID {
		return errors.Forbidden("Connection does not belong to this project")
	}

	return s.repo.DeleteConnection(ctx, connID)
}

// --- Live Connection Ping Diagnostics ---

func (s *projectService) TestDirectConnection(ctx context.Context, req domain.TestConnectionRequest) (*domain.ConnectionTestResult, error) {
	return s.connector.TestConnection(ctx, req)
}

func (s *projectService) TestSavedConnection(ctx context.Context, userID, orgID, projectID, connID string) (*domain.ConnectionTestResult, error) {
	if err := s.requireRole(ctx, orgID, userID, domain.OrgRoleViewer); err != nil {
		return nil, err
	}

	conn, err := s.repo.GetConnectionByID(ctx, connID)
	if err != nil {
		return nil, err
	}
	if conn.ProjectID != projectID {
		return nil, errors.Forbidden("Connection does not belong to this project")
	}

	// Decrypt password
	plainPassword, err := s.encryptor.Decrypt(conn.EncryptedPassword)
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to decrypt connection credentials: %v", err))
	}

	plainURI, err := s.encryptor.Decrypt(conn.URI)
	if err != nil {
		return nil, errors.Internal(fmt.Sprintf("Failed to decrypt connection URI: %v", err))
	}

	testReq := domain.TestConnectionRequest{
		DBType:   conn.DBType,
		Host:     conn.Host,
		Port:     conn.Port,
		Database: conn.Database,
		Username: conn.Username,
		Password: plainPassword,
		SSLMode:  conn.SSLMode,
		FilePath: conn.FilePath,
		URI:      plainURI,
	}

	return s.connector.TestConnection(ctx, testReq)
}
