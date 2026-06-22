package middleware

import (
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/gofiber/fiber/v2"
)

// Auth validates the JWT access token from either the Authorization header or the
// access_token HttpOnly cookie. The cookie is the primary transport; the header is
// the fallback for API clients (e.g. Swagger, curl).
//
// BUG-13 fix: all error responses now use domain.Response so the client always
// receives the same JSON shape, regardless of which middleware triggered the error.
func Auth(authService ports.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenString := extractToken(c)
		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(domain.Response{
				Success: false,
				Error:   "UNAUTHORIZED",
				Message: "Authentication required. Provide a Bearer token or a valid access_token cookie.",
			})
		}

		userID, err := authService.ValidateToken(tokenString)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(domain.Response{
				Success: false,
				Error:   "UNAUTHORIZED",
				Message: "Invalid or expired access token. Please refresh your session.",
			})
		}

		c.Locals("userID", userID)
		return c.Next()
	}
}

// extractToken reads the JWT from the Authorization header first, then falls back
// to the access_token HttpOnly cookie. Returns empty string if neither is present.
func extractToken(c *fiber.Ctx) string {
	// 1. Try Authorization: Bearer <token>
	authHeader := c.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" && parts[1] != "" {
			return parts[1]
		}
	}

	// 2. Swagger UI Isolation: If the request originates from Swagger UI,
	// do NOT fall back to cookies. This forces the user to explicitly use
	// the "Authorize" button in Swagger, and ensures that clicking "Logout"
	// in Swagger UI actually denies access, providing a strict testing environment.
	if strings.Contains(c.Get("Referer"), "/swagger/") {
		return ""
	}

	// 3. Fall back to HttpOnly cookie (the primary transport for browser clients)
	return c.Cookies("access_token")
}
