package handlers

import (
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type OrgHandler struct {
	orgService ports.OrgService
	validate   *validator.Validate
}

func NewOrgHandler(orgService ports.OrgService) *OrgHandler {
	return &OrgHandler{
		orgService: orgService,
		validate:   validator.New(),
	}
}

func (h *OrgHandler) jsonResponse(c *fiber.Ctx, status int, success bool, message string, data interface{}) error {
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

func (h *OrgHandler) RegisterRoutes(router fiber.Router, authMiddleware fiber.Handler, requireVerified fiber.Handler) {
	orgGroup := router.Group("/organizations")
	orgGroup.Use(authMiddleware, requireVerified)

	// Collection-level routes
	orgGroup.Post("/", h.CreateOrg)
	orgGroup.Get("/", h.ListMyOrgs)

	// Resource-level routes (require :orgID)
	orgGroup.Get("/:orgID", h.GetOrg)
	orgGroup.Put("/:orgID", h.UpdateOrg)
	orgGroup.Delete("/:orgID", h.DeleteOrg)

	// Member management
	orgGroup.Post("/:orgID/members", h.InviteMember)
	orgGroup.Get("/:orgID/members", h.ListMembers)
	orgGroup.Put("/:orgID/members/:userID/role", h.UpdateMemberRole)
	orgGroup.Delete("/:orgID/members/:userID", h.RemoveMember)
}

// CreateOrg godoc
// @Summary Create an Organization
// @Description Create a new organization. The caller becomes the owner.
// @Tags organizations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body domain.CreateOrgRequest true "Create Organization Request"
// @Success 201 {object} domain.Response{data=domain.Organization}
// @Failure 400 {object} domain.Response
// @Failure 401 {object} domain.Response
// @Router /v1/organizations [post]
func (h *OrgHandler) CreateOrg(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	var req domain.CreateOrgRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	org, err := h.orgService.CreateOrg(c.Context(), userID, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusCreated, true, "Organization created successfully", org)
}

// ListMyOrgs godoc
// @Summary List My Organizations
// @Description Returns all organizations the authenticated user belongs to
// @Tags organizations
// @Produce json
// @Security BearerAuth
// @Success 200 {object} domain.Response{data=[]domain.OrgWithRole}
// @Failure 401 {object} domain.Response
// @Router /v1/organizations [get]
func (h *OrgHandler) ListMyOrgs(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgs, err := h.orgService.ListUserOrgs(c.Context(), userID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusInternalServerError, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Organizations retrieved", orgs)
}

// GetOrg godoc
// @Summary Get Organization Details
// @Description Returns the details of a specific organization
// @Tags organizations
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Success 200 {object} domain.Response{data=domain.Organization}
// @Failure 403 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Router /v1/organizations/{orgID} [get]
func (h *OrgHandler) GetOrg(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	org, err := h.orgService.GetOrg(c.Context(), userID, orgID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Organization retrieved", org)
}

// UpdateOrg godoc
// @Summary Update Organization
// @Description Update the name and description of an organization. Requires Admin or Owner role.
// @Tags organizations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param request body domain.UpdateOrgRequest true "Update Organization Request"
// @Success 200 {object} domain.Response{data=domain.Organization}
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID} [put]
func (h *OrgHandler) UpdateOrg(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")

	var req domain.UpdateOrgRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	org, err := h.orgService.UpdateOrg(c.Context(), userID, orgID, req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Organization updated successfully", org)
}

// DeleteOrg godoc
// @Summary Delete Organization
// @Description Permanently delete an organization. Only the Owner can do this.
// @Tags organizations
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Success 200 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID} [delete]
func (h *OrgHandler) DeleteOrg(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	if err := h.orgService.DeleteOrg(c.Context(), userID, orgID); err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Organization deleted successfully", nil)
}

// InviteMember godoc
// @Summary Invite a Member
// @Description Invite a registered user to join the organization. Requires Admin or Owner role.
// @Tags organizations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param request body domain.InviteMemberRequest true "Invite Member Request"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/members [post]
func (h *OrgHandler) InviteMember(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")

	var req domain.InviteMemberRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	if err := h.orgService.InviteMember(c.Context(), userID, orgID, req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Member invited successfully", nil)
}

// ListMembers godoc
// @Summary List Organization Members
// @Description Returns all members of an organization. Requires membership.
// @Tags organizations
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Success 200 {object} domain.Response{data=[]domain.OrgMemberDetail}
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/members [get]
func (h *OrgHandler) ListMembers(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	members, err := h.orgService.ListMembers(c.Context(), userID, orgID)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Members retrieved", members)
}

// UpdateMemberRole godoc
// @Summary Update Member Role
// @Description Change a member's role within the organization. Requires Admin or Owner.
// @Tags organizations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param userID path string true "Target User ID"
// @Param request body domain.UpdateMemberRoleRequest true "Update Role Request"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/members/{userID}/role [put]
func (h *OrgHandler) UpdateMemberRole(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	targetUserID := c.Params("userID")

	var req domain.UpdateMemberRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	if err := h.orgService.UpdateMemberRole(c.Context(), userID, orgID, targetUserID, req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Member role updated successfully", nil)
}

// RemoveMember godoc
// @Summary Remove a Member
// @Description Remove a member from the organization. Requires Admin or Owner.
// @Tags organizations
// @Produce json
// @Security BearerAuth
// @Param orgID path string true "Organization ID"
// @Param userID path string true "Target User ID"
// @Success 200 {object} domain.Response
// @Failure 403 {object} domain.Response
// @Router /v1/organizations/{orgID}/members/{userID} [delete]
func (h *OrgHandler) RemoveMember(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	orgID := c.Params("orgID")
	targetUserID := c.Params("userID")

	if err := h.orgService.RemoveMember(c.Context(), userID, orgID, targetUserID); err != nil {
		return h.jsonResponse(c, fiber.StatusForbidden, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Member removed successfully", nil)
}
