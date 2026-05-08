package repository

import "time"

// UserModel is the GORM model for the users table.
type UserModel struct {
	ID           string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Email        string    `gorm:"type:varchar(255);uniqueIndex;not null"`
	PasswordHash string    `gorm:"type:varchar(255);not null"`
	CreatedAt    time.Time `gorm:"not null;autoCreateTime"`
}

// ProjectModel is the GORM model for the projects table.
type ProjectModel struct {
	ID          string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID      string    `gorm:"type:uuid;not null;index"`
	Name        string    `gorm:"type:varchar(255);not null"`
	Description string    `gorm:"type:text;not null;default:''"`
	CreatedAt   time.Time `gorm:"not null;autoCreateTime"`
	UpdatedAt   time.Time `gorm:"not null;autoUpdateTime"`
}

// MigrationJobModel is the GORM model for the migration_jobs table.
type MigrationJobModel struct {
	ID             string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ProjectID      string     `gorm:"type:uuid;not null;index"`
	SourceDBType   string     `gorm:"type:varchar(50);not null"`
	SourceHost     string     `gorm:"type:varchar(255)"`
	SourceDatabase string     `gorm:"type:varchar(255)"`
	SourceTable    string     `gorm:"type:varchar(255);not null"`
	DestDBType     string     `gorm:"type:varchar(50);not null"`
	DestHost       string     `gorm:"type:varchar(255)"`
	DestDatabase   string     `gorm:"type:varchar(255)"`
	DestTable      string     `gorm:"type:varchar(255);not null"`
	BatchSize      int        `gorm:"not null;default:500"`
	State          string     `gorm:"type:varchar(50);not null;default:'pending'"`
	TotalRows      int64      `gorm:"not null;default:0"`
	MigratedRows   int64      `gorm:"not null;default:0"`
	ErrorMessage   string     `gorm:"type:text"`
	StartedAt      *time.Time `gorm:"type:timestamptz"`
	CompletedAt    *time.Time `gorm:"type:timestamptz"`
	CreatedAt      time.Time  `gorm:"not null;autoCreateTime"`
}
