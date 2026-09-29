# SEASYN Backend Development Plan

This plan outlines the steps to build the SEASYN backend, focusing on Swagger integration and the Authentication module, as per the analyzed PRD and Implementation Plan.

## Phase 1: Infrastructure & Swagger Setup

1.  **Migrate to Fiber:**
    *   Install `github.com/gofiber/fiber/v2`.
    *   Refactor `cmd/server/main.go` to use Fiber.
2.  **Integrate Swagger:**
    *   Install `github.com/swaggo/swag` and `github.com/gofiber/swagger`.
    *   Add Swagger annotations to the main entry point.
    *   Register `/swagger/*` route in Fiber.
    *   Initialize Swagger using `swag init`.

## Phase 2: Authentication Module

1.  **Domain & Ports:**
    *   Define `User` struct in `internal/domain/user.go`.
    *   Define `UserRepository` and `AuthService` interfaces in `internal/ports/`.
2.  **Persistence (GORM):**
    *   Create `UserModel` in `internal/repository/models.go`.
    *   Implement `UserRepository` in `internal/repository/user_repo.go`.
3.  **Business Logic:**
    *   Implement `AuthService` in `internal/services/auth/service.go` (Registration with Bcrypt, Login with JWT).
4.  **Transport (Fiber Handlers):**
    *   Implement `AuthHandler` in `internal/http/handlers/auth_handler.go`.
    *   Add Swagger annotations for `Register` and `Login` endpoints.
5.  **Middleware:**
    *   Implement JWT validation middleware in `internal/http/middleware/auth.go`.

## Phase 3: Wiring & Verification

1.  **Dependency Injection:**
    *   Wire everything in `cmd/server/main.go`.
2.  **Swagger Documentation:**
    *   Ensure all API endpoints are listed in Swagger.
3.  **Manual Testing:**
    *   Verify `Register` and `Login` via Swagger UI.
    *   Verify JWT protection on a dummy protected route.

## Commit Strategy
*   Small, atomic commits for each step (e.g., "feat: setup fiber and swagger", "feat: implement auth service").
*   Follow Conventional Commits.
