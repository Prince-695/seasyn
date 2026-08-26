package middleware

import (
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/gofiber/fiber/v2"
)

// RequireOrgRole is an RBAC middleware that ensures the requesting user has at least
// the specified role within the organization identified by the :orgID route param.
// Must be placed AFTER the Auth middleware so that c.Locals("userID") is set.
func RequireOrgRole(orgService ports.OrgService, minRole domain.OrgRole) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(string)
		if !ok || userID == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(domain.Response{
				Success: false,
				Error:   "UNAUTHORIZED",
				Message: "Authentication required.",
			})
		}

		orgID := c.Params("orgID")
		if orgID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(domain.Response{
				Success: false,
				Error:   "BAD_REQUEST",
				Message: "Organization ID is required.",
			})
		}

		role, err := orgService.GetMemberRole(c.Context(), userID, orgID)
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(domain.Response{
				Success: false,
				Error:   "FORBIDDEN",
				Message: "You are not a member of this organization.",
			})
		}

		if !orgRoleHasPermission(role, minRole) {
			return c.Status(fiber.StatusForbidden).JSON(domain.Response{
				Success: false,
				Error:   "FORBIDDEN",
				Message: "You do not have permission to perform this action.",
			})
		}

		// Store org role in context for handlers that need it
		c.Locals("orgRole", role)
		return c.Next()
	}
}

func orgRoleHasPermission(actual, required domain.OrgRole) bool {
	order := map[domain.OrgRole]int{
		domain.OrgRoleViewer: 0,
		domain.OrgRoleMember: 1,
		domain.OrgRoleAdmin:  2,
		domain.OrgRoleOwner:  3,
	}
	return order[actual] >= order[required]
}
