# SEASYN — Backend Implementation Plan

**Language:** Go 1.22+  
**Architecture:** Clean Architecture + Dependency Injection  
**Internal DB ORM:** GORM for SEASYN-owned PostgreSQL metadata  
**Phases:** 4 (MVP → Production-Ready)

---

## How to Read This Document

Every step is written as a **baby step** — a single, testable unit of work. Each step tells you:
- **What to do** — the exact action
- **Why** — the reason this step exists
- **How to verify** — how you know it worked before moving on

Do not skip steps. Do not combine steps unless they are explicitly grouped. The order matters.

---

## Phase 1 — Project Skeleton & Infrastructure

**Goal:** A running Go HTTP server with a health endpoint, connected to SEASYN's internal database, with DI wiring in place and the folder structure established.

---

### Step 1.1 — Initialize the Go module

**What:** Create the project folder and run `go mod init`.

```bash
mkdir seasyn-backend
cd seasyn-backend
go mod init github.com/yourusername/seasyn-backend
```

**Why:** Every Go project needs a module root. This is the foundation everything else builds on.

**Verify:** A `go.mod` file exists with your module path at the top.

---

### Step 1.2 — Create the folder structure

**What:** Create all the directories that the project needs. Create them empty — files come later.

```bash
mkdir -p cmd/server
mkdir -p internal/adapters/postgres
mkdir -p internal/adapters/mongodb
mkdir -p internal/adapters/mysql
mkdir -p internal/adapters/registry
mkdir -p internal/domain
mkdir -p internal/ports
mkdir -p internal/services/migration
mkdir -p internal/services/editor
mkdir -p internal/services/project
mkdir -p internal/services/auth
mkdir -p internal/repository
mkdir -p internal/http/handlers
mkdir -p internal/http/middleware
mkdir -p internal/config
mkdir -p pkg/crypto
mkdir -p pkg/logger
mkdir -p pkg/errors
mkdir -p pkg/validator
mkdir -p migrations
```

**Why:** Having the full structure from the start means you know exactly where every new file goes. It prevents messy reorganization later.

**Verify:** Run `find . -type d` and confirm the folders exist.

---

### Step 1.3 — Install core dependencies

**What:** Add the Go packages you need.

```bash
go get github.com/gofiber/fiber/v2          # HTTP framework
go get gorm.io/gorm                         # ORM for SEASYN's internal metadata DB
go get gorm.io/driver/postgres              # GORM PostgreSQL driver
go get github.com/jmoiron/sqlx              # Low-level SQL helper for user DB adapters
go get github.com/jackc/pgx/v5              # PostgreSQL driver
go get go.mongodb.org/mongo-driver/mongo    # MongoDB driver
go get github.com/golang-jwt/jwt/v5         # JWT
go get go.uber.org/zap                      # Structured logging
go get github.com/joho/godotenv             # .env file loading
go get golang.org/x/crypto                  # bcrypt for passwords
go get github.com/go-playground/validator/v10  # Struct validation
go get github.com/golang-migrate/migrate/v4 # DB migrations
```

**Why:** Pinning these now keeps your `go.sum` deterministic and avoids "works on my machine" problems.

**Verify:** `go mod tidy` runs without error. `go.sum` file is created.

---

### Step 1.4 — Write the config loader

**What:** Create `internal/config/config.go` that reads all environment variables into a typed struct.

```go
// internal/config/config.go
package config

import (
    "os"
    "strconv"
)

type Config struct {
    Port                    string
    Env                     string
    DatabaseURL             string
    JWTSecret               string
    EncryptionKey           string
    LogLevel                string
    AllowedOrigins          string
    DefaultBatchSize        int
    MaxConcurrentMigrations int
}

func Load() *Config {
    return &Config{
        Port:                    getEnv("PORT", "8080"),
        Env:                     getEnv("ENV", "development"),
        DatabaseURL:             mustGetEnv("DATABASE_URL"),
        JWTSecret:               mustGetEnv("JWT_SECRET"),
        EncryptionKey:           mustGetEnv("ENCRYPTION_KEY"),
        LogLevel:                getEnv("LOG_LEVEL", "info"),
        AllowedOrigins:          getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
        DefaultBatchSize:        getEnvInt("DEFAULT_BATCH_SIZE", 500),
        MaxConcurrentMigrations: getEnvInt("MAX_CONCURRENT_MIGRATIONS", 5),
    }
}

func getEnv(key, fallback string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return fallback
}

func mustGetEnv(key string) string {
    v := os.Getenv(key)
    if v == "" {
        panic("required environment variable not set: " + key)
    }
    return v
}

func getEnvInt(key string, fallback int) int {
    v := os.Getenv(key)
    if v == "" {
        return fallback
    }
    i, err := strconv.Atoi(v)
    if err != nil {
        return fallback
    }
    return i
}
```

**Why:** Centralizing config in one struct means you never use `os.Getenv` scattered throughout the codebase. Missing required variables panic at startup, not mid-request.

