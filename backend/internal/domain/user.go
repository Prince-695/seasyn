package domain

import (
	"time"
)

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username,omitempty"`
	Email        string    `json:"email"`
	FirstName    string    `json:"first_name"`
	LastName     string    `json:"last_name"`
	PasswordHash string    `json:"-"`
	IsVerified   bool      `json:"is_verified"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// PublicUser is a DTO that omits the internal database ID and sensitive fields
type PublicUser struct {
	Username   string    `json:"username,omitempty"`
	Email      string    `json:"email"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	IsVerified bool      `json:"is_verified"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type SignupRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=6"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	AccessToken  string     `json:"access_token"`
	RefreshToken string     `json:"refresh_token"`
	ExpiresAt    string     `json:"expires_at"`
	User         PublicUser `json:"user"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" validate:"required,email" example:"user@example.com"`
	OTP         string `json:"otp" validate:"required,len=6" minLength:"6" maxLength:"6" example:"123456"`
	NewPassword string `json:"new_password" validate:"required,min=6" minLength:"6" example:"newsecret123"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

type VerifyEmailRequest struct {
	OTP string `json:"otp" validate:"required,len=6" minLength:"6" maxLength:"6" example:"123456"`
}

type AuthStatusResponse struct {
	IsVerified bool `json:"is_verified"`
}

type UpdateProfileRequest struct {
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
}

type SetUsernameRequest struct {
	Username string `json:"username" validate:"required,min=3,max=20" minLength:"3" maxLength:"20" example:"johndoe_99"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// Response is the standard API response wrapper
type Response struct {
	Success      bool        `json:"success"`
	Message      string      `json:"message,omitempty"`
	AccessToken  string      `json:"access_token,omitempty"`
	Data         interface{} `json:"data,omitempty"`
	Error        string      `json:"error,omitempty"`
	ResponseTime string      `json:"response_time"`
}
