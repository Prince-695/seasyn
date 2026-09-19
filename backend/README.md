# 🌊 SeaSyn Backend — Cloud-Native Database Migration & Real-Time Sync Engine

![Backend CI](https://github.com/Prince-695/seasyn/actions/workflows/backend.yml/badge.svg)
[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go)](https://golang.org)
[![Fiber v2](https://img.shields.io/badge/Fiber-v2.52-00ACD7?style=for-the-badge&logo=go)](https://gofiber.io)
[![GORM](https://img.shields.io/badge/GORM-v1.31-7952B3?style=for-the-badge)](https://gorm.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org)
[![Swagger / OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-85EA2D?style=for-the-badge&logo=swagger)](http://localhost:8080/swagger/index.html)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**SeaSyn** is a high-throughput, cross-database migration, schema synchronization, and live replication engine engineered in Go. Designed as a cloud-native, distributed-ready system, SeaSyn eliminates the operational complexity of migrating relational and NoSQL databases across heterogeneous environments (PostgreSQL, MySQL, MongoDB, SQLite).

It features **zero-allocation channel streaming**, **bounded backpressure controls**, **universal schema translation via `SeasonType`**, **dynamic Auto-DDL synthesis**, and **real-time physics telemetry (RPS, bandwidth velocity, batch latency)** broadcast to frontend dashboards via Server-Sent Events (SSE).

---

## 📑 Table of Contents

1. [System Overview & Key Capabilities](#-system-overview--key-capabilities)
2. [High-Level Design (HLD) Architecture](#-high-level-design-hld-architecture)
   - [Architectural Infographic](#1-architectural-infographic)
   - [Architectural Layers Breakdown](#2-architectural-layers-breakdown)
   - [End-to-End Migration Sequence Flow](#3-end-to-end-migration-sequence-flow)
   - [Core Systems Engineering Innovations](#4-core-systems-engineering-innovations)
3. [Universal Type System (`SeasonType`) & Auto-DDL](#-universal-type-system-seasontype--auto-ddl)
4. [Clean / Hexagonal Architecture & Code Layout](#-clean--hexagonal-architecture--code-layout)
5. [Heterogeneous Database Adapters Matrix](#-heterogeneous-database-adapters-matrix)
6. [API Catalog & Swagger Documentation](#-api-catalog--swagger-documentation)
7. [Security, RBAC & Multi-Tenancy](#-security-rbac--multi-tenancy)
8. [Real-Time Telemetry & SSE Pub/Sub Engine](#-real-time-telemetry--sse-pubsub-engine)
9. [Webhooks & Audit Trail Engine](#-webhooks--audit-trail-engine)
10. [Local Development & Getting Started](#-local-development--getting-started)
11. [CI/CD Checks & Testing Standards](#-cicd-checks--testing-standards)

---

## 🚀 System Overview & Key Capabilities

- **Cross-Engine Migration Pipeline**: Bi-directional data and schema transfer across PostgreSQL, MySQL, MongoDB, and SQLite.
- **Memory-Safe Bounded Channels**: Decoupled source reader and target writer goroutines synchronized over buffered Go channels (`chan domain.RowBatch, cap=4`), preventing Out-Of-Memory (OOM) failures regardless of table row counts.
- **Auto-DDL Synthesizer**: Automatically analyzes source schemas, maps native column data types into canonical types, and synthesizes SQL/NoSQL DDL statements to provision non-existent destination tables prior to ingestion.
- **Live Physics Telemetry**: In-flight metric computation providing instantaneous **Throughput (Rows/sec)**, **Bandwidth (MB/s)**, **Batch Latency (ms)**, and **Progress Percentages** streamed over HTTP Server-Sent Events (SSE).
- **Concurrency Collision Guard**: Concurrency coordinator utilizing thread-safe `sync.Map` locks (`sourceConnID:targetConnID:table`) preventing duplicate concurrent execution against identical workloads.
- **Cooperative Cancellation**: Graceful job abort mechanism leveraging Go `context.Context` cancellation trees that stop pipelines safely at the nearest batch boundary without data corruption.
- **Enterprise Security**: AES-256-GCM encryption for stored connection credentials and URIs, JWT-based sliding sessions, email OTP verification, and strict Organization/Project-scoped RBAC authorization.

---

## 🏛 High-Level Design (HLD) Architecture

### 1. Architectural Infographic

![SeaSyn Migration Engine HLD Architecture](docs/assets/migration_engine_hld.jpg)

---

### 2. Architectural Layers Breakdown

```mermaid
flowchart TB
    %% ==========================================
    %% CLIENT & PRESENTATION LAYER
    %% ==========================================
    subgraph ClientLayer ["1. Client & Presentation Layer (Migration Studio)"]
        UI_Studio["Frontend UI: Migration Studio & Analytics Dashboard"]
        UI_Wizard["Migration Launch Modal\n(Source, Target, Table, BatchSize)"]
        UI_Chart["Live Telemetry Charts\n(Moving RPS, Bandwidth MB/s, Latency ms)"]
        UI_SSE["SSE Client (EventSource)\n/v1/.../migrations/:id/progress"]
    end

    %% ==========================================
    %% API & SECURITY GATEWAY
    %% ==========================================
    subgraph GatewayLayer ["2. API & Security Gateway (Fiber v2 HTTP)"]
        GW_Router["Fiber Engine & URL Router"]
        GW_Auth["JWT Authentication Middleware\n(Extracts & Validates User Claims)"]
        GW_RBAC["RBAC & Tenant Guard\n(Requires Admin/Owner Role)"]
        GW_Val["Request DTO Validation\n(UUIDs, Identifier Sanitization)"]
        GW_SSE_Hdlr["SSE Streaming Handler\n(Chunked Transfer & Keepalive)"]
    end

    %% ==========================================
    %% CONTROL PLANE & ORCHESTRATION
    %% ==========================================
    subgraph ControlPlane ["3. Orchestration & Control Plane (Migration Service)"]
        JobService["Migration Service\n(Lifecycle Coordinator)"]
        ExecLock["Concurrent Execution Lock\n(sync.Map: srcConn:dstConn:table)"]
        CancelRegistry["Cancellation Controller\n(sync.Map: jobID -> context.CancelFunc)"]
        StateEngine["Job State Coordinator\n(Pending -> Running -> Completed/Failed)"]
        AuditEmitter["Audit Log Service\n(migration.started/completed/failed)"]
        WebhookEmitter["Webhook Dispatcher\n(Async HTTP Dispatch to Integrations)"]
    end

    %% ==========================================
    %% STREAMING PIPELINE & EXECUTION CORE
    %% ==========================================
    subgraph ExecutionCore ["4. Streaming Pipeline Core (Streamer)"]
        Streamer["Streamer Engine"]
        CryptoEngine["Credential Decryptor\n(AES-GCM Decryption of URI & Passwords)"]
        Preflight["Pre-flight Inspector\n(Source Row Count & Target Check)"]
        SchemaTransformer["Canonical Schema Transformer\n(Source Types -> SeasonType -> Target Types)"]
        DDLEngine["Auto-DDL Synthesizer\n(Generates & Applies Missing CREATE TABLE)"]
        
        subgraph PipelineChannels ["In-Memory Pipeline (Bounded Channels)"]
            RowChannel["Buffered Row Batch Channel\n(chan domain.RowBatch, cap=4)"]
            ErrChannel["Error Channel\n(chan error, cap=1)"]
        end

        MetricsComputer["Telemetry Computer\n(Computes RPS, Bandwidth, Batch Latency)"]
    end

    %% ==========================================
    %% REAL-TIME TELEMETRY FAN-OUT
    %% ==========================================
    subgraph TelemetryHub ["5. Real-Time Telemetry Broker (ProgressHub)"]
        Hub["ProgressHub (In-Memory Pub/Sub)"]
        SubRegistry["Subscriber Map (sync.RWMutex)\nmap[jobID][]chan MigrationProgress"]
        Broadcaster["Non-Blocking Broadcaster\n(Drops Slow Clients to Avoid Pipeline Pauses)"]
    end

    %% ==========================================
    %% HETEROGENEOUS ADAPTER LAYER
    %% ==========================================
    subgraph AdapterLayer ["6. Heterogeneous Driver Adapters (Hexagonal Ports)"]
        Registry["Adapter Registry (Engine Factory)"]
        PGAdapter["PostgreSQL Adapter (pgx/v5)\nStreamRows: ORDER BY ctid\nBulkInsert: Multi-row parameterized"]
        MySQLAdapter["MySQL Adapter (go-sql-driver)\nStreamRows: Keyset/Offset paging\nBulkInsert: Multi-value INSERT"]
        MongoAdapter["MongoDB Adapter (mongo-driver)\nStreamRows: Cursor batching\nBulkInsert: InsertMany (BSON)"]
        SQLiteAdapter["SQLite Adapter (modernc)\nStreamRows: Fast local cursor\nBulkInsert: Transaction batch"]
    end

    %% ==========================================
    %% INFRASTRUCTURE & STORAGE
    %% ==========================================
    subgraph StorageLayer ["7. Storage & Infrastructure Layer"]
        SystemDB[("SeaSyn Core DB (PostgreSQL)\nmigration_jobs, audit_logs, users")]
        SourceDB[("Source Database\n(Postgres, MySQL, Mongo, SQLite)")]
        TargetDB[("Target Database\n(Postgres, MySQL, Mongo, SQLite)")]
    end

    %% ==========================================
    %% DATA FLOW & WIRING
    %% ==========================================
    UI_Wizard -->|"POST /v1/.../migrations"| GW_Router
    UI_SSE -->|"GET /v1/.../migrations/:id/progress"| GW_Router
    GW_Router --> GW_Auth --> GW_RBAC --> GW_Val

    GW_Val -->|"StartMigration()"| JobService
    GW_Router -->|"CancelMigration()"| JobService
    GW_Router -->|"ProgressStream()"| GW_SSE_Hdlr
    GW_SSE_Hdlr <-->|"Subscribe / Read"| Hub

    JobService -->|"Verify & Acquire Lock"| ExecLock
    JobService -->|"Register context.CancelFunc"| CancelRegistry
    JobService -->|"Create & Update Job Record"| SystemDB
    JobService -->|"Emit Event"| AuditEmitter
    JobService -->|"Dispatch Hook"| WebhookEmitter
    JobService -->|"Launch Goroutine"| Streamer

    Streamer -->|"Decrypt Passwords & URIs"| CryptoEngine
    Streamer -->|"Resolve Driver Adapters"| Registry
    Registry --> PGAdapter
    Registry --> MySQLAdapter
    Registry --> MongoAdapter
    Registry --> SQLiteAdapter

    Streamer -->|"1. Count Rows & Check Target"| Preflight
    Preflight --> SourceDB
    Streamer -->|"2. Schema Diff & Auto-Provision"| SchemaTransformer
    SchemaTransformer --> DDLEngine
    DDLEngine -->|"Execute CREATE TABLE if needed"| TargetDB

    Streamer -->|"3. Open StreamRows()"| SourceDB
    SourceDB -.->|"Chunked Batches"| RowChannel
    SourceDB -.->|"Read Errors"| ErrChannel

    RowChannel -->|"4. Consume Batch"| Streamer
    Streamer -->|"5. BulkInsert(rows)"| TargetDB
    Streamer -->|"6. Calculate Velocity & Latency"| MetricsComputer
    MetricsComputer -->|"7. Broadcast(Progress)"| Hub

    Hub --> Broadcaster
    Broadcaster --> SubRegistry
    SubRegistry -->|"Push Event Payload"| GW_SSE_Hdlr
    GW_SSE_Hdlr -->|"SSE Stream: data: {...}"| UI_Chart
```

---

### 3. End-to-End Migration Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / API Client
    participant GW as Fiber Gateway
    participant Auth as Auth & RBAC Guard
    participant Svc as Migration Service
    participant Hub as ProgressHub
    participant Str as Streamer Core
    participant Src as Source Database
    participant Dst as Target Database
    participant DB as SeaSyn System DB

    Client->>GW: POST /v1/organizations/:orgID/projects/:projectID/migrations
    GW->>Auth: Validate JWT & Verify Admin/Owner Role
    Auth-->>GW: OK (claims verified)
    GW->>Svc: StartMigration(req)

    Svc->>Svc: Verify Lock (srcConnID:dstConnID:table)
    Svc->>Src: CountSourceRows()
    Src-->>Svc: totalRows (e.g. 500,000)
    Svc->>DB: INSERT migration_job (status: pending, total_rows)
    Svc-->>GW: 201 Created (JobID, totalRows, status: pending)
    GW-->>Client: Job Created Response

    par Real-Time Telemetry Subscription
        Client->>GW: GET /v1/.../migrations/:jobID/progress
        GW->>Hub: Subscribe(jobID)
        Hub-->>GW: progressChan
        GW-->>Client: 200 OK (Content-Type: text/event-stream)
    and Background Worker Execution
        Svc->>Str: go Stream(bgCtx, job)
        Str->>Src: Inspect Source Schema
        Src-->>Str: Source TableSchema
        Str->>Dst: ListTables()
        
        opt Target Table Does Not Exist
            Str->>Str: TransformSchema(SeasonType) -> GenerateTargetDDL()
            Str->>Dst: ExecDDL(CREATE TABLE ...)
        end

        Str->>Src: StreamRows(batchSize=500)
        loop Chunked Streaming Loop
            Src-->>Str: RowBatch (Rows, Index, IsLast)
            Str->>Dst: BulkInsert(rows)
            Dst-->>Str: Batch Committed
            Str->>Str: Compute RPS, Bandwidth (MB/s), Latency (ms)
            Str->>Hub: Broadcast(MigrationProgress)
            Hub-->>GW: Non-blocking fan-out
            GW-->>Client: data: {"percentage": 42, "current_rps": 2400, "bandwidth_formatted": "3.8 MB/s", ...}
        end

        Str-->>Svc: Stream Complete (0 errors)
        Svc->>DB: UPDATE migration_job (status: completed, 100%)
        Svc->>Hub: Broadcast(Status: Completed, 100%)
        Svc->>Hub: Close(jobID)
        Svc->>Svc: Release Execution Lock & CancelFunc
    end
```

---

### 4. Core Systems Engineering Innovations

| Engineering Dimension | Implementation Strategy | Architectural Benefit |
|---|---|---|
| **Memory Isolation (Zero-OOM)** | Bounded Go Channel (`cap=4`) between Reader & Writer | Strict memory bound: memory consumption stays flat (`<64MB`) whether streaming 100 rows or 50,000,000 rows. |
| **Backpressure Propagation** | Synchronous Channel Writes on slow database commits | Slow downstream targets automatically throttle the source query loop without intermediate disk spooling. |
| **Collision Prevention** | Composite `sync.Map` mutex: `srcID:dstID:table` | Prevents split-brain data states caused by triggering duplicate parallel migrations on identical datasets. |
| **Zero-Leak Teardown** | Cooperative `context.WithCancel()` propagation | Immediate cooperative abort on user cancellation; releases socket descriptors and transaction locks gracefully. |
| **Telemetry Non-Blocking Drop** | `select { case ch <- event: default: }` in `ProgressHub` | Slow network clients or paused browser tabs never stall the high-speed database write loop. |

---

## 🔄 Universal Type System (`SeasonType`) & Auto-DDL

Databases utilize divergent type systems (e.g. Postgres `TIMESTAMPTZ` vs MySQL `DATETIME(6)` vs MongoDB BSON `date`). SeaSyn resolves this through **`SeasonType`**, an intermediate canonical representation.

```mermaid
flowchart LR
    subgraph SourceEngines ["Source Native Types"]
        PG_T["PostgreSQL\n(UUID, JSONB, TIMESTAMPTZ, BYTEA)"]
        MY_T["MySQL\n(CHAR(36), JSON, DATETIME, LONGBLOB)"]
        MO_T["MongoDB\n(BSON Object, Date, BinData, Int64)"]
        SQ_T["SQLite\n(TEXT, BLOB, INTEGER, REAL)"]
    end

    subgraph CanonicalCore ["Universal Type Intermediate"]
        ST["SeasonType Canonical System\n• SeasonTypeInt\n• SeasonTypeString\n• SeasonTypeTimestamp\n• SeasonTypeJSON\n• SeasonTypeUUID\n• SeasonTypeBinary\n• SeasonTypeDecimal"]
    end

    subgraph TargetEngines ["Target Dialect Synthesizer"]
        T_PG["Postgres DDL Generator"]
        T_MY["MySQL DDL Generator"]
        T_MO["MongoDB Schema Validator"]
        T_SQ["SQLite DDL Generator"]
    end

    PG_T --> ST
    MY_T --> ST
    MO_T --> ST
    SQ_T --> ST

    ST --> T_PG
    ST --> T_MY
    ST --> T_MO
    ST --> T_SQ
```

### Type Translation Matrix

| `SeasonType` | PostgreSQL | MySQL | MongoDB | SQLite |
|---|---|---|---|---|
| `SeasonTypeInt` | `BIGINT` | `BIGINT` | `int` / `long` | `INTEGER` |
| `SeasonTypeString` | `TEXT` | `TEXT` | `string` | `TEXT` |
| `SeasonTypeBool` | `BOOLEAN` | `TINYINT(1)` | `bool` | `INTEGER` |
| `SeasonTypeTimestamp` | `TIMESTAMPTZ` | `DATETIME(6)` | `date` | `TEXT` |
| `SeasonTypeJSON` | `JSONB` | `JSON` | `object` | `TEXT` |
| `SeasonTypeFloat` | `DOUBLE PRECISION` | `DOUBLE` | `double` | `REAL` |
| `SeasonTypeDecimal` | `NUMERIC` | `DECIMAL(38,18)` | `decimal` | `NUMERIC` |
| `SeasonTypeBinary` | `BYTEA` | `LONGBLOB` | `binData` | `BLOB` |
| `SeasonTypeUUID` | `UUID` | `CHAR(36)` | `string` | `TEXT` |

---

## 📂 Clean / Hexagonal Architecture & Code Layout

SeaSyn adheres strictly to Hexagonal (Ports & Adapters) architectural design principles to ensure testability and engine independence:

```
backend/
├── cmd/
│   └── server/
│       └── main.go                 # Dependency injection, Fiber router bootstrap, and server entrypoint
├── docs/                           # Auto-generated Swagger 2.0 / OpenAPI 3.0 specs (docs.go, swagger.json)
│   └── assets/                     # Architecture diagram assets and infographics
├── internal/
│   ├── adapters/                   # Driver implementations conforming to Ports (Driven Adapters)
│   │   ├── connector.go            # Live database ping, latency measurement, and test diagnostics
│   │   ├── mongodb/                # MongoDB official mongo-driver adapter
│   │   ├── mysql/                  # MySQL go-sql-driver adapter
│   │   ├── postgres/               # PostgreSQL pgx/v5 driver adapter
│   │   ├── registry/               # Engine registry factory
│   │   └── sqlite/                 # SQLite modernc pure-Go driver adapter
│   ├── config/                     # Environment variable loading & validation (godotenv)
│   ├── domain/                     # Pure domain entities, DTOs, Enums, and Value Objects
│   │   ├── analytics.go            # Analytics charts, quotas, topologies, and heatmap structures
│   │   ├── migration.go            # Migration jobs, telemetry payloads, batch definitions
│   │   ├── project.go              # Projects, database connections, and credentials
│   │   ├── schema.go               # TableSchema, ColumnSchema, SeasonType abstractions
│   │   ├── user.go                 # Users, credentials, organizations, roles
│   │   └── webhook.go              # Webhook configurations and delivery logs
│   ├── http/                       # HTTP Transport Layer (Driving Adapters)
│   │   ├── handlers/               # Fiber HTTP controllers (Auth, Orgs, Projects, Migrations, etc.)
│   │   └── middleware/             # Security middleware (JWT Auth, RBAC, Rate Limiting, Verification)
│   ├── ports/                      # Inbound (Services) and Outbound (Repositories/Adapters) Interfaces
│   ├── repository/                 # Database persistence layer using GORM
│   ├── services/                   # Core business logic orchestrators
│   │   ├── analytics/              # Aggregation engines for org, project, and migration stats
│   │   ├── auth/                   # Authentication, Argon2id hashing, and JWT token rotation
│   │   ├── editor/                 # Live schema diffing and SQL data exploration
│   │   ├── migration/              # Streamer, ProgressHub, and Type Transformers
│   │   ├── orgs/                   # Organization tenancy and membership RBAC
│   │   ├── project/                # Project lifecycle and AES-GCM credential encryption
│   │   └── webhooks/               # HMAC-SHA256 event dispatchers with worker pool
│   └── templates/                  # HTML email templates for OTP verification
└── pkg/                            # Reusable platform packages
    ├── crypto/                     # AES-256-GCM symmetric cipher encryption
    ├── errors/                     # Standardized application error definitions
    └── mail/                       # SMTP email delivery client with TLS support
```

---

## 🔌 Heterogeneous Database Adapters Matrix

| Engine | Driver Package | Batch Read Implementation | Bulk Insert Strategy | DDL Execution |
|---|---|---|---|---|
| **PostgreSQL** | `github.com/jackc/pgx/v5` | `ORDER BY ctid LIMIT $1 OFFSET $2` | Multi-row parameterized `INSERT INTO ... VALUES ($1, $2), ...` | Native PostgreSQL DDL |
| **MySQL** | `github.com/go-sql-driver/mysql` | Keyset pagination / `LIMIT ? OFFSET ?` | Multi-value SQL `INSERT INTO ... VALUES (?, ?), ...` | Native MySQL DDL |
| **MongoDB** | `go.mongodb.org/mongo-driver` | Cursor-based chunked collection scan | `collection.InsertMany(ctx, docs)` with BSON maps | JSON Schema Validator |
| **SQLite** | `modernc.org/sqlite` (Pure Go) | Fast local sequential cursor | Single-transaction parameterized batch insertion | SQLite `CREATE TABLE` |

---

## 📡 API Catalog & Swagger Documentation

The backend exposes a RESTful API versioned under `/v1`. Interactive OpenAPI documentation with a built-in sandbox is served at `/swagger/index.html`.

> **Swagger Security Note**:
> - **Basic Auth**: Accessing the documentation route is secured with Basic Auth (configurable via `SWAGGER_USER` and `SWAGGER_PASS`).
> - **Bearer Auth**: Authenticated endpoints display the 🔒 **Authorize** lock icon. Click "Authorize" and enter `Bearer <your_jwt_access_token>`.

### Core API Groups

| Area | HTTP Method | Endpoint Path | Description | Access Control |
|---|---|---|---|---|
| **Auth** | `POST` | `/v1/auth/signup` | Register new user | Public |
| **Auth** | `POST` | `/v1/auth/login` | Authenticate user & issue JWT tokens | Public |
| **Auth** | `POST` | `/v1/auth/refresh` | Rotate access token via refresh token | Public / Cookie |
| **Auth** | `GET` | `/v1/auth/me` | Fetch authenticated user profile | Bearer Token |
| **Organizations** | `POST` | `/v1/organizations` | Create an organization (caller becomes Owner) | Bearer Token |
| **Organizations** | `GET` | `/v1/organizations` | List organizations user belongs to | Bearer Token |
| **Projects** | `POST` | `/v1/organizations/:orgID/projects` | Create a sync project | Admin / Owner |
| **Connections** | `POST` | `/v1/organizations/:orgID/projects/:projectID/connections` | Save database connection (encrypted) | Admin / Owner |
| **Connections** | `POST` | `/v1/organizations/:orgID/projects/:projectID/connections/test` | Test live database connectivity & ping | Admin / Owner |
| **Schema Editor** | `POST` | `/v1/organizations/:orgID/projects/:projectID/schema/diff` | Compare schemas between two connections | Member+ |
| **Data Explorer** | `GET` | `/v1/.../connections/:connID/tables/:table/rows` | Query table rows with filters & pagination | Member+ |
| **Migration** | `POST` | `/v1/organizations/:orgID/projects/:projectID/migrations` | Start background database migration | Admin / Owner |
| **Migration** | `GET` | `/v1/organizations/:orgID/projects/:projectID/migrations` | List migration history | Member+ |
| **Migration** | `GET` | `/v1/organizations/:orgID/projects/:projectID/migrations/:jobID` | Get migration job status | Member+ |
| **Migration** | `DELETE` | `/v1/organizations/:orgID/projects/:projectID/migrations/:jobID` | Cooperatively cancel a running migration | Admin / Owner |
| **Migration** | `GET` | `/v1/.../migrations/:jobID/progress` | **Real-time SSE Progress Stream** | Member+ |
| **Analytics** | `GET` | `/v1/organizations/:orgID/analytics/overview` | Organization quotas, velocity, and health | Member+ |
| **Analytics** | `GET` | `/v1/organizations/:orgID/projects/:projectID/analytics` | Project topology flow and 14-day heatmap | Member+ |
| **Analytics** | `GET` | `/v1/.../projects/:projectID/migrations/analytics` | Migration Studio historical intelligence | Member+ |
| **Webhooks** | `POST` | `/v1/organizations/:orgID/webhooks` | Register an outbound webhook | Admin / Owner |
| **Audit Logs** | `GET` | `/v1/organizations/:orgID/audit-logs` | Query organization security audit trail | Admin / Owner |

---

## 🔒 Security, RBAC & Multi-Tenancy

### 1. Cryptographic Protection
- **Credentials at Rest**: Database passwords and URI strings are encrypted using **AES-256-GCM** with unique nonces before being written to PostgreSQL (`pkg/crypto/encryptor.go`).
- **Password Hashing**: User authentication uses **Argon2id** (memory-hard, GPU-resistant password hashing).

### 2. Multi-Tiered Session Authentication
- **Dual Transport**: Supports both `Authorization: Bearer <token>` headers (for API clients, Swagger, CLI) and `HttpOnly` secure cookies (for browser sessions).
- **Sliding Window Refresh**: Automated, secure access token refresh without interrupting active user sessions.
- **Swagger Isolation**: Strict `Referer` detection disables cookie fallback in Swagger UI to force explicit authorization via the Swagger lock dialog.

### 3. Role-Based Access Control (RBAC) Hierarchy
- 👑 **Owner**: Full tenant control, organization deletion, billing, role modifications.
- 🛡️ **Admin**: Launch/cancel migrations, register database connections, configure webhooks, view audit logs.
- 👤 **Member**: Inspect schemas, explore data, view analytics dashboards.
- 👁️ **Viewer**: Read-only access to projects and historical summaries.

---

## 📊 Real-Time Telemetry & SSE Pub/Sub Engine

During an active migration, `Streamer` continuously computes execution physics on every batch:

$$\text{Current RPS} = \frac{\text{Batch Rows}}{\Delta t}$$

$$\text{Bandwidth} = \frac{\text{Estimated Batch Bytes}}{\Delta t}$$

### SSE Telemetry Payload (`/migrations/:jobID/progress`)
```json
{
  "job_id": "4b68e998-90b9-4a0b-8bf1-2292f703e4dc",
  "state": "running",
  "migrated_rows": 145000,
  "total_rows": 500000,
  "percentage": 29.0,
  "message": "Batch 290 processed (500 rows)",
  "timestamp": "2026-09-19T10:45:00.123Z",
  "current_rps": 2840.5,
  "bandwidth_bytes_per_sec": 4125820.0,
  "bandwidth_formatted": "3.9 MB/s",
  "bytes_transferred": 119648780,
  "bytes_transferred_formatted": "114.1 MB",
  "batch_index": 290,
  "batch_latency_ms": 176
}
```

---

## 🔔 Webhooks & Audit Trail Engine

SeaSyn records all tenant actions and can broadcast cryptographically signed webhook notifications to external monitoring services or CI/CD pipelines.

- **HMAC-SHA256 Signatures**: Every webhook payload includes a header `X-Seasyn-Signature: sha256=<hash>` signed with the webhook secret.
- **Supported Events**:
  - `migration.started`, `migration.completed`, `migration.failed`, `migration.cancelled`
  - `project.created`, `project.deleted`
  - `connection.created`, `connection.deleted`
  - `member.invited`, `member.removed`, `member.role_updated`
- **Asynchronous Dispatch**: Webhooks are dispatched via a decoupled worker pool with delivery logging and latency tracking.

---

## 🛠 Local Development & Getting Started

### Prerequisites
- **Go**: Version `1.23+` (compatible with `1.25.x`)
- **PostgreSQL**: Version `15+` (local or managed Neon/Supabase)
- **Swag CLI**: `go install github.com/swaggo/swag/cmd/swag@latest`
- **golangci-lint**: `v1.60+`

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Prince-695/seasyn.git
cd seasyn/backend

# Copy environment configuration
cp .env.example .env
```

Edit `.env` to configure your PostgreSQL connection string and secrets:
```ini
PORT=8080
ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/seasyn?sslmode=disable
DB_RUN=true
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
SWAGGER_USER=Seasyn_Admin
SWAGGER_PASS=SeasynDev@0618
```

### 2. Download Dependencies
```bash
go mod tidy
```

### 3. Generate Swagger Documentation
```bash
swag init -g cmd/server/main.go -o docs
```

### 4. Run the Dev Server
```bash
go run cmd/server/main.go
```

The server will perform GORM AutoMigrate against your database and listen on port `8080`:
- **API Endpoint**: `http://localhost:8080/v1`
- **Health Check**: `http://localhost:8080/health`
- **Swagger Documentation**: `http://localhost:8080/swagger/index.html`

---

## 🧪 CI/CD Checks & Testing Standards

Per the repository CI specifications ([Docs/ci.md](../Docs/ci.md)), run all checks before creating pull requests:

```bash
# 1. Format Code
find . -name '*.go' -print0 | xargs -0 gofmt -w

# 2. Check Formatting Compliance
if [ -n "$(find . -name '*.go' -print0 | xargs -0 gofmt -l)" ]; then
  echo "Go files are not formatted"
  exit 1
fi

# 3. Static Analysis & Linting
go vet ./...
golangci-lint run ./...

# 4. Run Full Unit & Integration Test Suite
go test -count=1 ./...

# 5. Compile Backend Binary
go build ./...
```