**Verify:** Write a simple test that calls `config.Load()` with env vars set and checks the struct fields.

---

### Step 1.5 — Write the logger wrapper

**What:** Create `pkg/logger/logger.go` that wraps Zap and returns a simple interface.

```go
// pkg/logger/logger.go
package logger

import (
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

type Logger interface {
    Info(msg string, fields ...zap.Field)
    Warn(msg string, fields ...zap.Field)
    Error(msg string, fields ...zap.Field)
    Debug(msg string, fields ...zap.Field)
    With(fields ...zap.Field) Logger
}

type zapLogger struct {
    z *zap.Logger
}

func New(level string) Logger {
    var lvl zapcore.Level
    _ = lvl.UnmarshalText([]byte(level))

    cfg := zap.NewProductionConfig()
    cfg.Level = zap.NewAtomicLevelAt(lvl)
    z, _ := cfg.Build()
    return &zapLogger{z: z}
}

func (l *zapLogger) Info(msg string, fields ...zap.Field)  { l.z.Info(msg, fields...) }
func (l *zapLogger) Warn(msg string, fields ...zap.Field)  { l.z.Warn(msg, fields...) }
func (l *zapLogger) Error(msg string, fields ...zap.Field) { l.z.Error(msg, fields...) }
func (l *zapLogger) Debug(msg string, fields ...zap.Field) { l.z.Debug(msg, fields...) }
func (l *zapLogger) With(fields ...zap.Field) Logger {
    return &zapLogger{z: l.z.With(fields...)}
}
```

**Why:** Wrapping Zap behind an interface means you can inject a mock logger in tests, and swap the logging library later without touching every file.

**Verify:** Import and call `logger.New("info").Info("hello")` in a `_test.go` file.

---

### Step 1.6 — Write the error types

**What:** Create `pkg/errors/errors.go` with your application error type.

```go
// pkg/errors/errors.go
package errors

import "fmt"

type AppError struct {
    Code    string
    Message string
    Status  int
    Err     error
}

func (e *AppError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("%s: %v", e.Message, e.Err)
    }
    return e.Message
}

func (e *AppError) Unwrap() error { return e.Err }

func New(code, message string, status int) *AppError {
    return &AppError{Code: code, Message: message, Status: status}
}

func Wrap(code, message string, status int, err error) *AppError {
    return &AppError{Code: code, Message: message, Status: status, Err: err}
}

// Common error constructors
func NotFound(entity string) *AppError {
    return New("NOT_FOUND", entity+" not found", 404)
}

func Unauthorized() *AppError {
    return New("UNAUTHORIZED", "authentication required", 401)
}

func BadRequest(msg string) *AppError {
    return New("BAD_REQUEST", msg, 400)
}

func Internal(err error) *AppError {
    return Wrap("INTERNAL_ERROR", "an internal error occurred", 500, err)
}
```

**Why:** Typed errors with codes let the HTTP layer respond with the right status and the right JSON without any string matching.

**Verify:** Write unit tests for each constructor confirming `Status`, `Code`, and `Error()` string.

---

### Step 1.7 — Write the domain types

**What:** Create the core domain entity files. These are pure Go structs with no imports from infrastructure.

Create `internal/domain/database.go`:

```go
package domain

type DBType string

const (
    DBTypePostgres DBType = "postgres"
    DBTypeMongo    DBType = "mongodb"
    DBTypeMySQL    DBType = "mysql"
    DBTypeSQLite   DBType = "sqlite"
)

type ConnectionConfig struct {
    Type             DBType            `json:"type"`
    Host             string            `json:"host"`
    Port             int               `json:"port"`
    Database         string            `json:"database"`
    Username         string            `json:"username"`
    Password         string            `json:"password"`
    ConnectionString string            `json:"connection_string"`
    SSLMode          string            `json:"ssl_mode"`
    Options          map[string]string `json:"options"`
}

type SeasonType string

const (
    SeasonTypeString    SeasonType = "string"
    SeasonTypeInt       SeasonType = "int"
    SeasonTypeFloat     SeasonType = "float"
    SeasonTypeBool      SeasonType = "bool"
    SeasonTypeTimestamp SeasonType = "timestamp"
    SeasonTypeJSON      SeasonType = "json"
    SeasonTypeBinary    SeasonType = "binary"
    SeasonTypeArray     SeasonType = "array"
    SeasonTypeDecimal   SeasonType = "decimal"
)

type Schema struct {
    DBType DBType
    Tables []TableSchema
}

type TableSchema struct {
    Name        string
    Columns     []ColumnSchema
    PrimaryKeys []string
    RowCount    int64
}

type ColumnSchema struct {
    Name       string
    DataType   string
    SeasonType SeasonType
    Nullable   bool
    Default    *string
    MaxLength  *int
    IsPrimary  bool
}
```

Create `internal/domain/migration.go`:

