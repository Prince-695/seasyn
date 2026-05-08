# SEASYN — Backend Product Requirements Document (PRD)

**Version:** 1.0  
**Language:** Go  
**Architecture:** Clean Architecture + Dependency Injection  
**Internal DB ORM:** GORM for SEASYN-owned PostgreSQL metadata  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Dependency Injection Design](#4-dependency-injection-design)
5. [Project Structure](#5-project-structure)
6. [Module Specifications](#6-module-specifications)
7. [API Contract](#7-api-contract)
8. [Database Adapter System](#8-database-adapter-system)
9. [Migration Engine Specification](#9-migration-engine-specification)
10. [Security Requirements](#10-security-requirements)
11. [Configuration Management](#11-configuration-management)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Observability & Logging](#13-observability--logging)
14. [Testing Requirements](#14-testing-requirements)
15. [Non-Functional Requirements](#15-non-functional-requirements)

---

## 1. Executive Summary

SEASYN's backend is a **stateless Go service** that acts as an intelligent intermediary between heterogeneous database systems. It accepts user-provided credentials, opens ephemeral connections to source and destination databases, performs schema inspection and data migration, and closes those connections — storing nothing.

The backend is built around **Clean Architecture** principles with **explicit Dependency Injection (DI)** (no magic containers — interfaces wired manually or via a lightweight DI framework like `wire` or `fx`).

---

## 2. Goals & Non-Goals

### Goals

- Accept connections to PostgreSQL, MySQL, SQLite (SQL side) and MongoDB (NoSQL side) using user-supplied credentials
- Expose a clean RESTful API that the frontend consumes
- Perform real-time, streaming migrations between any supported database pair
- Provide a live database editor (CRUD) via API without persisting user data
- Be horizontally scalable and stateless (no session state on server)
- Enforce security: credentials never logged, never stored in plaintext
- Support project-level metadata stored in SEASYN's own internal Postgres instance using GORM models/repositories (user accounts, project names, migration history — NOT user DB data)

### Non-Goals

- SEASYN does not replicate entire database instances continuously (no CDC/change data capture in MVP)
- SEASYN does not provide a query builder UI (only schema inspection + CRUD)
- SEASYN does not manage cloud database provisioning
- SEASYN does not store or cache any data from user databases

---

## 3. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        SEASYN Backend                        │
│                                                              │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │  HTTP Layer │   │ Business     │   │ Adapter Layer    │  │
│  │  (Fiber/Chi)│──▶│ Logic Layer  │──▶│ (DB Drivers)     │  │
│  │  Middleware │   │ Services     │   │ PostgreSQL        │  │
│  │  Auth/Rate  │   │ Migration    │   │ MySQL            │  │
│  │  Limit      │   │ Schema Svc   │   │ MongoDB          │  │
│  └─────────────┘   └──────────────┘   │ SQLite           │  │
│                                        └──────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │        SEASYN Internal DB (Postgres + GORM)            │  │
│  │  Users | Projects | MigrationJobs | AuditLogs          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Core Principle: The Connection Pool Never Stores User Data

Every API call that touches a user's database:
1. Opens a fresh connection using user-supplied credentials
2. Performs the operation
3. Returns results to caller
4. Closes the connection (or uses a **short-lived, request-scoped pool**)

---

## 4. Dependency Injection Design

SEASYN uses **Go's native interface system** for DI. Every service depends on an interface, never a concrete type. Wiring happens in `main.go` or a dedicated `wire.go` file.

### The DI Philosophy

```
No global state.
No init() side effects.
No service locator pattern.
Every dependency is explicit in function/constructor signatures.
```

### Interface Definitions (Core)

```go
// pkg/ports/database.go

// DatabaseAdapter is the universal interface all DB drivers implement
type DatabaseAdapter interface {
    Connect(ctx context.Context, cfg ConnectionConfig) (DatabaseConnection, error)
    Ping(ctx context.Context) error
    Close() error
}

// DatabaseConnection represents an active, scoped connection
type DatabaseConnection interface {
    GetSchema(ctx context.Context) (*Schema, error)
    ListTables(ctx context.Context) ([]TableInfo, error)
    QueryRows(ctx context.Context, query QueryRequest) (*QueryResult, error)
    InsertRow(ctx context.Context, req InsertRequest) error
    UpdateRow(ctx context.Context, req UpdateRequest) error
    DeleteRow(ctx context.Context, req DeleteRequest) error
    StreamRows(ctx context.Context, table string, batchSize int) (<-chan RowBatch, error)
    BulkInsert(ctx context.Context, table string, rows []map[string]any) error
    Close() error
}

// MigrationService handles the orchestration of a migration job
type MigrationService interface {
    StartMigration(ctx context.Context, job MigrationJob) (*MigrationResult, error)
    GetStatus(ctx context.Context, jobID string) (*MigrationStatus, error)
    CancelMigration(ctx context.Context, jobID string) error
}

// ProjectRepository handles SEASYN's own metadata (not user DB data)
type ProjectRepository interface {
    CreateProject(ctx context.Context, p Project) (*Project, error)
    GetProject(ctx context.Context, id string) (*Project, error)
    ListProjects(ctx context.Context, userID string) ([]Project, error)
    DeleteProject(ctx context.Context, id string) error
}

// SchemaTransformer maps source schema to destination schema format
type SchemaTransformer interface {
    Transform(ctx context.Context, source *Schema, targetType DBType) (*Schema, error)
}
```

### Wiring Example (`cmd/server/main.go`)

```go
func main() {
    cfg := config.Load()

    // Infrastructure layer
    internalDB := repository.NewInternalDB(cfg.DatabaseURL) // returns *gorm.DB
    logger := logger.NewZapLogger(cfg.LogLevel)
    encryptor := crypto.NewAESEncryptor(cfg.EncryptionKey)

    // Adapters (concrete implementations of DatabaseAdapter)
    pgAdapter := adapters.NewPostgresAdapter(logger)
    mongoAdapter := adapters.NewMongoAdapter(logger)
    mysqlAdapter := adapters.NewMySQLAdapter(logger)

    // Adapter registry — maps DBType -> DatabaseAdapter
    adapterRegistry := registry.NewAdapterRegistry(map[DBType]DatabaseAdapter{
        DBTypePostgres: pgAdapter,
        DBTypeMongo:    mongoAdapter,
        DBTypeMySQL:    mysqlAdapter,
    })

    // Repositories (SEASYN's own data)
    projectRepo := repository.NewProjectRepository(internalDB)
    migrationRepo := repository.NewMigrationRepository(internalDB)
    userRepo := repository.NewUserRepository(internalDB)

    // Services
    schemaTransformer := transformer.NewSchemaTransformer()
    migrationSvc := migration.NewMigrationService(adapterRegistry, schemaTransformer, migrationRepo, logger)
    projectSvc := project.NewProjectService(projectRepo, encryptor)
    editorSvc := editor.NewEditorService(adapterRegistry, logger)
    authSvc := auth.NewAuthService(userRepo, cfg.JWTSecret)

    // HTTP Handlers
    handler := http.NewHandler(migrationSvc, projectSvc, editorSvc, authSvc, logger)

    // Server
    server := http.NewServer(cfg.Port, handler)
    server.Run()
}
```

---

## 5. Project Structure

```
seasyn-backend/
├── cmd/
│   └── server/
│       └── main.go                   # Entry point — wires everything
│
├── internal/
│   ├── adapters/                     # Concrete DB driver implementations
│   │   ├── postgres/
│   │   │   ├── adapter.go            # Implements DatabaseAdapter
│   │   │   ├── connection.go         # Implements DatabaseConnection
│   │   │   └── schema.go             # Schema extraction logic
│   │   ├── mongodb/
│   │   │   ├── adapter.go
│   │   │   ├── connection.go
│   │   │   └── schema.go
│   │   ├── mysql/
│   │   │   └── ...
│   │   └── registry/
│   │       └── registry.go           # AdapterRegistry: DBType -> Adapter
│   │
│   ├── domain/                       # Pure business entities (no DB, no HTTP)
│   │   ├── project.go
│   │   ├── migration.go
│   │   ├── schema.go
│   │   ├── connection.go
│   │   └── user.go
│   │
│   ├── ports/                        # Interfaces (the contracts)
│   │   ├── database.go               # DatabaseAdapter, DatabaseConnection
│   │   ├── migration.go              # MigrationService
│   │   ├── repository.go             # ProjectRepository, MigrationRepository
│   │   └── transformer.go            # SchemaTransformer
│   │
│   ├── services/                     # Business logic implementations
│   │   ├── migration/
│   │   │   ├── service.go            # Core migration orchestration
│   │   │   ├── streamer.go           # Streaming data transfer logic
│   │   │   └── transformer.go        # Schema mapping logic
│   │   ├── editor/
│   │   │   └── service.go            # CRUD operations over live DBs
│   │   ├── project/
│   │   │   └── service.go            # Project metadata management
│   │   └── auth/
│   │       └── service.go            # JWT auth, user management
│   │
│   ├── repository/                   # SEASYN's own DB (internal Postgres via GORM)
│   │   ├── db.go                     # Opens *gorm.DB for internal metadata DB
│   │   ├── models.go                 # GORM table models for users/projects/jobs
│   │   ├── project_repo.go
│   │   ├── migration_repo.go
│   │   └── user_repo.go
│   │
│   ├── http/                         # HTTP transport layer
│   │   ├── server.go
│   │   ├── handler.go                # Router setup
│   │   ├── middleware/
│   │   │   ├── auth.go               # JWT validation
│   │   │   ├── ratelimit.go
│   │   │   └── logger.go
│   │   └── handlers/
│   │       ├── migration_handler.go
│   │       ├── editor_handler.go
│   │       ├── project_handler.go
│   │       └── auth_handler.go
│   │
│   └── config/
│       └── config.go                 # Config struct loaded from env vars
│
├── pkg/                              # Shared, reusable utilities
│   ├── crypto/
│   │   └── encryptor.go             # AES-256 credential encryption
│   ├── logger/
│   │   └── zap.go                   # Structured logging
│   └── validator/
│       └── validator.go             # Input validation helpers
│
├── migrations/                       # SEASYN's own DB migrations (sqlmigrate)
│   ├── 001_create_users.sql
│   ├── 002_create_projects.sql
│   └── 003_create_migration_jobs.sql
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── go.mod
└── go.sum
```

---

## 6. Module Specifications

### 6.1 Domain Entities

```go
// internal/domain/connection.go
type DBType string

const (
    DBTypePostgres DBType = "postgres"
    DBTypeMongo    DBType = "mongodb"
    DBTypeMySQL    DBType = "mysql"
    DBTypeSQLite   DBType = "sqlite"
)

type ConnectionConfig struct {
    Type             DBType
    Host             string
    Port             int
    Database         string
    Username         string
    Password         string    // Never logged, never stored in plaintext
    ConnectionString string    // Alternative to host/port/user/pass
    SSLMode          string
    Options          map[string]string
}

// internal/domain/project.go
type Project struct {
    ID          string
    UserID      string
    Name        string
    Description string
    Connections []ConnectionMeta   // Metadata only — no stored credentials
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

// ConnectionMeta stores display-safe metadata; credentials are never persisted
type ConnectionMeta struct {
    ID       string
    Alias    string
    DBType   DBType
    Host     string   // Stored for display
    Database string   // Stored for display
    // Password/ConnectionString: NEVER stored
}

// internal/domain/migration.go
type MigrationJob struct {
    ID          string
    ProjectID   string
    SourceConn  ConnectionConfig   // Comes in per-request, not from storage
    DestConn    ConnectionConfig
    SourceTable string
    DestTable   string
    BatchSize   int
    Options     MigrationOptions
    Status      MigrationStatus
    CreatedAt   time.Time
}

type MigrationOptions struct {
    TruncateDestination bool
    CreateIfNotExists   bool
    SchemaMapping       map[string]string   // source_col -> dest_col
    TypeOverrides       map[string]string   // col -> target_type
}

type MigrationStatus struct {
    State        string   // "pending" | "running" | "completed" | "failed" | "cancelled"
    TotalRows    int64
    MigratedRows int64
    ErrorMessage string
    StartedAt    time.Time
    CompletedAt  *time.Time
}
```

### 6.2 Adapter Registry

```go
// internal/adapters/registry/registry.go

type AdapterRegistry struct {
    adapters map[domain.DBType]ports.DatabaseAdapter
}

func NewAdapterRegistry(adapters map[domain.DBType]ports.DatabaseAdapter) *AdapterRegistry {
    return &AdapterRegistry{adapters: adapters}
}

func (r *AdapterRegistry) Get(dbType domain.DBType) (ports.DatabaseAdapter, error) {
    adapter, ok := r.adapters[dbType]
    if !ok {
        return nil, fmt.Errorf("unsupported database type: %s", dbType)
    }
    return adapter, nil
}
```

### 6.3 Schema Representation

```go
// internal/domain/schema.go

type Schema struct {
    DBType  DBType
    Tables  []TableSchema
}

type TableSchema struct {
    Name        string
    Columns     []ColumnSchema
    PrimaryKeys []string
    Indexes     []IndexSchema
}

type ColumnSchema struct {
    Name       string
    DataType   string     // Native type (e.g., "varchar", "int4", "ObjectId")
    SeasonType SeasonType // Normalized internal type for cross-DB mapping
    Nullable   bool
    Default    *string
    MaxLength  *int
}

// SeasonType is SEASYN's normalized type system for cross-DB mapping
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
```

---

## 7. API Contract

### Base URL

```
/api/v1
```

### Authentication

All endpoints (except `/auth/*`) require:
```
Authorization: Bearer <jwt_token>
```

### 7.1 Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, receive JWT |
| POST | `/auth/refresh` | Refresh JWT token |
| DELETE | `/auth/logout` | Invalidate token |

**POST /auth/login**
```json
Request:  { "email": "user@example.com", "password": "secret" }
Response: { "token": "eyJ...", "expires_at": "2025-12-01T00:00:00Z", "user": { "id": "...", "email": "..." } }
```

---

### 7.2 Project Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/projects` | List all user projects |
| POST | `/projects` | Create a new project |
| GET | `/projects/:id` | Get project details |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

**POST /projects**
```json
Request:
{
  "name": "My Migration Project",
  "description": "PostgreSQL to MongoDB migration"
}

Response:
{
  "id": "proj_abc123",
  "name": "My Migration Project",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### 7.3 Connection Test Endpoint

Credentials are NEVER stored. This endpoint purely tests connectivity.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/connections/test` | Test DB connection (no storage) |

**POST /connections/test**
```json
Request:
{
  "type": "postgres",
  "host": "db.neon.tech",
  "port": 5432,
  "database": "mydb",
  "username": "user",
  "password": "secret",
  "ssl_mode": "require"
}

Response:
{
  "connected": true,
  "latency_ms": 42,
  "server_version": "PostgreSQL 15.2",
  "tables_count": 12
}
```

---

### 7.4 Schema Inspection Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/schema/inspect` | Get full schema of a DB |
| POST | `/schema/tables` | List table names |
| POST | `/schema/tables/:table` | Get single table schema |
| POST | `/schema/preview` | Preview first N rows of a table |

**POST /schema/inspect**
```json
Request: { "connection": { /* ConnectionConfig */ } }

Response:
{
  "db_type": "postgres",
  "tables": [
    {
      "name": "users",
      "columns": [
        { "name": "id", "data_type": "int4", "season_type": "int", "nullable": false, "primary_key": true },
        { "name": "email", "data_type": "varchar", "season_type": "string", "nullable": false, "max_length": 255 }
      ],
      "primary_keys": ["id"],
      "row_count": 1500
    }
  ]
}
```

---

### 7.5 Migration Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/migrations` | Start a migration job |
| GET | `/migrations/:id` | Get migration job status |
| DELETE | `/migrations/:id` | Cancel a running migration |
| GET | `/migrations` | List migration history for project |
| GET | `/migrations/:id/logs` | Stream migration logs (SSE) |

**POST /migrations** (Start Migration)
```json
Request:
{
  "project_id": "proj_abc123",
  "source": {
    "connection": { "type": "postgres", "host": "...", "port": 5432, "database": "src_db", "username": "...", "password": "..." },
    "table": "users"
  },
  "destination": {
    "connection": { "type": "mongodb", "connection_string": "mongodb+srv://..." },
    "collection": "users"
  },
  "options": {
    "batch_size": 500,
    "truncate_destination": false,
    "create_if_not_exists": true,
    "schema_mapping": {
      "user_id": "_id",
      "full_name": "name"
    }
  }
}

Response:
{
  "job_id": "mig_xyz789",
  "status": "pending",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**GET /migrations/:id**
```json
{
  "job_id": "mig_xyz789",
  "status": "running",
  "total_rows": 10000,
  "migrated_rows": 3500,
  "progress_percent": 35.0,
  "started_at": "2025-01-01T00:01:00Z",
  "estimated_completion": "2025-01-01T00:03:30Z"
}
```

---

### 7.6 Database Editor Endpoints

All editor endpoints require credentials in the request body (never stored).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/editor/query` | Execute a read query |
| POST | `/editor/insert` | Insert a row/document |
| PUT | `/editor/update` | Update a row/document |
| DELETE | `/editor/delete` | Delete a row/document |

**POST /editor/query**
```json
Request:
{
  "connection": { /* ConnectionConfig */ },
  "table": "users",
  "filters": { "status": "active" },
  "limit": 50,
  "offset": 0,
  "order_by": "created_at",
  "order_dir": "desc"
}

Response:
{
  "columns": ["id", "email", "status", "created_at"],
  "rows": [
    { "id": 1, "email": "a@b.com", "status": "active", "created_at": "2025-01-01" }
  ],
  "total_count": 1500,
  "page": 1
}
```

---

### 7.7 Internal Metadata Persistence With GORM

SEASYN's own PostgreSQL database is accessed through **GORM**. This applies only to internal metadata tables such as users, projects, migration jobs, and audit logs.

GORM is **not** the abstraction for user-provided databases. User database adapters still use database-specific drivers because schema inspection, streaming reads, bulk writes, and cross-database migration need precise control over SQL/MongoDB behavior.

Internal repository rule:

```go
// internal/repository/db.go
func NewInternalDB(dsn string) (*gorm.DB, error) {
    return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
```

The repository layer converts between:
- GORM models: database-shaped structs stored in SEASYN's internal Postgres
- Domain entities: clean business structs used by services and handlers

---

## 8. Database Adapter System

### 8.1 PostgreSQL Adapter

```go
// internal/adapters/postgres/adapter.go

type PostgresAdapter struct {
    logger ports.Logger
}

func NewPostgresAdapter(logger ports.Logger) *PostgresAdapter {
    return &PostgresAdapter{logger: logger}
}

// Connect creates a new connection but does NOT store credentials
func (a *PostgresAdapter) Connect(ctx context.Context, cfg domain.ConnectionConfig) (ports.DatabaseConnection, error) {
    dsn := buildDSN(cfg) // Build from config; cfg is ephemeral
    db, err := sqlx.ConnectContext(ctx, "pgx", dsn)
    if err != nil {
        return nil, fmt.Errorf("postgres connect: %w", err)
    }
    db.SetMaxOpenConns(5)
    db.SetConnMaxLifetime(30 * time.Second)
    return &PostgresConnection{db: db, logger: a.logger}, nil
}
```

### 8.2 MongoDB Adapter

```go
// internal/adapters/mongodb/adapter.go

type MongoAdapter struct {
    logger ports.Logger
}

func (a *MongoAdapter) Connect(ctx context.Context, cfg domain.ConnectionConfig) (ports.DatabaseConnection, error) {
    uri := cfg.ConnectionString
    if uri == "" {
        uri = buildMongoURI(cfg)
    }
    client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri).SetConnectTimeout(10*time.Second))
    if err != nil {
        return nil, fmt.Errorf("mongo connect: %w", err)
    }
    if err := client.Ping(ctx, nil); err != nil {
        return nil, fmt.Errorf("mongo ping: %w", err)
    }
    return &MongoConnection{client: client, db: client.Database(cfg.Database), logger: a.logger}, nil
}
```

### 8.3 Type Mapping Table

| SeasonType | PostgreSQL | MongoDB | MySQL |
|------------|-----------|---------|-------|
| string | varchar, text | string | varchar, text |
| int | int2, int4, int8 | int, long | tinyint, int, bigint |
| float | float4, float8, numeric | double | float, double, decimal |
| bool | boolean | bool | tinyint(1) |
| timestamp | timestamp, timestamptz | Date | datetime, timestamp |
| json | json, jsonb | object/document | json |
| array | ARRAY | array | json (serialized) |
| binary | bytea | BinData | blob |

---

## 9. Migration Engine Specification

### 9.1 Migration Lifecycle

```
START
  │
  ▼
[VALIDATE] — Test source + dest connections; validate schema compatibility
  │
  ▼
[INSPECT] — Read source schema; build SeasonSchema representation
  │
  ▼
[TRANSFORM] — Map source schema to destination schema format
  │
  ▼
[PREPARE DEST] — Create table/collection if create_if_not_exists=true; truncate if needed
  │
  ▼
[STREAM] — Read source in batches → transform rows → write to dest
  │         (each batch is atomic; progress tracked per batch)
  ▼
[VERIFY] — Row count check: source count == destination count
  │
  ▼
[COMPLETE] — Update job status; close connections
```

### 9.2 Streaming Architecture

```go
// internal/services/migration/streamer.go

func (s *MigrationStreamer) Stream(ctx context.Context, job domain.MigrationJob) error {
    // Open source connection
    srcAdapter, _ := s.registry.Get(job.SourceConn.Type)
    srcConn, _ := srcAdapter.Connect(ctx, job.SourceConn)
    defer srcConn.Close()

    // Open destination connection
    dstAdapter, _ := s.registry.Get(job.DestConn.Type)
    dstConn, _ := dstAdapter.Connect(ctx, job.DestConn)
    defer dstConn.Close()

    // Stream rows in batches via channels
    rowCh, errCh := srcConn.StreamRows(ctx, job.SourceTable, job.BatchSize)

    for {
        select {
        case <-ctx.Done():
            return ctx.Err() // Cancellation
        case batch, ok := <-rowCh:
            if !ok {
                return nil // Done
            }
            // Transform batch (apply schema mapping)
            transformed := s.transformer.TransformBatch(batch.Rows, job.Options.SchemaMapping)
            // Write to destination
            if err := dstConn.BulkInsert(ctx, job.DestTable, transformed); err != nil {
                return fmt.Errorf("bulk insert batch %d: %w", batch.Index, err)
            }
            // Update progress
            s.updateProgress(ctx, job.ID, batch.Index*job.BatchSize)
        case err := <-errCh:
            return fmt.Errorf("streaming error: %w", err)
        }
    }
}
```

### 9.3 Progress Updates via SSE

Migration progress is streamed to the frontend using **Server-Sent Events (SSE)** on `GET /migrations/:id/logs`.

```
event: progress
data: {"migrated_rows": 500, "total_rows": 10000, "percent": 5.0}

event: progress
data: {"migrated_rows": 1000, "total_rows": 10000, "percent": 10.0}

event: complete
data: {"status": "completed", "duration_seconds": 42}
```

---

## 10. Security Requirements

### 10.1 Credential Handling Rules

| Rule | Implementation |
|------|----------------|
| Never log credentials | Zap logger uses `zap.Skip()` for password fields; custom `LogSafe()` struct method |
| Never store credentials | Credentials come in per-request; only `ConnectionMeta` (no password) stored in DB |
| Encrypt in transit | TLS enforced on all external connections; HTTPS required |
| Short-lived connections | Connections closed within request lifetime or after 60s max |
| No credential caching | `sync.Map` or connection pools NEVER keyed by credential hash |

### 10.2 Authentication

- JWT-based auth with RS256 signing (asymmetric keys)
- Access token: 15-minute expiry
- Refresh token: 7-day expiry, stored in httpOnly cookie
- Rate limiting: 10 req/s per IP on auth endpoints, 100 req/s per user on API endpoints

### 10.3 Input Validation

Every incoming `ConnectionConfig` is validated before use:
- Host: no SSRF (reject `localhost`, `127.0.0.1`, `0.0.0.0`, `169.254.x.x`, private RFC1918 ranges unless dev mode)
- Port: 1–65535
- SQL Query fields: no raw query passthrough in editor (only structured CRUD — no `POST /editor/raw-sql` in MVP)

---

## 11. Configuration Management

All config via environment variables. No config files committed.

```env
# Server
PORT=8080
ENV=development   # development | production

# SEASYN Internal DB (Postgres)
DATABASE_URL=postgres://seasyn:password@localhost:5432/seasyn_internal

# JWT
JWT_SECRET_KEY=<RS256 private key PEM>
JWT_PUBLIC_KEY=<RS256 public key PEM>

# Encryption (for any sensitive metadata at rest)
ENCRYPTION_KEY=<32-byte hex AES-256 key>

# Rate Limiting
RATE_LIMIT_RPS=100
RATE_LIMIT_BURST=20

# Migration
MAX_BATCH_SIZE=1000
DEFAULT_BATCH_SIZE=500
MAX_CONCURRENT_MIGRATIONS=5
MIGRATION_TIMEOUT_SECONDS=3600

# Logging
LOG_LEVEL=info  # debug | info | warn | error

# CORS
ALLOWED_ORIGINS=https://seasyn.app,http://localhost:3000
```

---

## 12. Error Handling Strategy

### 12.1 Error Types

```go
// pkg/errors/errors.go

type AppError struct {
    Code    string   // e.g., "DB_CONNECT_FAILED"
    Message string   // Human-readable
    Status  int      // HTTP status code
    Err     error    // Wrapped original error (for logging, not for client)
}

// Error codes
const (
    ErrCodeConnectionFailed     = "CONNECTION_FAILED"
    ErrCodeSchemaIncompatible   = "SCHEMA_INCOMPATIBLE"
    ErrCodeMigrationFailed      = "MIGRATION_FAILED"
    ErrCodeInvalidCredentials   = "INVALID_CREDENTIALS"
    ErrCodeProjectNotFound      = "PROJECT_NOT_FOUND"
    ErrCodeRateLimitExceeded    = "RATE_LIMIT_EXCEEDED"
    ErrCodeUnsupportedDBType    = "UNSUPPORTED_DB_TYPE"
    ErrCodeBatchWriteFailed     = "BATCH_WRITE_FAILED"
)
```

### 12.2 Error Response Format

```json
{
  "error": {
    "code": "CONNECTION_FAILED",
    "message": "Could not connect to the database. Check your credentials and host.",
    "details": {}
  }
}
```

Never include original DB errors or stack traces in the API response — log them server-side.

---

## 13. Observability & Logging

### Structured Logging (Zap)

Every log line includes:
- `timestamp`
- `level`
- `request_id`
- `user_id` (from JWT, never email/password)
- `operation` (e.g., `"migration.start"`, `"editor.query"`)
- `duration_ms`
- `error` (only error message, never credential data)

### Metrics (Prometheus)

Expose `/metrics` endpoint with:
- `seasyn_migrations_total{status="completed|failed"}` — counter
- `seasyn_migration_rows_processed_total` — counter
- `seasyn_api_request_duration_seconds{endpoint, method}` — histogram
- `seasyn_active_connections` — gauge
- `seasyn_active_migrations` — gauge

### Health Check

```
GET /health
Response: { "status": "ok", "internal_db": "ok", "version": "1.0.0" }
```

---

## 14. Testing Requirements

### Unit Tests (minimum 80% coverage on services)

- Every service method has a unit test using mock interfaces
- Mock adapters implement `ports.DatabaseAdapter` and `ports.DatabaseConnection`
- Schema transformer tests cover all type mapping combinations

### Integration Tests

- PostgreSQL → PostgreSQL migration: full round trip
- PostgreSQL → MongoDB migration: round trip with type mapping
- Connection failure scenarios: invalid creds, unreachable host
- Cancellation: mid-migration cancel via context

### Test Tooling

- `testify` for assertions
- `mockery` for generating mocks from interfaces
- `testcontainers-go` for spinning up real Postgres/Mongo in tests

---

## 15. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| API response time (p99) | < 200ms for non-migration endpoints |
| Migration throughput | > 5,000 rows/second for Postgres → Postgres |
| Concurrent migrations | At least 5 simultaneous jobs |
| Availability | 99.9% uptime |
| Memory usage | < 512MB per instance at peak |
| Go version | 1.22+ |
| Dependencies | Minimal; pin versions in go.sum |

---

*End of SEASYN Backend PRD v1.0*
