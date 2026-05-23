package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

func ResponseTime() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Store start time in Locals so handlers can access it
		c.Locals("startTime", time.Now())

		// Chain to the next middleware/handler
		return c.Next()
	}
}