```go
package domain

import "time"

type MigrationJob struct {
    ID          string
    ProjectID   string
    SourceConn  ConnectionConfig
    DestConn    ConnectionConfig
    SourceTable string
    DestTable   string
    BatchSize   int
    Options     MigrationOptions
    Status      MigrationStatus
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type MigrationOptions struct {
    TruncateDestination bool
    CreateIfNotExists   bool
    SchemaMapping       map[string]string
    TypeOverrides       map[string]string
}

type MigrationStatus struct {
    State        string
    TotalRows    int64
    MigratedRows int64
    ErrorMessage string
    StartedAt    *time.Time
    CompletedAt  *time.Time
}

type RowBatch struct {
    Index int
    Rows  []map[string]any
}

type QueryRequest struct {
    Table   string
    Filters map[string]any
    Limit   int
    Offset  int
    OrderBy string
    OrderDir string
}

type QueryResult struct {
    Columns    []string
    Rows       []map[string]any
    TotalCount int64
}

type InsertRequest struct {
    Table string
    Row   map[string]any
}

type UpdateRequest struct {
    Table  string
    Filter map[string]any
    Row    map[string]any
}

type DeleteRequest struct {
    Table  string
    Filter map[string]any
}
```

Create `internal/domain/project.go`:

```go
package domain

import "time"

type Project struct {
    ID          string
    UserID      string
    Name        string
    Description string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type User struct {
    ID           string
    Email        string
    PasswordHash string
    CreatedAt    time.Time
}
```

**Why:** Domain types have zero external dependencies. They are the language of your application. All other layers speak in these types.

**Verify:** Run `go build ./internal/domain/...` — should compile with no errors.

---

### Step 1.8 — Define all port interfaces

**What:** Create `internal/ports/` files defining every interface in the system.

```go
// internal/ports/database.go
package ports

import (
    "context"
    "github.com/yourusername/seasyn-backend/internal/domain"
)

type DatabaseAdapter interface {
    Connect(ctx context.Context, cfg domain.ConnectionConfig) (DatabaseConnection, error)
}

type DatabaseConnection interface {
    Ping(ctx context.Context) error
    GetSchema(ctx context.Context) (*domain.Schema, error)
    ListTables(ctx context.Context) ([]domain.TableSchema, error)
    QueryRows(ctx context.Context, req domain.QueryRequest) (*domain.QueryResult, error)
    InsertRow(ctx context.Context, req domain.InsertRequest) error
    UpdateRow(ctx context.Context, req domain.UpdateRequest) error
    DeleteRow(ctx context.Context, req domain.DeleteRequest) error
    StreamRows(ctx context.Context, table string, batchSize int) (<-chan domain.RowBatch, <-chan error)
    BulkInsert(ctx context.Context, table string, rows []map[string]any) error
    Close() error
}
```

```go
// internal/ports/repository.go
package ports

import (
    "context"
    "github.com/yourusername/seasyn-backend/internal/domain"
)

type ProjectRepository interface {
    Create(ctx context.Context, p domain.Project) (*domain.Project, error)
    GetByID(ctx context.Context, id string) (*domain.Project, error)
    ListByUser(ctx context.Context, userID string) ([]domain.Project, error)
    Update(ctx context.Context, p domain.Project) (*domain.Project, error)
    Delete(ctx context.Context, id string) error
}

type MigrationRepository interface {
    Create(ctx context.Context, job domain.MigrationJob) (*domain.MigrationJob, error)
    GetByID(ctx context.Context, id string) (*domain.MigrationJob, error)
    ListByProject(ctx context.Context, projectID string) ([]domain.MigrationJob, error)
    UpdateStatus(ctx context.Context, id string, status domain.MigrationStatus) error
}

type UserRepository interface {
    Create(ctx context.Context, u domain.User) (*domain.User, error)
    GetByEmail(ctx context.Context, email string) (*domain.User, error)
    GetByID(ctx context.Context, id string) (*domain.User, error)
}
```

```go
// internal/ports/logger.go
package ports

import "go.uber.org/zap"

type Logger interface {
    Info(msg string, fields ...zap.Field)
    Warn(msg string, fields ...zap.Field)
    Error(msg string, fields ...zap.Field)
    Debug(msg string, fields ...zap.Field)
    With(fields ...zap.Field) Logger
}
```

**Why:** Interfaces in `ports` are the contracts. Nothing in `services` or `http` depends on concrete types — only these interfaces. This is what makes the DI possible and the tests easy.

**Verify:** `go build ./internal/ports/...` compiles cleanly.

---

### Step 1.9 — Write the internal database connection with GORM (SEASYN's own Postgres)

**What:** Create `internal/repository/db.go` that connects to SEASYN's internal database (not user databases) using GORM.

```go
// internal/repository/db.go
package repository

import (
    "context"
    "fmt"
    "time"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

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

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := sqlDB.PingContext(ctx); err != nil {
        return nil, fmt.Errorf("internal db ping failed: %w", err)
    }
    return db, nil
}
```

