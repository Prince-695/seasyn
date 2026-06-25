package repository

import (
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserModel struct {
	ID           string         `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Username     *string        `gorm:"type:varchar(50);uniqueIndex"`
	Email        string         `gorm:"type:varchar(255);uniqueIndex;not null"`
	FirstName    string         `gorm:"type:varchar(255)"`
	LastName     string         `gorm:"type:varchar(255)"`
	PasswordHash string         `gorm:"type:varchar(255);not null"`
	IsVerified   bool           `gorm:"default:false"`
	CreatedAt    time.Time      `gorm:"autoCreateTime"`
	UpdatedAt    time.Time      `gorm:"autoUpdateTime"`
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

func (UserModel) TableName() string {
	return "users"
}

func (m *UserModel) ToDomain() *domain.User {
	var username string
	if m.Username != nil {
		username = *m.Username
	}
	return &domain.User{
		ID:           m.ID,
		Username:     username,
		Email:        m.Email,
		FirstName:    m.FirstName,
		LastName:     m.LastName,
		PasswordHash: m.PasswordHash,
		IsVerified:   m.IsVerified,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
}

func (base *UserModel) BeforeCreate(tx *gorm.DB) (err error) {
	if base.ID == "" {
		base.ID = uuid.NewString()
	}
	return
}

type OTPModel struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"index;not null"`
	OTP       string    `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (OTPModel) TableName() string {
	return "otps"
}
