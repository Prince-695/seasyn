package ports

import (
	"context"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, u domain.User) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, id string) (*domain.User, error)
	Update(ctx context.Context, u domain.User) (*domain.User, error)
	UpdatePassword(ctx context.Context, email, hashedPassword string) error
}

type OTPRepository interface {
	Create(ctx context.Context, email, otp string, expiry time.Time) error
	Verify(ctx context.Context, email, otp string) (bool, error)
	DeleteByEmail(ctx context.Context, email string) error
}