**Why:** SEASYN needs its own database for storing user accounts, project metadata, and migration history. GORM is used only for this internal metadata database because those tables are normal application records. User-provided databases still use adapters and lower-level drivers.

**Verify:** Call `NewInternalDB` with a real Postgres URL in a test (use Docker). It should ping successfully.

---

### Step 1.10 — Write SEASYN's DB migrations

**What:** Create the SQL migration files for SEASYN's own tables, and create matching GORM model structs in `internal/repository/models.go`.

```sql
-- migrations/001_create_users.sql
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrations/002_create_projects.sql
CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- migrations/003_create_migration_jobs.sql
CREATE TABLE IF NOT EXISTS migration_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_db_type  VARCHAR(50) NOT NULL,
    source_host     VARCHAR(255),
    source_database VARCHAR(255),
    source_table    VARCHAR(255) NOT NULL,
    dest_db_type    VARCHAR(50) NOT NULL,
    dest_host       VARCHAR(255),
    dest_database   VARCHAR(255),
    dest_table      VARCHAR(255) NOT NULL,
    batch_size      INTEGER NOT NULL DEFAULT 500,
    state           VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_rows      BIGINT DEFAULT 0,
    migrated_rows   BIGINT DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Why:** Migrations are version-controlled schema changes. Each file represents one atomic change. Never edit existing migration files once applied — always add new ones.

GORM models are the Go-side shape of those same internal tables. They are used by repositories to read/write metadata, while domain structs remain clean business objects.

**Verify:** Run `golang-migrate` against your local Postgres and confirm tables are created.

---

### Step 1.11 — Write the health endpoint and main.go skeleton

**What:** Create a minimal `cmd/server/main.go` with a single `GET /health` endpoint, logging, and config wired up.

```go
// cmd/server/main.go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/joho/godotenv"
    "github.com/yourusername/seasyn-backend/internal/config"
    "github.com/yourusername/seasyn-backend/pkg/logger"
    "go.uber.org/zap"
)

func main() {
    _ = godotenv.Load()

    cfg := config.Load()
    log := logger.New(cfg.LogLevel)

    app := fiber.New(fiber.Config{
        ErrorHandler: errorHandler(log),
    })

    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{"status": "ok", "version": "1.0.0"})
    })

    log.Info("server starting", zap.String("port", cfg.Port))
    if err := app.Listen(":" + cfg.Port); err != nil {
        log.Error("server failed", zap.Error(err))
    }
}

func errorHandler(log ports.Logger) fiber.ErrorHandler {
    return func(c *fiber.Ctx, err error) error {
        // Convert AppError to JSON response
        // ...
        return nil
    }
}
```

**Why:** Getting a running server at Step 1 (even with just health check) means you can verify your whole infrastructure chain works before building application logic on top of it.

**Verify:** `go run ./cmd/server/main.go` starts. `curl http://localhost:8080/health` returns `{"status":"ok"}`.

---

## Phase 2 — Auth + Project Management

**Goal:** Working user registration, login with JWT, and full project CRUD. No database adapters yet — just SEASYN's own data.

---

### Step 2.1 — Implement UserRepository

**What:** Create `internal/repository/user_repo.go` implementing `ports.UserRepository` using GORM.

```go
type userRepo struct {
    db  *gorm.DB
    log ports.Logger
}

func NewUserRepository(db *gorm.DB, log ports.Logger) ports.UserRepository {
    return &userRepo{db: db, log: log}
}

func (r *userRepo) Create(ctx context.Context, u domain.User) (*domain.User, error) {
    model := UserModel{Email: u.Email, PasswordHash: u.PasswordHash}
    if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
        return nil, fmt.Errorf("create user: %w", err)
    }
    u.ID = model.ID
    u.CreatedAt = model.CreatedAt
    return &u, nil
}

func (r *userRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
    var model UserModel
    err := r.db.WithContext(ctx).Where("email = ?", email).First(&model).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, apperrors.NotFound("user")
    }
    return model.ToDomain(), err
}

func (r *userRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
    var model UserModel
    err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error
    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, apperrors.NotFound("user")
    }
    return model.ToDomain(), err
}
```

**Why:** The repository is the only code that knows about internal database persistence. Services call the interface — they never write GORM queries directly.

**Verify:** Integration test: create a user → get by email → confirm fields match.

---

### Step 2.2 — Implement AuthService

**What:** Create `internal/services/auth/service.go` with `Register`, `Login`, `RefreshToken`, and `ValidateToken` methods.

```go
type AuthService struct {
    userRepo  ports.UserRepository
    jwtSecret string
    log       ports.Logger
}

func NewAuthService(userRepo ports.UserRepository, jwtSecret string, log ports.Logger) *AuthService {
    return &AuthService{userRepo: userRepo, jwtSecret: jwtSecret, log: log}
}

func (s *AuthService) Register(ctx context.Context, email, password string) (*domain.User, error) {
    // 1. Check email not already taken
    // 2. Hash password with bcrypt (cost 12)
    // 3. Create user via repo
    // 4. Return user (without password hash)
}

func (s *AuthService) Login(ctx context.Context, email, password string) (accessToken string, err error) {
    // 1. Get user by email
    // 2. Compare bcrypt hash
    // 3. Generate JWT with user ID as subject, 15-minute expiry
    // 4. Return token
}

func (s *AuthService) ValidateToken(tokenString string) (userID string, err error) {
    // Parse and validate JWT, return user ID from claims
}
```

