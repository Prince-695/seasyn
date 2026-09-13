package middleware

import (
	"errors"
	"strings"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/gofiber/fiber/v2"
)

// Auth validates the JWT access token from either the Authorization header or the
// access_token HttpOnly cookie. The cookie is the primary transport; the header is
// the fallback for API clients (e.g. Swagger, curl).
//
// If the access token is missing or expired, it automatically attempts an internal
// sliding refresh using the refresh token from the HttpOnly cookie or X-Refresh-Token header.
// If refresh succeeds, it updates the cookies with root scope (Path: "/"), sets response
// headers (X-Access-Token, X-Refresh-Token), and proceeds with the request.
func Auth(authService ports.AuthService, isProduction ...bool) fiber.Handler {
	prod := len(isProduction) > 0 && isProduction[0]

	return func(c *fiber.Ctx) error {
		tokenString := extractToken(c)

		var userID string
		var err error

		if tokenString != "" {
			userID, err = authService.ValidateToken(tokenString)
		} else {
			err = errors.New("missing access token")
		}

		if err != nil {
			// Try automatic refresh via HttpOnly cookie or X-Refresh-Token header
			refreshToken := c.Cookies("refresh_token")
			if refreshToken == "" {
				refreshToken = c.Get("X-Refresh-Token")
			}

			if refreshToken != "" {
				authRes, refreshErr := authService.RefreshToken(c.Context(), refreshToken)
				if refreshErr == nil {
					// Securely parse duration
					expiresAt, parseErr := time.Parse(time.RFC3339, authRes.ExpiresAt)
					if parseErr != nil {
						expiresAt = time.Now().Add(30 * time.Minute)
					}

					// Proxy-aware HTTPS detection (Render terminates TLS at edge)
					isSecure := prod || c.Get("X-Forwarded-Proto") == "https" || c.Protocol() == "https"

					sameSite := "Lax"
					if isSecure {
						sameSite = "None"
					}

					// Set response headers for Swagger UI, mobile, or CLI clients
					c.Set("X-Access-Token", authRes.AccessToken)
					c.Set("X-Refresh-Token", authRes.RefreshToken)

					// Set the new access token cookie with root Path
					c.Cookie(&fiber.Cookie{
						Name:     "access_token",
						Value:    authRes.AccessToken,
						Path:     "/",
						Expires:  expiresAt,
						HTTPOnly: true,
						Secure:   isSecure,
						SameSite: sameSite,
					})

					// Set the new refresh token cookie with root Path (sliding 7 days)
					c.Cookie(&fiber.Cookie{
						Name:     "refresh_token",
						Value:    authRes.RefreshToken,
						Path:     "/",
						Expires:  time.Now().Add(7 * 24 * time.Hour),
						HTTPOnly: true,
						Secure:   isSecure,
						SameSite: sameSite,
					})

					// Re-validate the newly generated access token to get the internal userID
					userID, err = authService.ValidateToken(authRes.AccessToken)
				}
			}

			// If error is still not nil (refresh failed or was missing)
			if err != nil {
				return c.Status(fiber.StatusUnauthorized).JSON(domain.Response{
					Success: false,
					Error:   "UNAUTHORIZED",
					Message: "Invalid or expired access token. Please log in again.",
				})
			}
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

// RequireVerified is a strict middleware that ensures the user has a verified email.
// It must be used AFTER the Auth middleware.
func RequireVerified(authService ports.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID")
		if userID == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(domain.Response{
				Success: false,
				Error:   "UNAUTHORIZED",
				Message: "Authentication required.",
			})
		}

		user, err := authService.GetMe(c.Context(), userID.(string))
		if err != nil || user == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(domain.Response{
				Success: false,
				Error:   "UNAUTHORIZED",
				Message: "User not found.",
			})
		}

		if !user.IsVerified {
			return c.Status(fiber.StatusForbidden).JSON(domain.Response{
				Success: false,
				Error:   "FORBIDDEN",
				Message: "Email verification required. Please verify your email to access this resource.",
			})
		}

		return c.Next()
	}
}
