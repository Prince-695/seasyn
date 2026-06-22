package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"gorm.io/gorm"
)

type userRepo struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) ports.UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) Create(ctx context.Context, u domain.User) (*domain.User, error) {
	model := UserModel{
		Email:        u.Email,
		FirstName:    u.FirstName,
		LastName:     u.LastName,
		PasswordHash: u.PasswordHash,
		IsVerified:   u.IsVerified,
	}
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return model.ToDomain(), nil
}

// GetByEmail returns a typed AppError (404) when the user is not found so callers
// can distinguish "not found" from real database failures (BUG-16 fix).
func (r *userRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var model UserModel
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&model).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperrors.NotFound("user")
	}
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return model.ToDomain(), nil
}

// GetByID returns a typed AppError (404) when the user is not found.
func (r *userRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	var model UserModel
	err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, apperrors.NotFound("user")
	}
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return model.ToDomain(), nil
}