**Why:** Auth logic is isolated. The HTTP handler just calls `Login()` — it doesn't know about bcrypt or JWTs.

**Verify:** Unit tests for register (happy path, duplicate email), login (valid creds, wrong password, wrong email), token validation.

---

### Step 2.3 — Implement JWT middleware

**What:** Create `internal/http/middleware/auth.go` that validates the JWT on every protected request.

```go
func Auth(authSvc *auth.AuthService) fiber.Handler {
    return func(c *fiber.Ctx) error {
        header := c.Get("Authorization")
        if !strings.HasPrefix(header, "Bearer ") {
            return apperrors.Unauthorized()
        }
        token := strings.TrimPrefix(header, "Bearer ")
        userID, err := authSvc.ValidateToken(token)
        if err != nil {
            return apperrors.Unauthorized()
        }
        c.Locals("userID", userID)
        return c.Next()
    }
}
```

**Why:** Middleware validates the token and injects `userID` into request context. Handlers read `c.Locals("userID")` — they don't parse tokens.

**Verify:** Test with a valid token → passes. Expired token → 401. Missing header → 401. Tampered token → 401.

---

### Step 2.4 — Implement auth HTTP handlers

**What:** Create `internal/http/handlers/auth_handler.go` with `POST /api/v1/auth/register` and `POST /api/v1/auth/login`.

Each handler:
1. Parses and validates the request body
2. Calls the service
3. Returns JSON or an error

**Why:** Handlers are thin. They do input → service → output. No business logic lives here.

**Verify:** Use `curl` or httptest to hit both endpoints and verify responses.

---

### Step 2.5 — Implement ProjectRepository

**What:** Create `internal/repository/project_repo.go` implementing `ports.ProjectRepository`.

Implement: `Create`, `GetByID`, `ListByUser`, `Update`, `Delete`. Each uses GORM against the `projects` table.

**Verify:** Integration tests against real Postgres (Docker).

---

### Step 2.6 — Implement ProjectService

**What:** Create `internal/services/project/service.go`.

```go
type ProjectService struct {
    repo ports.ProjectRepository
    log  ports.Logger
}

func (s *ProjectService) Create(ctx context.Context, userID, name, description string) (*domain.Project, error) {
    if strings.TrimSpace(name) == "" {
        return nil, apperrors.BadRequest("project name cannot be empty")
    }
    return s.repo.Create(ctx, domain.Project{UserID: userID, Name: name, Description: description})
}
// ... List, GetByID, Update, Delete with ownership checks (return 404 if userID doesn't match)
```

**Why:** The service enforces business rules (ownership checks, validation). The repository just does CRUD.

**Verify:** Unit tests mocking the repository — especially the ownership checks.

---

### Step 2.7 — Implement project HTTP handlers and wire routes

**What:** Create `internal/http/handlers/project_handler.go` with all 5 project endpoints. Then wire all routes in `internal/http/handler.go` and add the auth middleware to all `/api/v1/*` routes except `/api/v1/auth/*`.

**Verify:** End-to-end test: register → login → create project → list projects → delete project. All with real HTTP calls.

---

## Phase 3 — Database Adapters + Schema Inspection

**Goal:** The PostgreSQL and MongoDB adapters are implemented. Connection testing and schema inspection endpoints work.

---

### Step 3.1 — Implement PostgreSQL adapter

**What:** Create `internal/adapters/postgres/adapter.go` and `connection.go`.

The adapter's `Connect` method:
1. Builds a DSN from the `ConnectionConfig`
2. Opens a `sqlx.DB` connection
3. Sets a short max lifetime (60 seconds) and max open conns (5)
4. Returns a `PostgresConnection` that implements `ports.DatabaseConnection`

```go
func (a *PostgresAdapter) Connect(ctx context.Context, cfg domain.ConnectionConfig) (ports.DatabaseConnection, error) {
    dsn := buildPostgresDSN(cfg)
    db, err := sqlx.ConnectContext(ctx, "pgx", dsn)
    if err != nil {
        return nil, apperrors.Wrap("CONNECTION_FAILED", "could not connect to PostgreSQL", 400, err)
    }
    db.SetMaxOpenConns(5)
    db.SetConnMaxLifetime(60 * time.Second)
    return &PostgresConnection{db: db, log: a.log}, nil
}
```

**Security note:** `buildPostgresDSN` uses the config fields directly. It must never log the password.

**Verify:** Connect to a real Postgres (Docker). Ping succeeds. Bad password returns a proper error.

---

### Step 3.2 — Implement PostgreSQL schema inspection

