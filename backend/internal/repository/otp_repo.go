package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"gorm.io/gorm"
)

type otpRepo struct {
	db *gorm.DB
}

func NewOTPRepository(db *gorm.DB) ports.OTPRepository {
	return &otpRepo{db: db}
}

func (r *otpRepo) Create(ctx context.Context, email, otp string, expiry time.Time) error {
	model := OTPModel{
		Email:     email,
		OTP:       otp,
		ExpiresAt: expiry,
	}
	return r.db.WithContext(ctx).Create(&model).Error
}

func (r *otpRepo) Verify(ctx context.Context, email, otp string) (bool, error) {
	var model OTPModel
	err := r.db.WithContext(ctx).Where("email = ? AND otp = ? AND expires_at > ?", email, otp, time.Now()).First(&model).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *otpRepo) DeleteByEmail(ctx context.Context, email string) error {
	return r.db.WithContext(ctx).Where("email = ?", email).Delete(&OTPModel{}).Error
}

func (r *userRepo) UpdatePassword(ctx context.Context, email, hashedPassword string) error {
	return r.db.WithContext(ctx).Model(&UserModel{}).Where("email = ?", email).Update("password_hash", hashedPassword).Error
}

func (r *userRepo) Update(ctx context.Context, u domain.User) (*domain.User, error) {
	model := UserModel{
		ID:         u.ID,
		Email:      u.Email,
		FirstName:  u.FirstName,
		LastName:   u.LastName,
		IsVerified: u.IsVerified,
	}
	if err := r.db.WithContext(ctx).Save(&model).Error; err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}
	return model.ToDomain(), nil
}
