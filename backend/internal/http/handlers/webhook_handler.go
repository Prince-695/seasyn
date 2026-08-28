package handlers

import (
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// WebhookHandler handles webhook registration, testing, and delivery inspection endpoints.
type WebhookHandler struct {
	webhookService ports.WebhookService
	validate       *validator.Validate
}

// NewWebhookHandler creates a new WebhookHandler.
func NewWebhookHandler(webhookService ports.WebhookService) *WebhookHandler {
	return &WebhookHandler{
		webhookService: webhookService,
		validate:       validator.New(),
	}
}

// RegisterRoutes registers webhook routes under /v1.
func (h *WebhookHandler) RegisterRoutes(router fiber.Router, authMiddleware, verifiedMiddleware fiber.Handler) {
	orgs := router.Group("/organizations/:orgID", authMiddleware, verifiedMiddleware)
	orgs.Post("/webhooks", h.CreateWebhook)
	orgs.Get("/webhooks", h.ListWebhooks)
	orgs.Get("/webhooks/:webhookID", h.GetWebhook)
	orgs.Put("/webhooks/:webhookID", h.UpdateWebhook)
	orgs.Delete("/webhooks/:webhookID", h.DeleteWebhook)
	orgs.Post("/webhooks/:webhookID/test", h.TestWebhook)
	orgs.Get("/webhooks/:webhookID/deliveries", h.ListDeliveries)
}

// CreateWebhook godoc
// @Summary Register a new outbound webhook
// @Description Subscribes an endpoint URL to organization events. Secret is returned only upon creation.
// @Tags Webhooks
// @Accept json
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param body body domain.CreateWebhookRequest true "Webhook configuration"
// @Success 201 {object} domain.Response{data=domain.WebhookResponse}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/webhooks [post]
func (h *WebhookHandler) CreateWebhook(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")

	var req domain.CreateWebhookRequest
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

	resp, err := h.webhookService.CreateWebhook(c.Context(), userID, orgID, req)
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
		Message:      "Webhook created",
		Data:         resp,
		ResponseTime: responseTime,
	})
}

// ListWebhooks godoc
// @Summary List organization webhooks
// @Description Returns all registered webhooks for an organization.
// @Tags Webhooks
// @Produce json
// @Param orgID path string true "Organization ID"
// @Success 200 {object} domain.Response{data=[]domain.WebhookResponse}
// @Failure 403 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/webhooks [get]
func (h *WebhookHandler) ListWebhooks(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")

	res, err := h.webhookService.ListWebhooks(c.Context(), userID, orgID)
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
		Message:      "Webhooks retrieved",
		Data:         res,
		ResponseTime: responseTime,
	})
}

// GetWebhook godoc
// @Summary Get webhook details
// @Description Returns configuration details for a specific webhook.
// @Tags Webhooks
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param webhookID path string true "Webhook ID"
// @Success 200 {object} domain.Response{data=domain.WebhookResponse}
// @Failure 404 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/webhooks/{webhookID} [get]
func (h *WebhookHandler) GetWebhook(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	webhookID := c.Params("webhookID")

	res, err := h.webhookService.GetWebhook(c.Context(), userID, orgID, webhookID)
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
		Message:      "Webhook retrieved",
		Data:         res,
		ResponseTime: responseTime,
	})
}

// UpdateWebhook godoc
// @Summary Update webhook configuration
// @Description Updates the name, URL, subscribed events, or active status of a webhook.
// @Tags Webhooks
// @Accept json
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param webhookID path string true "Webhook ID"
// @Param body body domain.UpdateWebhookRequest true "Updated configuration"
// @Success 200 {object} domain.Response{data=domain.WebhookResponse}
// @Failure 400 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/webhooks/{webhookID} [put]
func (h *WebhookHandler) UpdateWebhook(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	webhookID := c.Params("webhookID")

	var req domain.UpdateWebhookRequest
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

	res, err := h.webhookService.UpdateWebhook(c.Context(), userID, orgID, webhookID, req)
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
		Message:      "Webhook updated",
		Data:         res,
		ResponseTime: responseTime,
	})
}

// DeleteWebhook godoc
// @Summary Delete a webhook
// @Description Removes a webhook subscription and disables future event deliveries.
// @Tags Webhooks
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param webhookID path string true "Webhook ID"
// @Success 200 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/webhooks/{webhookID} [delete]
func (h *WebhookHandler) DeleteWebhook(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	webhookID := c.Params("webhookID")

	if err := h.webhookService.DeleteWebhook(c.Context(), userID, orgID, webhookID); err != nil {
		return err
	}

	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	return c.JSON(domain.Response{
		Success:      true,
		Message:      "Webhook deleted",
		ResponseTime: responseTime,
	})
}

// TestWebhook godoc
// @Summary Send a test ping event to webhook endpoint
// @Description Dispatches a synthetic 'ping' event to the webhook URL and returns the HTTP status and latency.
// @Tags Webhooks
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param webhookID path string true "Webhook ID"
// @Success 200 {object} domain.Response{data=domain.TestWebhookResponse}
// @Failure 404 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/webhooks/{webhookID}/test [post]
func (h *WebhookHandler) TestWebhook(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	webhookID := c.Params("webhookID")

	res, err := h.webhookService.TestWebhook(c.Context(), userID, orgID, webhookID)
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
		Message:      "Webhook test completed",
		Data:         res,
		ResponseTime: responseTime,
	})
}

// ListDeliveries godoc
// @Summary List recent delivery logs for a webhook
// @Description Returns recent HTTP delivery logs including payloads, HTTP status codes, and execution times.
// @Tags Webhooks
// @Produce json
// @Param orgID path string true "Organization ID"
// @Param webhookID path string true "Webhook ID"
// @Param limit query int false "Max logs to return (default: 20, max: 100)"
// @Success 200 {object} domain.Response{data=[]domain.WebhookDelivery}
// @Failure 404 {object} domain.Response
// @Security BearerAuth
// @Router /v1/organizations/{orgID}/webhooks/{webhookID}/deliveries [get]
func (h *WebhookHandler) ListDeliveries(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	orgID := c.Params("orgID")
	webhookID := c.Params("webhookID")
	limit := c.QueryInt("limit", 20)

	deliveries, err := h.webhookService.ListDeliveries(c.Context(), userID, orgID, webhookID, limit)
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
		Message:      "Webhook deliveries retrieved",
		Data:         deliveries,
		ResponseTime: responseTime,
	})
}