**What:** Implement `GetSchema` and `ListTables` on `PostgresConnection` using `information_schema` queries.

```sql
-- List tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Get columns for a table
SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = $1
ORDER BY ordinal_position;

-- Get primary keys
SELECT kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY';
```

Map Postgres data types to `domain.SeasonType` using a type map:
```go
var pgTypeMap = map[string]domain.SeasonType{
    "integer": domain.SeasonTypeInt,
    "bigint": domain.SeasonTypeInt,
    "character varying": domain.SeasonTypeString,
    "text": domain.SeasonTypeString,
    "boolean": domain.SeasonTypeBool,
    "timestamp without time zone": domain.SeasonTypeTimestamp,
    "timestamp with time zone": domain.SeasonTypeTimestamp,
    "json": domain.SeasonTypeJSON,
    "jsonb": domain.SeasonTypeJSON,
    "numeric": domain.SeasonTypeDecimal,
    "real": domain.SeasonTypeFloat,
    "double precision": domain.SeasonTypeFloat,
    "bytea": domain.SeasonTypeBinary,
    // ... more as you discover them
}
```

**Verify:** Inspect a real Postgres database with known tables. Confirm all columns and types are correctly returned.

---

### Step 3.3 — Implement PostgreSQL CRUD (QueryRows, InsertRow, UpdateRow, DeleteRow)

**What:** Build each method using parameterized queries. Never concatenate user input into SQL strings.

```go
func (c *PostgresConnection) QueryRows(ctx context.Context, req domain.QueryRequest) (*domain.QueryResult, error) {
    // Build query dynamically but safely:
    // SELECT * FROM <table> WHERE ... ORDER BY ... LIMIT $n OFFSET $m
    // Use squirrel or manual building with positional params
    // Return structured QueryResult
}
```

**Why:** Each method is independent. InsertRow does not know about UpdateRow. This keeps each one testable in isolation.

**Verify:** Unit tests for each method using `sqlmock` or integration tests with Docker Postgres.

---

### Step 3.4 — Implement MongoDB adapter

**What:** Create `internal/adapters/mongodb/adapter.go` and `connection.go`.

Similar structure to PostgreSQL but using the Mongo Go driver. Key differences:
- `ListTables` → `ListCollectionNames`
- `GetSchema` → sample 100 documents and infer field types (MongoDB has no schema)
- `InsertRow` → `InsertOne`
- `QueryRows` → `Find` with filter/limit/skip
- `UpdateRow` → `UpdateOne` with `$set`
- `DeleteRow` → `DeleteOne`

Schema inference for MongoDB:
```go
// Sample documents and build a synthetic schema
func inferSchema(docs []bson.M) []domain.ColumnSchema {
    fieldTypes := make(map[string]domain.SeasonType)
    for _, doc := range docs {
        for key, val := range doc {
            fieldTypes[key] = inferBSONType(val)
        }
    }
    // Convert map to []ColumnSchema
}
```

**Verify:** Connect to MongoDB Atlas (free tier). List collections. Sample documents. Confirm schema returned.

---

### Step 3.5 — Implement AdapterRegistry

**What:** Create `internal/adapters/registry/registry.go`.

```go
type AdapterRegistry struct {
    adapters map[domain.DBType]ports.DatabaseAdapter
}

func New(adapters map[domain.DBType]ports.DatabaseAdapter) *AdapterRegistry {
    return &AdapterRegistry{adapters: adapters}
}

func (r *AdapterRegistry) Get(t domain.DBType) (ports.DatabaseAdapter, error) {
    a, ok := r.adapters[t]
    if !ok {
        return nil, apperrors.New("UNSUPPORTED_DB_TYPE", "database type not supported: "+string(t), 400)
    }
    return a, nil
}
```

**Why:** Every service that needs a database adapter calls `registry.Get(dbType)` — it never imports a specific adapter directly. Adding MySQL later means adding it to the registry in `main.go`, touching nothing else.

**Verify:** Unit test: register two adapters, get each by type, confirm correct one returned. Request unknown type → error.

---

### Step 3.6 — Implement connection test endpoint

**What:** Create `POST /api/v1/connections/test` handler and supporting service method.

Flow:
1. Parse `ConnectionConfig` from request body
2. Validate no SSRF (block localhost, 127.x, 10.x, 192.168.x, 172.16-31.x in production)
3. Get adapter from registry
4. Call `adapter.Connect(ctx, cfg)`
5. Call `conn.Ping(ctx)`
6. Call `conn.ListTables(ctx)` for table count
7. Defer `conn.Close()`
8. Return `{ connected: true, latency_ms: N, tables_count: N }`

**Why:** This endpoint proves end-to-end that credentials work before the user starts a migration.

**Verify:** Test against real Postgres and Mongo. Test with bad password — confirm 400, not 500. Test with private IP — confirm SSRF block.

---

### Step 3.7 — Implement schema inspection endpoints

**What:** `POST /api/v1/schema/inspect` and `POST /api/v1/schema/tables`.

