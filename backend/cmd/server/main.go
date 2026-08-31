package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/adapters"
	mongoadapter "github.com/Prince-695/seasyn/backend/internal/adapters/mongodb"
	pgadapter "github.com/Prince-695/seasyn/backend/internal/adapters/postgres"
	"github.com/Prince-695/seasyn/backend/internal/adapters/registry"
	"github.com/Prince-695/seasyn/backend/internal/config"
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/handlers"
	"github.com/Prince-695/seasyn/backend/internal/http/middleware"
	"github.com/Prince-695/seasyn/backend/internal/repository"
	"github.com/Prince-695/seasyn/backend/internal/services/audit"
	"github.com/Prince-695/seasyn/backend/internal/services/auth"
	"github.com/Prince-695/seasyn/backend/internal/services/editor"
	"github.com/Prince-695/seasyn/backend/internal/services/migration"
	"github.com/Prince-695/seasyn/backend/internal/services/orgs"
	"github.com/Prince-695/seasyn/backend/internal/services/project"
	"github.com/Prince-695/seasyn/backend/internal/services/users"
	"github.com/Prince-695/seasyn/backend/internal/services/webhooks"
	"github.com/Prince-695/seasyn/backend/pkg/crypto"
	"github.com/Prince-695/seasyn/backend/pkg/mail"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/basicauth"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/swagger"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	_ "github.com/Prince-695/seasyn/backend/docs"
)

// @title SEASYN API
// @version 1.0
// @description This is the SEASYN backend server.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @BasePath /
// @schemes https http

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and then your token.

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	// Initialize Postgres
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Conditional Database Sync
	if os.Getenv("DB_RUN") == "true" {
		log.Println("🚀 DB_RUN=true: Syncing database schema...")
		if err := db.AutoMigrate(
			&repository.UserModel{},
			&repository.OTPModel{},
			&repository.OrgModel{},
			&repository.OrgMemberModel{},
			&repository.ProjectModel{},
			&repository.DatabaseConnectionModel{},
			&repository.MigrationJobModel{},
			&repository.AuditLogModel{},
			&repository.WebhookModel{},
			&repository.WebhookDeliveryModel{},
		); err != nil {
			log.Fatalf("Failed to migrate database: %v", err)
		}
		log.Println("✅ Database sync complete.")
	} else {
		log.Println("ℹ️  Skipping database sync. Set DB_RUN=true to enable schema migration.")
	}

	// Initialize Fiber app with Global Error Handler
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	// Global Middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(middleware.ResponseTime())

	// CORS Configuration
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Protected Swagger Route
	app.Get("/swagger/*", basicauth.New(basicauth.Config{
		Users: map[string]string{
			cfg.SwaggerUser: cfg.SwaggerPass,
		},
	}), swagger.New(swagger.Config{
		PersistAuthorization: true,
	}))

	// Public Top-Level Routes
	app.Get("/", func(c *fiber.Ctx) error {
		startTime := c.Locals("startTime")
		var responseTime string
		if startTime != nil {
			responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
		}
		return c.JSON(domain.Response{
			Success:      true,
			Message:      "Welcome to SEASYN API v1",
			ResponseTime: responseTime,
		})
	})
	app.Get("/health", HealthCheck)

	// API v1 Group
	apiV1 := app.Group("/v1")

	// Dependency Injection
	userRepo := repository.NewUserRepository(db)
	otpRepo := repository.NewOTPRepository(db)
	templateDir := filepath.Join("internal", "templates", "email")
	mailService := mail.NewMailService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.MailFrom, templateDir, cfg.FrontendURL)

	authService := auth.NewAuthService(
		userRepo,
		otpRepo,
		mailService,
		cfg.JWTSecret,
		cfg.AccessTokenExpiry,
		cfg.RefreshTokenExpiry,
		cfg.GoogleClientID,
		cfg.GoogleClientSecret,
		cfg.GoogleCallbackURL,
		cfg.GitHubClientID,
		cfg.GitHubClientSecret,
		cfg.GitHubCallbackURL,
	)

	authHandler := handlers.NewAuthHandler(authService, cfg.Env != "development", cfg.FrontendURL)
	authMiddleware := middleware.Auth(authService)
	requireVerified := middleware.RequireVerified(authService)

	usersService := users.NewUsersService(userRepo)
	usersHandler := handlers.NewUsersHandler(usersService)

	orgRepo := repository.NewOrgRepository(db)
	orgService := orgs.NewOrgService(orgRepo, userRepo)
	orgHandler := handlers.NewOrgHandler(orgService)

	encryptor := crypto.NewEncryptor(cfg.JWTSecret)
	connector := adapters.NewConnector()
	projectRepo := repository.NewProjectRepository(db)
	projectService := project.NewProjectService(projectRepo, orgRepo, encryptor, connector)
	projectHandler := handlers.NewProjectHandler(projectService)

	adapterRegistry := registry.NewAdapterRegistry()
	adapterRegistry.Register(domain.DBTypePostgres, pgadapter.NewAdapter())
	adapterRegistry.Register(domain.DBTypeMongoDB, mongoadapter.NewAdapter())

	schemaService := editor.NewSchemaService(projectRepo, orgRepo, adapterRegistry, encryptor)
	schemaHandler := handlers.NewSchemaHandler(schemaService)

	auditRepo := repository.NewAuditRepository(db)
	auditService := audit.NewAuditService(auditRepo, orgRepo)
	auditHandler := handlers.NewAuditHandler(auditService)

	webhookRepo := repository.NewWebhookRepository(db)
	webhookDispatcher := webhooks.NewDispatcher(webhookRepo)
	webhookService := webhooks.NewWebhookService(webhookRepo, orgRepo, webhookDispatcher)
	webhookHandler := handlers.NewWebhookHandler(webhookService)

	migrationRepo := repository.NewMigrationRepository(db)
	progressHub := migration.NewProgressHub()
	streamer := migration.NewStreamer(projectRepo, adapterRegistry, encryptor, progressHub)
	migrationService := migration.NewService(migrationRepo, orgRepo, projectRepo, streamer, progressHub, auditService, webhookService)
	migrationHandler := handlers.NewMigrationHandler(migrationService, progressHub)

	// Register Routes under /v1
	authHandler.RegisterRoutes(apiV1, authMiddleware)
	usersHandler.RegisterRoutes(apiV1, authMiddleware, requireVerified)
	orgHandler.RegisterRoutes(apiV1, authMiddleware, requireVerified)
	projectHandler.RegisterRoutes(apiV1, authMiddleware, requireVerified)
	schemaHandler.RegisterRoutes(apiV1, authMiddleware, requireVerified)
	migrationHandler.RegisterRoutes(apiV1, authMiddleware, requireVerified)
	auditHandler.RegisterRoutes(apiV1, authMiddleware, requireVerified)
	webhookHandler.RegisterRoutes(apiV1, authMiddleware, requireVerified)

	log.Fatal(app.Listen(":" + cfg.Port))
}

// HealthCheck godoc
// @Summary Show the status of server.
// @Description get the status of server.
// @Tags root
// @Accept */*
// @Produce json
// @Success 200 {object} domain.Response
// @Router /health [get]
func HealthCheck(c *fiber.Ctx) error {
	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	return c.Status(fiber.StatusOK).JSON(domain.Response{
		Success:      true,
		Message:      "Server is up and running",
		ResponseTime: responseTime,
	})
}
