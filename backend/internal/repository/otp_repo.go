package repository

import (
	"context"
	"crypto/sha256"
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

// hashOTP returns the hex-encoded SHA-256 of the OTP string.
// BUG-09 fix: storing a plain-text OTP means a database leak exposes all
// active password-reset codes. We hash before storing so the raw OTP is
// never at rest in the database.
func hashOTP(otp string) string {
	sum := sha256.Sum256([]byte(otp))
	return fmt.Sprintf("%x", sum)
}

// Create hashes the OTP before persisting it.
func (r *otpRepo) Create(ctx context.Context, email, otp string, expiry time.Time) error {
	model := OTPModel{
		Email:     email,
		OTP:       hashOTP(otp), // store hash, never the raw value
		ExpiresAt: expiry,
	}
	return r.db.WithContext(ctx).Create(&model).Error
}

// Verify hashes the incoming OTP and compares it to the stored hash.
func (r *otpRepo) Verify(ctx context.Context, email, otp string) (bool, error) {
	var model OTPModel
	err := r.db.WithContext(ctx).
		Where("email = ? AND otp = ? AND expires_at > ?", email, hashOTP(otp), time.Now()).
		First(&model).Error
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

// UpdatePassword is safe: it only touches the password_hash column.
func (r *userRepo) UpdatePassword(ctx context.Context, email, hashedPassword string) error {
	return r.db.WithContext(ctx).
		Model(&UserModel{}).
		Where("email = ?", email).
		Update("password_hash", hashedPassword).Error
}

// Update uses selective column updates so that fields not present in the domain
// struct (e.g. PasswordHash) are never accidentally overwritten to their zero value.
// BUG-15 fix: the previous implementation used db.Save() which performs a
// full-record update and would wipe the password_hash column.
func (r *userRepo) Update(ctx context.Context, u domain.User) (*domain.User, error) {
	updates := map[string]any{
		"email":      u.Email,
		"first_name": u.FirstName,
		"last_name":  u.LastName,
		"is_verified": u.IsVerified,
	}
	if err := r.db.WithContext(ctx).
		Model(&UserModel{}).
		Where("id = ?", u.ID).
		Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update user: %w", err)
	}
	return r.GetByID(ctx, u.ID)
}