These are similar to the connection test but return the full schema instead of a ping result.

**Verify:** Call against a database with known schema. Confirm all tables and columns present.

---

## Phase 4 — Migration Engine + Editor

**Goal:** The full migration pipeline works (Postgres → Postgres, Postgres → Mongo). The editor CRUD endpoints work. SSE progress streaming works.

---

### Step 4.1 — Implement MigrationRepository

**What:** Create `internal/repository/migration_repo.go` implementing `ports.MigrationRepository`.

Stores job metadata (DB type, host, table name — NOT credentials) in the `migration_jobs` table.

**Verify:** Create a job, update its status, list by project.

---

### Step 4.2 — Implement the schema transformer

**What:** Create `internal/services/migration/transformer.go`.

The transformer converts a source `domain.Schema` into a schema suitable for the destination DB type. It:
1. Takes the source schema and destination `DBType`
2. Uses the `SeasonType` as the intermediate representation
3. Maps each `SeasonType` to the best native type in the destination DB

```go
var seasonToMongo = map[domain.SeasonType]string{
    domain.SeasonTypeString:    "string",
    domain.SeasonTypeInt:       "int",
    domain.SeasonTypeFloat:     "double",
    domain.SeasonTypeBool:      "bool",
    domain.SeasonTypeTimestamp: "date",
    domain.SeasonTypeJSON:      "object",
}
```

**Verify:** Transform a Postgres schema → MongoDB schema. Confirm all column types correctly mapped.

---

### Step 4.3 — Implement the row streamer

**What:** Create `internal/services/migration/streamer.go`.

This is the heart of the migration engine:

```go
func (s *Streamer) Stream(ctx context.Context, job domain.MigrationJob, progressCh chan<- domain.MigrationStatus) error {
    // 1. Open source connection
    srcAdapter, _ := s.registry.Get(job.SourceConn.Type)
    srcConn, _ := srcAdapter.Connect(ctx, job.SourceConn)
    defer srcConn.Close()

    // 2. Open destination connection
    dstAdapter, _ := s.registry.Get(job.DestConn.Type)
    dstConn, _ := dstAdapter.Connect(ctx, job.DestConn)
    defer dstConn.Close()

    // 3. Get total row count (for progress)
    total, _ := getRowCount(ctx, srcConn, job.SourceTable)

    // 4. Stream rows via channel
    rowCh, errCh := srcConn.StreamRows(ctx, job.SourceTable, job.BatchSize)

    var migrated int64
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case batch, ok := <-rowCh:
            if !ok {
                return nil  // All batches processed
            }
            // Apply schema mapping
            transformed := applyMapping(batch.Rows, job.Options.SchemaMapping)
            // Write to destination
            if err := dstConn.BulkInsert(ctx, job.DestTable, transformed); err != nil {
                return fmt.Errorf("batch %d: %w", batch.Index, err)
            }
            migrated += int64(len(batch.Rows))
            // Send progress
            progressCh <- domain.MigrationStatus{State: "running", TotalRows: total, MigratedRows: migrated}
        case err := <-errCh:
            return fmt.Errorf("source stream error: %w", err)
        }
    }
}
```

**Why:** Using channels for streaming means the source is reading while the destination is writing — they pipeline. The migrator never loads all rows into memory.

**Verify:** Migrate a 10,000-row Postgres table to another Postgres table. Confirm row counts match. Confirm progress events emitted.

---

### Step 4.4 — Implement MigrationService

**What:** Create `internal/services/migration/service.go` that orchestrates the full migration lifecycle.

```go
func (s *MigrationService) StartMigration(ctx context.Context, req StartMigrationRequest) (string, error) {
    // 1. Create job record in DB (status: pending)
    job, _ := s.migrationRepo.Create(ctx, buildJob(req))

    // 2. Launch migration in a goroutine
    go func() {
        bgCtx := context.Background()  // New context — request context will cancel
        s.migrationRepo.UpdateStatus(bgCtx, job.ID, domain.MigrationStatus{State: "running"})

        progressCh := make(chan domain.MigrationStatus, 10)
        go s.broadcastProgress(job.ID, progressCh)  // Fan out to SSE clients

        err := s.streamer.Stream(bgCtx, *job, progressCh)
        close(progressCh)

        finalStatus := "completed"
        if err != nil {
            finalStatus = "failed"
            s.log.Error("migration failed", zap.String("job_id", job.ID), zap.Error(err))
        }
        s.migrationRepo.UpdateStatus(bgCtx, job.ID, domain.MigrationStatus{State: finalStatus})
    }()

    // 3. Return job ID immediately (async)
    return job.ID, nil
}
```

**Why:** Migration runs in a background goroutine. The HTTP response returns immediately with the job ID. The frontend polls or subscribes to SSE for updates.

**Verify:** Start a migration via the API. Immediately get a job ID back. Status endpoint shows "running". Eventually shows "completed".

---

### Step 4.5 — Implement SSE progress streaming

