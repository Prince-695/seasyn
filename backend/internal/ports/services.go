package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

type AuthService interface {
	Signup(ctx context.Context, req domain.SignupRequest) (*domain.AuthResponse, error)
	Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error)
	ForgotPassword(ctx context.Context, req domain.ForgotPasswordRequest) error
	ResetPassword(ctx context.Context, req domain.ResetPasswordRequest) error
	Logout(ctx context.Context, accessToken, refreshToken string) error
	GetMe(ctx context.Context, userID string) (*domain.PublicUser, error)
	ValidateToken(token string) (string, error)
	GetOAuthURL(provider string) (string, error)
	HandleOAuthCallback(ctx context.Context, provider, code, state string) (*domain.AuthResponse, error)
}

type MailService interface {
	SendOTP(to, otp string) error
	SendWelcome(to, name string) error
}
