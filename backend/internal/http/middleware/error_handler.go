package middleware

import (
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/gofiber/fiber/v2"
)

// ErrorHandler is the global error handler for the Fiber application.
func ErrorHandler(c *fiber.Ctx, err error) error {
	// Default status and error info
	status := fiber.StatusInternalServerError
	code := "INTERNAL_SERVER_ERROR"
	message := "An unexpected error occurred"
	var details interface{}

	// Check if it's our custom AppError
	if e, ok := err.(*errors.AppError); ok {
		status = e.HTTPStatus
		code = e.Code
		message = e.Message
		details = e.Details
	} else if e, ok := err.(*fiber.Error); ok {
		// Handle standard Fiber errors (like 404 Not Found from router)
		status = e.Code
		message = e.Message
	}

	// Calculate response time
	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	// Return standardized response
	return c.Status(status).JSON(domain.Response{
		Success:      false,
		Message:      message,
		Error:        code,
		Data:         details,
		ResponseTime: responseTime,
	})
}
