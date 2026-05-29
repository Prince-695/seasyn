package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/config"
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/handlers"
	"github.com/Prince-695/seasyn/backend/internal/http/middleware"
	"github.com/Prince-695/seasyn/backend/internal/repository"
	"github.com/Prince-695/seasyn/backend/internal/services/auth"
	"github.com/Prince-695/seasyn/backend/pkg/mail"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/basicauth"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/swagger"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
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
// @schemes http https

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

	// Initialize Redis
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}
	redisClient := redis.NewClient(opt)
	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("🚀 Connected to Redis successfully.")

	// Conditional Database Sync
	if os.Getenv("DB_RUN") == "true" {
		log.Println("🚀 DB_RUN=true: Syncing database schema...")
		if err := db.AutoMigrate(&repository.UserModel{}, &repository.OTPModel{}); err != nil {
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
	}), swagger.HandlerDefault)

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
	redisRepo := repository.NewRedisRepository(redisClient)
	mailService := mail.NewMailService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.MailFrom)

	authService := auth.NewAuthService(
		userRepo,
		otpRepo,
		redisRepo,
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

	authHandler := handlers.NewAuthHandler(authService)
	authMiddleware := middleware.Auth(authService)

	// Register Routes under /v1
	authHandler.RegisterRoutes(apiV1, authMiddleware)

	// User Routes under /v1
	userGroup := apiV1.Group("/user")
	userGroup.Use(authMiddleware)
	userGroup.Get("/profile", GetProfile)

	log.Fatal(app.Listen(":" + cfg.Port))
}

// GetProfile godoc
// @Summary Get User Profile
// @Description Get profile of the currently authenticated user
// @Tags user
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} domain.Response{data=map[string]interface{}}
// @Router /v1/user/profile [get]
func GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	return c.JSON(domain.Response{
		Success:      true,
		Message:      "Profile retrieved successfully",
		Data:         fiber.Map{"user_id": userID},
		ResponseTime: responseTime,
	})
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
