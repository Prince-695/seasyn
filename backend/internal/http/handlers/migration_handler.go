package handlers

import (
	"bufio"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/internal/services/migration"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// MigrationHandler handles migration-related HTTP endpoints.
type MigrationHandler struct {
	migrationService ports.MigrationService
	hub              *migration.ProgressHub
	validate         *validator.Validate
}

// NewMigrationHandler creates a new MigrationHandler.
func NewMigrationHandler(migrationService ports.MigrationService, hub *migration.ProgressHub) *MigrationHandler {
	return &MigrationHandler{
		migrationService: migrationService,
		hub:              hub,
		validate:         validator.New(),
	}
}

// RegisterRoutes registers migration routes under /v1.
func (h *MigrationHandler) RegisterRoutes(router fiber.Router, authMiddleware, verifiedMiddleware fiber.Handler) {
	orgs := router.Group("/organizations/:orgID/projects/:projectID", authMiddleware, verifiedMiddleware)
	orgs.Post("/migrations", h.StartMigration)
	orgs.Get("/migrations", h.ListMigrations)
	orgs.Get("/migrations/:migrationID", h.GetMigration)
	orgs.Delete("/migrations/:migrationID", h.CancelMigration)
	orgs.Get("/migrations/:migrationID/progress", h.StreamProgress)
}

// StartMigration godoc
// @Summary Start a new database migration
// @Description Starts an asynchronous migration from source to target database table. Returns the job ID immediately.
// @Tags Migration
// @Accept json
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param body body domain.StartMigrationRequest true "Migration parameters"
// @Success 201 {object} domain.Response{data=domain.MigrationJobResponse}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Failure 409 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/projects/{projectID}/migrations [post]
func (h *MigrationHandler) StartMigration(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	var req domain.StartMigrationRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.Response{
			Success: false,
			Message: "Validation failed",
			Data:    err.Error(),
		})
	}

	resp, err := h.migrationService.StartMigration(c.Context(), userID, orgID, projectID, req)
	if err != nil {
		return err
	}

	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	return c.Status(fiber.StatusCreated).JSON(domain.Response{
		Success:      true,
		Message:      "Migration started",
		Data:         resp,
		ResponseTime: responseTime,
	})
}

// ListMigrations godoc
// @Summary List all migration jobs for a project
// @Description Returns all migration jobs for the specified project, ordered by creation date descending.
// @Tags Migration
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Success 200 {object} domain.Response{data=[]domain.MigrationJobResponse}
// @Failure 403 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/projects/{projectID}/migrations [get]
func (h *MigrationHandler) ListMigrations(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	jobs, err := h.migrationService.ListMigrations(c.Context(), userID, orgID, projectID)
	if err != nil {
		return err
	}

	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	return c.JSON(domain.Response{
		Success:      true,
		Message:      "Migration jobs retrieved",
		Data:         jobs,
		ResponseTime: responseTime,
	})
}

// GetMigration godoc
// @Summary Get migration job details
// @Description Returns the details and current status of a specific migration job.
// @Tags Migration
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param migrationID path string true "Migration Job ID"
// @Success 200 {object} domain.Response{data=domain.MigrationJobResponse}
// @Failure 404 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/projects/{projectID}/migrations/{migrationID} [get]
func (h *MigrationHandler) GetMigration(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	migrationID := c.Params("migrationID")

	job, err := h.migrationService.GetMigration(c.Context(), userID, orgID, projectID, migrationID)
	if err != nil {
		return err
	}

	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	return c.JSON(domain.Response{
		Success:      true,
		Message:      "Migration job retrieved",
		Data:         job,
		ResponseTime: responseTime,
	})
}

// CancelMigration godoc
// @Summary Cancel a running migration
// @Description Cancels a running migration job. Only works for migrations in 'running' or 'pending' state.
// @Tags Migration
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param migrationID path string true "Migration Job ID"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/projects/{projectID}/migrations/{migrationID} [delete]
func (h *MigrationHandler) CancelMigration(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	projectID := c.Params("projectID")
	migrationID := c.Params("migrationID")

	if err := h.migrationService.CancelMigration(c.Context(), userID, orgID, projectID, migrationID); err != nil {
		return err
	}

	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	return c.JSON(domain.Response{
		Success:      true,
		Message:      "Migration cancelled",
		ResponseTime: responseTime,
	})
}

// StreamProgress godoc
// @Summary Stream real-time migration progress (SSE)
// @Description Opens an SSE connection that streams real-time progress events for a running migration.
// @Tags Migration
// @Produce text/event-stream
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Param migrationID path string true "Migration Job ID"
// @Success 200 {string} string "SSE event stream"
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/projects/{projectID}/migrations/{migrationID}/progress [get]
func (h *MigrationHandler) StreamProgress(c *fiber.Ctx) error {
	migrationID := c.Params("migrationID")

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")

	progressCh := h.hub.Subscribe(migrationID)

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		defer h.hub.Unsubscribe(migrationID, progressCh)

		// Send initial keepalive
		fmt.Fprintf(w, ": connected\n\n")
		w.Flush()

		for event := range progressCh {
			data, err := json.Marshal(event)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "event: progress\ndata: %s\n\n", data)
			if err := w.Flush(); err != nil {
				return // Client disconnected
			}

			// If migration ended, close the stream
			if event.State == domain.MigrationStatusCompleted ||
				event.State == domain.MigrationStatusFailed ||
				event.State == domain.MigrationStatusCancelled {
				return
			}
		}
	})

	return nil
}
