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
	ChangePassword(ctx context.Context, userID string, req domain.ChangePasswordRequest) error
	SendOTP(ctx context.Context, userID string) error
	VerifyEmail(ctx context.Context, userID string, otp string) error
	Logout(ctx context.Context, accessToken, refreshToken string) error
	GetMe(ctx context.Context, userID string) (*domain.PublicUser, error)
	ValidateToken(token string) (string, error)
	GetOAuthURL(provider string) (string, error)
	HandleOAuthCallback(ctx context.Context, provider, code, state string) (*domain.AuthResponse, error)
}

type UsersService interface {
	GetMe(ctx context.Context, userID string) (*domain.PublicUser, error)
	CheckUsername(ctx context.Context, username string) (bool, error)
	SetUsername(ctx context.Context, userID, username string) error
	UpdateProfile(ctx context.Context, userID string, req domain.UpdateProfileRequest) (*domain.PublicUser, error)
}

type MailService interface {
	SendEmailVerificationOTP(to, otp string) error
	SendPasswordResetOTP(to, otp string) error
	SendWelcome(to, name string) error
}
