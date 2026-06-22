package config

import (
	"log"
	"os"
	"time"
)

type Config struct {
	Port               string
	Env                string
	AllowedOrigins     string
	DatabaseURL        string
	JWTSecret          string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
	SMTPHost           string
	SMTPPort           string
	SMTPUser           string
	SMTPPass           string
	MailFrom           string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleCallbackURL  string
	GitHubClientID     string
	GitHubClientSecret string
	GitHubCallbackURL  string
	SwaggerUser        string
	SwaggerPass        string
	FrontendURL        string
}

func Load() *Config {
	env := getEnv("ENV", "development")
	jwtSecret := getEnv("JWT_SECRET", "default_secret")

	// BUG-05 fix: a predictable default secret in production allows anyone to forge JWTs.
	// Fail fast at startup rather than silently allowing insecure deployments.
	if env != "development" && (jwtSecret == "" || jwtSecret == "default_secret") {
		log.Fatal("FATAL: JWT_SECRET must be set to a strong, random value in non-development environments")
	}

	return &Config{
		Port:               getEnv("PORT", "8080"),
		Env:                env,
		AllowedOrigins:     getEnv("ALLOWED_ORIGINS", "http://localhost:5173,"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		JWTSecret:          jwtSecret,
		AccessTokenExpiry:  getEnvDuration("ACCESS_TOKEN_EXPIRY", 30*time.Minute),
		RefreshTokenExpiry: getEnvDuration("REFRESH_TOKEN_EXPIRY", 168*time.Hour),
		SMTPHost:           getEnv("SMTP_HOST", ""),
		SMTPPort:           getEnv("SMTP_PORT", "587"),
		SMTPUser:           getEnv("SMTP_USER", ""),
		SMTPPass:           getEnv("SMTP_PASS", ""),
		MailFrom:           getEnv("MAIL_FROM", "noreply@seasyn.app"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleCallbackURL:  getEnv("GOOGLE_CALLBACK_URL", "http://localhost:8080/v1/auth/google/callback"),
		GitHubClientID:     getEnv("GITHUB_CLIENT_ID", ""),
		GitHubClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
		GitHubCallbackURL:  getEnv("GITHUB_CALLBACK_URL", "http://localhost:8080/v1/auth/github/callback"),
		SwaggerUser:        getEnv("SWAGGER_USER", "admin"),
		SwaggerPass:        getEnv("SWAGGER_PASS", "admin"),
		FrontendURL:        getEnv("FRONTEND_URL", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	value := getEnv(key, "")
	if value == "" {
		return fallback
	}
	d, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return d
}
