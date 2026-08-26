package handlers

import (
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type ProjectHandler struct {
	projectService ports.ProjectService
	validate       *validator.Validate
}

func NewProjectHandler(projectService ports.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		projectService: projectService,
		validate:       validator.New(),
	}
}

func (h *ProjectHandler) jsonResponse(c *fiber.Ctx, status int, success bool, message string, data interface{}) error {
	resp := domain.Response{
		Success: success,
		Message: message,
		Data:    data,
	}
	if !success {
		resp.Error = message
		resp.Message = ""
	}
	return c.Status(status).JSON(resp)
}

func (h *ProjectHandler) RegisterRoutes(router fiber.Router, authMiddleware fiber.Handler, requireVerified fiber.Handler) {
	// Nested under organizations: /v1/organizations/:orgID/projects
	projectGroup := router.Group("/organizations/:orgID/projects")
	projectGroup.Use(authMiddleware, requireVerified)

	// Project CRUD
	projectGroup.Post("/", h.CreateProject)
	projectGroup.Get("/", h.ListProjects)
	projectGroup.Get("/:projectID", h.GetProject)
	projectGroup.Put("/:projectID", h.UpdateProject)
	projectGroup.Delete("/:projectID", h.DeleteProject)

	// Database Connection CRUD & Diagnostics
	projectGroup.Post("/:projectID/connections", h.CreateConnection)
	projectGroup.Get("/:projectID/connections", h.ListConnections)
	projectGroup.Get("/:projectID/connections/:connID", h.GetConnection)
	projectGroup.Put("/:projectID/connections/:connID", h.UpdateConnection)
	projectGroup.Delete("/:projectID/connections/:connID", h.DeleteConnection)

	// Diagnostics / Ping Tests
	projectGroup.Post("/:projectID/connections/test", h.TestDirectConnection)
	projectGroup.Post("/:projectID/connections/:connID/test", h.TestSavedConnection)
}

// CreateProject godoc
// @Summary Create a Project
// @Description Create a database sync project inside an organization
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param request body domain.CreateProjectRequest true "Create Project Request"
// @Success 201 {object} domain.Response{data=domain.Project}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects [post]
func (h *ProjectHandler) CreateProject(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")

	var req domain.CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	p, err := h.projectService.CreateProject(c.Context(), userID, orgID, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusCreated, true, "Project created successfully", p)
}

// ListProjects godoc
// @Summary List Projects
// @Description Returns all projects within the given organization
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Success 200 {object} domain.Response{data=[]domain.Project}
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects [get]
func (h *ProjectHandler) ListProjects(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projects, err := h.projectService.ListProjects(c.Context(), userID, orgID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Projects retrieved", projects)
}

// GetProject godoc
// @Summary Get Project Details
// @Description Returns project details including its configured database connections
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Success 200 {object} domain.Response{data=domain.ProjectDetail}
// @Failure 403 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID} [get]
func (h *ProjectHandler) GetProject(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	p, err := h.projectService.GetProject(c.Context(), userID, orgID, projectID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Project details retrieved", p)
}

// UpdateProject godoc
// @Summary Update Project
// @Description Update project name, description, or environment
// @Tags projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param request body domain.UpdateProjectRequest true "Update Project Request"
// @Success 200 {object} domain.Response{data=domain.Project}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID} [put]
func (h *ProjectHandler) UpdateProject(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	var req domain.UpdateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	p, err := h.projectService.UpdateProject(c.Context(), userID, orgID, projectID, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Project updated successfully", p)
}

// DeleteProject godoc
// @Summary Delete Project
// @Description Permanently delete a project and all its database connection configurations
// @Tags projects
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Success 200 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID} [delete]
func (h *ProjectHandler) DeleteProject(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	if err := h.projectService.DeleteProject(c.Context(), userID, orgID, projectID); err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Project deleted successfully", nil)
}

// CreateConnection godoc
// @Summary Create Database Connection
// @Description Register a database connection (PostgreSQL, MySQL, MongoDB, SQLite) under a project
// @Tags database-connections
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param request body domain.CreateConnectionRequest true "Create Connection Request"
// @Success 201 {object} domain.Response{data=domain.PublicDatabaseConnection}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections [post]
func (h *ProjectHandler) CreateConnection(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	var req domain.CreateConnectionRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	conn, err := h.projectService.CreateConnection(c.Context(), userID, orgID, projectID, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusCreated, true, "Database connection saved", conn)
}

// ListConnections godoc
// @Summary List Database Connections
// @Description List all database connections for a project
// @Tags database-connections
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Success 200 {object} domain.Response{data=[]domain.PublicDatabaseConnection}
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections [get]
func (h *ProjectHandler) ListConnections(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	conns, err := h.projectService.ListConnections(c.Context(), userID, orgID, projectID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Connections retrieved", conns)
}

// GetConnection godoc
// @Summary Get Database Connection
// @Description Get database connection metadata (sensitive credentials omitted)
// @Tags database-connections
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Success 200 {object} domain.Response{data=domain.PublicDatabaseConnection}
// @Failure 403 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID} [get]
func (h *ProjectHandler) GetConnection(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")

	conn, err := h.projectService.GetConnection(c.Context(), userID, orgID, projectID, connID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Connection retrieved", conn)
}

// UpdateConnection godoc
// @Summary Update Database Connection
// @Description Update database connection metadata
// @Tags database-connections
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Param request body domain.UpdateConnectionRequest true "Update Connection Request"
// @Success 200 {object} domain.Response{data=domain.PublicDatabaseConnection}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID} [put]
func (h *ProjectHandler) UpdateConnection(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")

	var req domain.UpdateConnectionRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	conn, err := h.projectService.UpdateConnection(c.Context(), userID, orgID, projectID, connID, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Connection updated successfully", conn)
}

// DeleteConnection godoc
// @Summary Delete Database Connection
// @Description Remove a database connection configuration
// @Tags database-connections
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Success 200 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID} [delete]
func (h *ProjectHandler) DeleteConnection(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")

	if err := h.projectService.DeleteConnection(c.Context(), userID, orgID, projectID, connID); err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Connection deleted successfully", nil)
}

// TestDirectConnection godoc
// @Summary Test Direct Database Connection
// @Description Test live connectivity against supplied database connection credentials before saving
// @Tags database-connections
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param request body domain.TestConnectionRequest true "Test Connection Request"
// @Success 200 {object} domain.Response{data=domain.ConnectionTestResult}
// @Failure 400 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/test [post]
func (h *ProjectHandler) TestDirectConnection(c *fiber.Ctx) error {
	var req domain.TestConnectionRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	res, err := h.projectService.TestDirectConnection(c.Context(), req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Connection test completed", res)
}

// TestSavedConnection godoc
// @Summary Test Saved Database Connection
// @Description Test live connectivity using a previously saved database connection
// @Tags database-connections
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Success 200 {object} domain.Response{data=domain.ConnectionTestResult}
// @Failure 403 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/test [post]
func (h *ProjectHandler) TestSavedConnection(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")

	res, err := h.projectService.TestSavedConnection(c.Context(), userID, orgID, projectID, connID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Saved connection test completed", res)
}
