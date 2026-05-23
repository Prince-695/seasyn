package ports

import (
	"context"
	"github.com/Prince-695/seasyn/backend/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, u domain.User) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	GetByID(ctx context.Context, id string) (*domain.User, error)
}
