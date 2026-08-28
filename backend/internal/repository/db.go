package repository

import (
	"context"
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// NewInternalDB opens the SEASYN metadata database and auto-migrates core models.
func NewInternalDB(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("internal db ping failed: %w", err)
	}

	if err := db.AutoMigrate(
		&UserModel{},
		&OTPModel{},
		&MigrationJobModel{},
		&AuditLogModel{},
		&WebhookModel{},
		&WebhookDeliveryModel{},
	); err != nil {
		return nil, fmt.Errorf("internal db auto-migrate failed: %w", err)
	}

	return db, nil
}
