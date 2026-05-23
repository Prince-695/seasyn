package main

import (
	"log"

	"github.com/Prince-695/seasyn/backend/internal/config"
	"github.com/Prince-695/seasyn/backend/internal/http/handlers"
	"github.com/Prince-695/seasyn/backend/internal/http/middleware"
	"github.com/Prince-695/seasyn/backend/internal/repository"
	"github.com/Prince-695/seasyn/backend/internal/services/auth"
	"github.com/Prince-695/seasyn/backend/pkg/mail"
	"github.com/gofiber/fiber/v2"
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

// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and then your token.

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(&repository.UserModel{}, &repository.OTPModel{}); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	app := fiber.New()

	// Global Middleware
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(middleware.ResponseTime())

	// Swagger
	app.Get("/swagger/*", swagger.HandlerDefault)

	api := app.Group("/api/v1")

	// Health check (Public)
	api.Get("/health", HealthCheck)

	// Dependency Injection
	userRepo := repository.NewUserRepository(db)
	otpRepo := repository.NewOTPRepository(db)
	mailService := mail.NewMailService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPass, cfg.MailFrom)
	
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
	
	authHandler := handlers.NewAuthHandler(authService)

	// Register Routes
	authHandler.RegisterRoutes(api)

	// Protected Routes Group
	protected := api.Group("/user")
	protected.Use(middleware.Auth(authService))
	protected.Get("/profile", GetProfile)

	log.Fatal(app.Listen(":" + cfg.Port))
}

// GetProfile godoc
// @Summary Get User Profile
// @Description Get profile of the currently authenticated user
// @Tags user
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} domain.User
// @Router /user/profile [get]
func GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	return c.JSON(fiber.Map{"user_id": userID, "message": "This is a protected profile"})
}

// HealthCheck godoc
// @Summary Show the status of server.
// @Description get the status of server.
// @Tags root
// @Accept */*
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func HealthCheck(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status": "ok",
	})
}
