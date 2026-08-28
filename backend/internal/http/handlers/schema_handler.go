package handlers

import (
	"strconv"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type SchemaHandler struct {
	schemaService ports.SchemaService
	validate      *validator.Validate
}

func NewSchemaHandler(schemaService ports.SchemaService) *SchemaHandler {
	return &SchemaHandler{
		schemaService: schemaService,
		validate:      validator.New(),
	}
}

func (h *SchemaHandler) jsonResponse(c *fiber.Ctx, status int, success bool, message string, data interface{}) error {
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

func (h *SchemaHandler) RegisterRoutes(router fiber.Router, authMiddleware fiber.Handler, requireVerified fiber.Handler) {
	// Nested under project context: /v1/organizations/:orgID/projects/:projectID
	projGroup := router.Group("/organizations/:orgID/projects/:projectID")
	projGroup.Use(authMiddleware, requireVerified)

	// Schema Diff between source & target
	projGroup.Post("/schema/diff", h.CompareSchemas)

	// Connection-scoped schema & table operations
	connGroup := projGroup.Group("/connections/:connID")
	connGroup.Get("/schema", h.InspectDatabase)
	connGroup.Get("/tables", h.ListTables)
	connGroup.Get("/tables/:tableName", h.InspectTable)

	// Live Data Explorer / Table Rows
	connGroup.Get("/tables/:tableName/rows", h.QueryTableRows)
	connGroup.Post("/tables/:tableName/rows", h.InsertTableRow)
	connGroup.Put("/tables/:tableName/rows", h.UpdateTableRow)
	connGroup.Delete("/tables/:tableName/rows", h.DeleteTableRow)
}

// InspectDatabase godoc
// @Summary Inspect Database Schema
// @Description Inspects the complete database schema including all tables, columns, constraints, and indexes
// @Tags schema
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Success 200 {object} domain.Response{data=domain.DatabaseSchema}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/schema [get]
func (h *SchemaHandler) InspectDatabase(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")

	schema, err := h.schemaService.InspectDatabase(c.Context(), userID, orgID, projectID, connID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Database schema inspected successfully", schema)
}

// ListTables godoc
// @Summary List Database Tables
// @Description Returns a list of all table names available in the connected database
// @Tags schema
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Success 200 {object} domain.Response{data=[]string}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables [get]
func (h *SchemaHandler) ListTables(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")

	tables, err := h.schemaService.ListTables(c.Context(), userID, orgID, projectID, connID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Tables listed successfully", tables)
}

// InspectTable godoc
// @Summary Inspect Table Schema
// @Description Returns full column metadata, data types, primary keys, and indexes for a specific table
// @Tags schema
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Param tableName path string true "Table Name"
// @Success 200 {object} domain.Response{data=domain.TableSchema}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName} [get]
func (h *SchemaHandler) InspectTable(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")
	tableName := c.Params("tableName")

	table, err := h.schemaService.InspectTable(c.Context(), userID, orgID, projectID, connID, tableName)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Table schema retrieved", table)
}

// CompareSchemas godoc
// @Summary Compare Source and Target Schemas
// @Description Calculates structural differences (added tables, deleted tables, altered columns) between two database connections
// @Tags schema
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param request body domain.CompareSchemaRequest true "Compare Schema Request"
// @Success 200 {object} domain.Response{data=domain.SchemaDiff}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/schema/diff [post]
func (h *SchemaHandler) CompareSchemas(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	var req domain.CompareSchemaRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	diff, err := h.schemaService.CompareSchemas(c.Context(), userID, orgID, projectID, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Schema comparison completed", diff)
}

// QueryTableRows godoc
// @Summary Query Table Rows
// @Description Query paginated live data rows from a target database table
// @Tags data-explorer
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Param tableName path string true "Table Name"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Rows per page (default: 50, max: 500)"
// @Param order_by query string false "Column to order by"
// @Param order_dir query string false "Order direction (asc/desc)"
// @Success 200 {object} domain.Response{data=domain.QueryResult}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}/rows [get]
func (h *SchemaHandler) QueryTableRows(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")
	tableName := c.Params("tableName")

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	orderBy := c.Query("order_by", "")
	orderDir := c.Query("order_dir", "asc")

	req := domain.QueryRequest{
		Page:     page,
		Limit:    limit,
		OrderBy:  orderBy,
		OrderDir: orderDir,
	}

	result, err := h.schemaService.QueryTableRows(c.Context(), userID, orgID, projectID, connID, tableName, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Rows retrieved successfully", result)
}

// InsertTableRow godoc
// @Summary Insert Table Row
// @Description Insert a single record into a connected database table
// @Tags data-explorer
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Param tableName path string true "Table Name"
// @Param request body domain.InsertRowRequest true "Insert Row Request"
// @Success 201 {object} domain.Response{data=map[string]interface{}}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}/rows [post]
func (h *SchemaHandler) InsertTableRow(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")
	tableName := c.Params("tableName")

	var req domain.InsertRowRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	created, err := h.schemaService.InsertTableRow(c.Context(), userID, orgID, projectID, connID, tableName, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusCreated, true, "Row inserted successfully", created)
}

// UpdateTableRow godoc
// @Summary Update Table Row
// @Description Update an existing row identified by its primary key
// @Tags data-explorer
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Param tableName path string true "Table Name"
// @Param request body domain.UpdateRowRequest true "Update Row Request"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}/rows [put]
func (h *SchemaHandler) UpdateTableRow(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")
	tableName := c.Params("tableName")

	var req domain.UpdateRowRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	if err := h.schemaService.UpdateTableRow(c.Context(), userID, orgID, projectID, connID, tableName, req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Row updated successfully", nil)
}

// DeleteTableRow godoc
// @Summary Delete Table Row
// @Description Delete a row identified by its primary key
// @Tags data-explorer
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param connID path string true "Connection ID"
// @Param tableName path string true "Table Name"
// @Param request body domain.DeleteRowRequest true "Delete Row Request"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/connections/{connID}/tables/{tableName}/rows [delete]
func (h *SchemaHandler) DeleteTableRow(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	connID := c.Params("connID")
	tableName := c.Params("tableName")

	var req domain.DeleteRowRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	if err := h.schemaService.DeleteTableRow(c.Context(), userID, orgID, projectID, connID, tableName, req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Row deleted successfully", nil)
}
