package config

import (
	"os"
	"time"
)

type Config struct {
	Port                string
	Env                 string
	AllowedOrigins      string
	DatabaseURL         string
	RedisURL            string
	JWTSecret           string
	AccessTokenExpiry   time.Duration
	RefreshTokenExpiry  time.Duration
	SMTPHost            string
	SMTPPort            string
	SMTPUser            string
	SMTPPass            string
	MailFrom            string
	GoogleClientID      string
	GoogleClientSecret  string
	GoogleCallbackURL   string
	GitHubClientID      string
	GitHubClientSecret  string
	GitHubCallbackURL   string
	SwaggerUser         string
	SwaggerPass         string
}

func Load() *Config {
	return &Config{
		Port:               getEnv("PORT", "8080"),
		Env:                getEnv("ENV", "development"),
		AllowedOrigins:     getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,https://seasyn.onrender.com"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		RedisURL:           getEnv("REDIS_URL", "redis://localhost:6379/0"),
		JWTSecret:          getEnv("JWT_SECRET", "default_secret"),
		AccessTokenExpiry:  getEnvDuration("ACCESS_TOKEN_EXPIRY", 30*time.Minute),
		RefreshTokenExpiry: getEnvDuration("REFRESH_TOKEN_EXPIRY", 168*time.Hour),
		SMTPHost:           getEnv("SMTP_HOST", ""),
		SMTPPort:           getEnv("SMTP_PORT", "587"),
		SMTPUser:           getEnv("SMTP_USER", ""),
		SMTPPass:           getEnv("SMTP_PASS", ""),
		MailFrom:           getEnv("MAIL_FROM", "noreply@seasyn.app"),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleCallbackURL:  getEnv("GOOGLE_CALLBACK_URL", ""),
		GitHubClientID:     getEnv("GITHUB_CLIENT_ID", ""),
		GitHubClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
		GitHubCallbackURL:  getEnv("GITHUB_CALLBACK_URL", ""),
		SwaggerUser:        getEnv("SWAGGER_USER", "admin"),
		SwaggerPass:        getEnv("SWAGGER_PASS", "admin"),
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
