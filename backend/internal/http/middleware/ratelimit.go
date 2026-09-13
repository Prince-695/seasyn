package middleware

import (
	"strings"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// RateLimit is an alias for RateLimitGeneral
func RateLimit() fiber.Handler {
	return RateLimitGeneral()
}

// RateLimitGeneral returns a Fiber middleware that limits general API requests to 120 per minute
// per authenticated user (falling back to client IP for unauthenticated requests).
// Exempts health check, swagger documentation, and CORS preflight requests.
func RateLimitGeneral() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        120,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			if userID, ok := c.Locals("userID").(string); ok && userID != "" {
				return "usr:" + userID
			}
			return "ip:" + c.IP()
		},
		Next: func(c *fiber.Ctx) bool {
			path := c.Path()
			return path == "/health" || strings.HasPrefix(path, "/swagger") || c.Method() == fiber.MethodOptions
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(domain.Response{
				Success: false,
				Error:   "Too many requests. Please try again later.",
			})
		},
	})
}

// RateLimitHeavy returns a Fiber middleware that restricts resource-intensive operations
// (like live database connection tests) to 10 requests per minute per user/IP.
func RateLimitHeavy() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			if userID, ok := c.Locals("userID").(string); ok && userID != "" {
				return "heavy:usr:" + userID
			}
			return "heavy:ip:" + c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(domain.Response{
				Success: false,
				Error:   "Connection test rate limit exceeded. Please wait before running another connection test.",
			})
		},
	})
}