**What:** Create a per-job SSE broadcaster. The `GET /api/v1/migrations/:id/logs` endpoint subscribes a client to the job's progress channel.

```go
// Simple in-memory pub/sub for SSE
type ProgressHub struct {
    mu          sync.RWMutex
    subscribers map[string][]chan string  // jobID -> list of client channels
}

func (h *ProgressHub) Subscribe(jobID string) <-chan string {
    ch := make(chan string, 20)
    h.mu.Lock()
    h.subscribers[jobID] = append(h.subscribers[jobID], ch)
    h.mu.Unlock()
    return ch
}

func (h *ProgressHub) Broadcast(jobID, event string) {
    h.mu.RLock()
    defer h.mu.RUnlock()
    for _, ch := range h.subscribers[jobID] {
        select {
        case ch <- event:
        default:  // Client too slow — skip this event
        }
    }
}
```

The HTTP handler uses Fiber's streaming response to write SSE events as they arrive.

**Verify:** Open two browser tabs to the SSE endpoint for the same job. Start a migration. Both tabs see progress events.

---

### Step 4.6 — Implement cancel migration

**What:** `DELETE /api/v1/migrations/:id` cancels a running migration.

Store a `context.CancelFunc` per job in an in-memory map. Calling cancel triggers the context cancellation in the streaming goroutine, which returns `ctx.Err()` and marks the job as cancelled.

**Verify:** Start a large migration. Cancel mid-way. Status shows "cancelled". Row count in destination is less than total.

---

### Step 4.7 — Implement the database editor endpoints

**What:** Create `internal/http/handlers/editor_handler.go` with four endpoints:
- `POST /api/v1/editor/query` → `conn.QueryRows`
- `POST /api/v1/editor/insert` → `conn.InsertRow`
- `PUT /api/v1/editor/update` → `conn.UpdateRow`
- `DELETE /api/v1/editor/delete` → `conn.DeleteRow`

Each handler:
1. Parses `ConnectionConfig` from the request body
2. Gets adapter from registry
3. Opens connection
4. Performs operation
5. Closes connection (deferred)
6. Returns result

**Why:** Stateless by design. Every editor request is a fresh connection. No session. No stored credentials.

**Verify:** Use curl to insert a row, query it back, update it, query again, delete it.

---

### Step 4.8 — Wire everything in main.go

**What:** Complete `cmd/server/main.go` with all services, handlers, middleware, and routes fully connected.

```go
func main() {
    _ = godotenv.Load()
    cfg := config.Load()
    log := logger.New(cfg.LogLevel)

    // Infrastructure
    db, err := repository.NewInternalDB(cfg.DatabaseURL)
    if err != nil { log.Error("db connect failed", zap.Error(err)); os.Exit(1) }

    // Adapters
    registry := adapters_registry.New(map[domain.DBType]ports.DatabaseAdapter{
        domain.DBTypePostgres: postgres.NewAdapter(log),
        domain.DBTypeMongo:    mongodb.NewAdapter(log),
    })

    // Repositories
    userRepo      := repository.NewUserRepository(db, log)
    projectRepo   := repository.NewProjectRepository(db, log)
    migrationRepo := repository.NewMigrationRepository(db, log)

    // Services
    authSvc      := auth.NewService(userRepo, cfg.JWTSecret, log)
    projectSvc   := project.NewService(projectRepo, log)
    progressHub  := migration.NewProgressHub()
    streamer     := migration.NewStreamer(registry, log)
    migrationSvc := migration.NewService(migrationRepo, streamer, progressHub, log)
    editorSvc    := editor.NewService(registry, log)

    // HTTP
    app := fiber.New()
    handlers.Register(app, authSvc, projectSvc, migrationSvc, editorSvc, progressHub, log)
    app.Listen(":" + cfg.Port)
}
```

**Verify:** Start the server. Run the full manual flow: register, login, create project, test connection, start migration, watch SSE, use editor. Everything works end to end.

---

### Step 4.9 — Write the Dockerfile

**What:** Create a multi-stage Dockerfile.

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

# Runtime stage
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=builder /app/server .
COPY migrations/ ./migrations/
EXPOSE 8080
CMD ["./server"]
```

**Why:** Multi-stage build keeps the final image tiny (no Go toolchain in production). `ca-certificates` is needed for TLS connections to user databases.

**Verify:** `docker build -t seasyn-backend .` succeeds. `docker run -p 8080:8080 --env-file .env seasyn-backend` starts the server.

---

### Step 4.10 — Write docker-compose.yml

**What:** Compose file for local development with SEASYN's internal Postgres, a local Postgres for testing migrations, and the backend itself.

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: seasyn_internal
      POSTGRES_USER: seasyn
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]

  test-postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: testdb
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
    ports: ["5433:5432"]

  backend:
    build: .
    env_file: .env
    ports: ["8080:8080"]
    depends_on: [db]
```

**Verify:** `docker-compose up` starts all services. Backend health check passes.

---

*End of SEASYN Backend Implementation Plan*
