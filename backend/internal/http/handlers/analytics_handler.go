package handlers

import (
	"net/http"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/gofiber/fiber/v2"
)

type AnalyticsHandler struct {
	service ports.AnalyticsService
}

// NewAnalyticsHandler creates a new AnalyticsHandler.
func NewAnalyticsHandler(service ports.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: service}
}

// RegisterRoutes registers the analytics routes under the given router.
func (h *AnalyticsHandler) RegisterRoutes(router fiber.Router, authMiddleware, requireVerified fiber.Handler) {
	group := router.Group("/organizations/:orgID", authMiddleware, requireVerified)

	group.Get("/analytics/overview", h.GetOrgOverview)
	group.Get("/projects/:projectID/analytics", h.GetProjectAnalytics)
	group.Get("/projects/:projectID/migrations/analytics", h.GetMigrationAnalytics)
}

// GetOrgOverview godoc
// @Summary Get Organization Analytics Overview
// @Description Returns quota usage, engine mix, 30-day velocity timeline, and migration health for an organization.
// @Tags analytics
// @Accept json
// @Produce json
// @Param orgID path string true "Organization ID"
// @Success 200 {object} domain.Response{data=domain.OrgAnalyticsOverview}
// @Failure 401 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/analytics/overview [get]
func (h *AnalyticsHandler) GetOrgOverview(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return c.Status(http.StatusUnauthorized).JSON(domain.Response{
			Success: false,
			Error:   "Unauthorized",
		})
	}

	orgID := c.Params("orgID")
	overview, err := h.service.GetOrgAnalyticsOverview(c.Context(), userID, orgID)
	if err != nil {
		return err
	}

	return c.JSON(domain.Response{
		Success: true,
		Data:    overview,
	})
}

// GetProjectAnalytics godoc
// @Summary Get Project Analytics & Topology Flow
// @Description Returns connection quotas, topology nodes/edges, top synced tables, and 14-day activity heatmap.
// @Tags analytics
// @Accept json
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Success 200 {object} domain.Response{data=domain.ProjectAnalytics}
// @Failure 401 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/analytics [get]
func (h *AnalyticsHandler) GetProjectAnalytics(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return c.Status(http.StatusUnauthorized).JSON(domain.Response{
			Success: false,
			Error:   "Unauthorized",
		})
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	analyticsData, err := h.service.GetProjectAnalytics(c.Context(), userID, orgID, projectID)
	if err != nil {
		return err
	}

	return c.JSON(domain.Response{
		Success: true,
		Data:    analyticsData,
	})
}

// GetMigrationAnalytics godoc
// @Summary Get Migration Studio Analytics
// @Description Returns historical migration summary, duration distribution buckets, and error breakdowns.
// @Tags analytics
// @Accept json
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param projectID path string true "Project ID"
// @Success 200 {object} domain.Response{data=domain.MigrationAnalytics}
// @Failure 401 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Router /v1/organizations/{orgID}/projects/{projectID}/migrations/analytics [get]
func (h *AnalyticsHandler) GetMigrationAnalytics(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return c.Status(http.StatusUnauthorized).JSON(domain.Response{
			Success: false,
			Error:   "Unauthorized",
		})
	}

	orgID := c.Params("orgID")
	projectID := c.Params("projectID")

	analyticsData, err := h.service.GetMigrationAnalytics(c.Context(), userID, orgID, projectID)
	if err != nil {
		return err
	}

	return c.JSON(domain.Response{
		Success: true,
		Data:    analyticsData,
	})
}
