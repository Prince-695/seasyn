# Day 01 — Backend Scaffold Lesson

Today's goal is not business logic. Today's goal is to create the map of the backend and understand what every area is responsible for.

## Go Basics From Today's Files

Every `.go` file starts with a `package` line.

```go
package domain
```

That line means: "this file belongs to the `domain` package." A package is Go's way of grouping related code.

Most starter files also contain a tiny type:

```go
type Project struct{}
```

Line by line:
- `type` tells Go we are defining a new named type.
- `Project` is the name of the type.
- `struct{}` means this type is a struct with no fields yet.

We use empty structs today because we are creating file boundaries first. Later we will add fields like `ID`, `Name`, `CreatedAt`, and methods.

Some files contain a tiny function:

```go
func RegisterRoutes() {}
```

Line by line:
- `func` tells Go we are defining a function.
- `RegisterRoutes` is the function name.
- `()` means it receives no parameters yet.
- `{}` is the function body. Empty today, real route wiring later.

## Folder Responsibilities

`backend/cmd/server`

This is the application entrypoint. In Go, `cmd/<app-name>` is a common convention for runnable programs. The file `cmd/server/main.go` contains `package main` and `func main()`, which means Go can compile it as an executable server.

`backend/internal`

This folder contains private application code. Go gives `internal` special meaning: packages inside it cannot be imported by random outside projects. That protects our app internals from becoming accidental public APIs.

`backend/internal/config`

This will read environment variables like `PORT`, `DATABASE_URL`, JWT keys, CORS settings, and migration limits. Keeping config in one place prevents random `os.Getenv` calls all over the project.

`backend/internal/domain`

This is the clean business language of SEASYN. It should not know about HTTP, GORM, Fiber, Postgres drivers, Mongo drivers, or logging libraries. Examples: `User`, `Project`, `MigrationJob`, `Schema`, `DBType`.

`backend/internal/ports`

Ports are interfaces: promises about behavior. Services will depend on these interfaces instead of concrete implementations. This is the core of Clean Architecture and makes testing much easier.

`backend/internal/adapters`

Adapters are concrete implementations that talk to the outside world. PostgreSQL, MongoDB, MySQL, and SQLite each get their own package because each database behaves differently.

`backend/internal/adapters/registry`

The registry will map a requested DB type, like `postgres`, to the correct adapter. This prevents services from importing every database implementation directly.

`backend/internal/repository`

This is only for SEASYN's own internal PostgreSQL metadata database. We will use GORM here for `users`, `projects`, and `migration_jobs`. User-provided databases do not go through this repository layer.

`backend/internal/services`

Services hold business rules. For example, project ownership checks belong in `services/project`, not inside HTTP handlers and not inside GORM models.

`backend/internal/http`

This owns the transport layer: routes, server setup, middleware, and handlers. HTTP code should parse requests, call services, and return responses. It should not contain deep business logic.

`backend/pkg`

This folder is for reusable helper packages that are not tied to one feature. Examples: logging wrapper, app errors, validation helpers, and crypto helpers.

`backend/migrations`

This folder stores versioned SQL files for SEASYN's own internal Postgres schema. We created `.up.sql` files for applying changes and `.down.sql` files for rolling them back.

## Important Design Decision

We will use GORM only for SEASYN's internal metadata database.

That means:
- GORM is good for normal app records like users and projects.
- User databases still use adapters because migrations need database-specific schema inspection, streaming reads, and bulk writes.

This split keeps the backend clean: internal app storage is convenient, external database migration stays precise.
