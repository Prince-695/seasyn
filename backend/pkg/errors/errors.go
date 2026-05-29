package errors

import (
	"fmt"
)

// AppError is the standard machine-readable error type for SEASYN.
type AppError struct {
	HTTPStatus int         `json:"-"`
	Code       string      `json:"error_code"`
	Message    string      `json:"message"`
	Details    interface{} `json:"details,omitempty"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// New creates a new AppError.
func New(status int, code, message string) *AppError {
	return &AppError{
		HTTPStatus: status,
		Code:       code,
		Message:    message,
	}
}

// Common Error Factory Functions
func BadRequest(message string) *AppError {
	return New(400, "BAD_REQUEST", message)
}

func Unauthorized(message string) *AppError {
	return New(401, "UNAUTHORIZED", message)
}

func Forbidden(message string) *AppError {
	return New(403, "FORBIDDEN", message)
}

func NotFound(message string) *AppError {
	return New(404, "NOT_FOUND", message)
}

func Internal(message string) *AppError {
	return New(500, "INTERNAL_SERVER_ERROR", message)
}
