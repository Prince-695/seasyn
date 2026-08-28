package handlers

import (
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/gofiber/fiber/v2"
)

// AuditHandler handles audit log queries.
type AuditHandler struct {
	auditService ports.AuditService
}

// NewAuditHandler creates a new AuditHandler.
func NewAuditHandler(auditService ports.AuditService) *AuditHandler {
	return &AuditHandler{
		auditService: auditService,
	}
}

// RegisterRoutes registers audit routes under /v1.
func (h *AuditHandler) RegisterRoutes(router fiber.Router, authMiddleware, verifiedMiddleware fiber.Handler) {
	orgs := router.Group("/organizations/:orgID", authMiddleware, verifiedMiddleware)
	orgs.Get("/audit-logs", h.ListAuditLogs)
}

// ListAuditLogs godoc
// @Summary List and filter organization audit logs
// @Description Returns paginated audit activity records for an organization. Restricted to Org Admins and Owners.
// @Tags Audit Logs
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param project_id query string false "Filter by Project ID"
// @Param user_id query string false "Filter by User ID"
// @Param action query string false "Filter by Action (e.g., migration.started)"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Page size (default: 50, max: 100)"
// @Success 200 {object} domain.Response{data=domain.AuditLogListResponse}
// @Failure 403 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/audit-logs [get]
func (h *AuditHandler) ListAuditLogs(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")

	filter := domain.AuditLogFilter{
		OrgID:     orgID,
		ProjectID: c.Query("project_id"),
		UserID:    c.Query("user_id"),
		Action:    domain.AuditAction(c.Query("action")),
		Page:      c.QueryInt("page", 1),
		Limit:     c.QueryInt("limit", 50),
	}

	res, err := h.auditService.ListLogs(c.Context(), userID, orgID, filter)
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
		Message:      "Audit logs retrieved",
		Data:         res,
		ResponseTime: responseTime,
	})
}
