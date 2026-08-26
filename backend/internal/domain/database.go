package domain

import "time"

// DBType names a database engine supported by SEASYN.
type DBType string

const (
	DBTypePostgres DBType = "postgres"
	DBTypeMySQL    DBType = "mysql"
	DBTypeMongoDB  DBType = "mongodb"
	DBTypeSQLite   DBType = "sqlite"
)

// DatabaseConnection represents database connection metadata attached to a project.
type DatabaseConnection struct {
	ID                string    `json:"id"`
	ProjectID         string    `json:"project_id"`
	Name              string    `json:"name"`
	DBType            DBType    `json:"db_type"`
	Host              string    `json:"host,omitempty"`
	Port              int       `json:"port,omitempty"`
	Database          string    `json:"database,omitempty"`
	Username          string    `json:"username,omitempty"`
	EncryptedPassword string    `json:"-"` // never exposed in JSON responses
	SSLMode           string    `json:"ssl_mode,omitempty"`
	FilePath          string    `json:"file_path,omitempty"` // For SQLite
	URI               string    `json:"-"`                   // Encrypted full connection string (e.g. for MongoDB)
	IsSource          bool      `json:"is_source"`           // true = source DB, false = target/replica DB
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// PublicDatabaseConnection omits sensitive encrypted password fields.
type PublicDatabaseConnection struct {
	ID        string    `json:"id"`
	ProjectID string    `json:"project_id"`
	Name      string    `json:"name"`
	DBType    DBType    `json:"db_type"`
	Host      string    `json:"host,omitempty"`
	Port      int       `json:"port,omitempty"`
	Database  string    `json:"database,omitempty"`
	Username  string    `json:"username,omitempty"`
	SSLMode   string    `json:"ssl_mode,omitempty"`
	FilePath  string    `json:"file_path,omitempty"`
	IsSource  bool      `json:"is_source"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (c *DatabaseConnection) ToPublic() PublicDatabaseConnection {
	return PublicDatabaseConnection{
		ID:        c.ID,
		ProjectID: c.ProjectID,
		Name:      c.Name,
		DBType:    c.DBType,
		Host:      c.Host,
		Port:      c.Port,
		Database:  c.Database,
		Username:  c.Username,
		SSLMode:   c.SSLMode,
		FilePath:  c.FilePath,
		IsSource:  c.IsSource,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}
}

// --- Connection Request & Diagnostic DTOs ---

type CreateConnectionRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=100" minLength:"2" maxLength:"100" example:"Production Aurora PG"`
	DBType   DBType `json:"db_type" validate:"required,oneof=postgres mysql mongodb sqlite" example:"postgres"`
	Host     string `json:"host" validate:"required_unless=DBType sqlite,omitempty,hostname|ip" example:"db.prod.internal"`
	Port     int    `json:"port" validate:"required_unless=DBType sqlite,omitempty,min=1,max=65535" example:"5432"`
	Database string `json:"database" validate:"required_unless=DBType sqlite,omitempty,min=1,max=100" example:"seasyn_db"`
	Username string `json:"username" validate:"required_unless=DBType sqlite,omitempty,min=1,max=100" example:"db_admin"`
	Password string `json:"password" validate:"required_unless=DBType sqlite,omitempty" example:"secret_db_pass"`
	SSLMode  string `json:"ssl_mode" validate:"omitempty,oneof=disable require verify-ca verify-full prefer" example:"require"`
	FilePath string `json:"file_path" validate:"required_if=DBType sqlite,omitempty" example:"/data/app.db"`
	URI      string `json:"uri" validate:"omitempty" example:"mongodb+srv://admin:pass@cluster.mongodb.net/app"`
	IsSource bool   `json:"is_source" example:"true"`
}

type UpdateConnectionRequest struct {
	Name     string `json:"name" validate:"required,min=2,max=100" minLength:"2" maxLength:"100" example:"Production Aurora PG Updated"`
	Host     string `json:"host" validate:"omitempty,hostname|ip" example:"db.prod.internal"`
	Port     int    `json:"port" validate:"omitempty,min=1,max=65535" example:"5432"`
	Database string `json:"database" validate:"omitempty,min=1,max=100" example:"seasyn_db"`
	Username string `json:"username" validate:"omitempty,min=1,max=100" example:"db_admin"`
	Password string `json:"password" validate:"omitempty" example:"new_secret_pass"`
	SSLMode  string `json:"ssl_mode" validate:"omitempty,oneof=disable require verify-ca verify-full prefer" example:"require"`
	FilePath string `json:"file_path" validate:"omitempty" example:"/data/app.db"`
	URI      string `json:"uri" validate:"omitempty" example:"mongodb+srv://admin:pass@cluster.mongodb.net/app"`
	IsSource *bool  `json:"is_source,omitempty" example:"true"`
}

type TestConnectionRequest struct {
	DBType   DBType `json:"db_type" validate:"required,oneof=postgres mysql mongodb sqlite" example:"postgres"`
	Host     string `json:"host" validate:"required_unless=DBType sqlite,omitempty" example:"db.prod.internal"`
	Port     int    `json:"port" validate:"required_unless=DBType sqlite,omitempty,min=1,max=65535" example:"5432"`
	Database string `json:"database" validate:"required_unless=DBType sqlite,omitempty" example:"seasyn_db"`
	Username string `json:"username" validate:"required_unless=DBType sqlite,omitempty" example:"db_admin"`
	Password string `json:"password" validate:"required_unless=DBType sqlite,omitempty" example:"secret_db_pass"`
	SSLMode  string `json:"ssl_mode" validate:"omitempty,oneof=disable require verify-ca verify-full prefer" example:"require"`
	FilePath string `json:"file_path" validate:"required_if=DBType sqlite,omitempty" example:"/data/app.db"`
	URI      string `json:"uri" validate:"omitempty" example:"mongodb+srv://admin:pass@cluster.mongodb.net/app"`
}

type ConnectionTestResult struct {
	Success      bool   `json:"success"`
	LatencyMs    int64  `json:"latency_ms"`
	ServerInfo   string `json:"server_info,omitempty"`
	ErrorMessage string `json:"error_message,omitempty"`
}
