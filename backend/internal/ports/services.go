package ports

import (
	"context"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

type AuthService interface {
	Register(ctx context.Context, req domain.RegisterRequest) (*domain.User, error)
	Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error)
	ValidateToken(token string) (string, error)
}
