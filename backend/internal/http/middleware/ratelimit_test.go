package middleware_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/middleware"
	"github.com/gofiber/fiber/v2"
)

func TestRateLimitGeneral(t *testing.T) {
	app := fiber.New()
	app.Use(middleware.RateLimitGeneral())

	app.Get("/test", func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("healthy")
	})

	app.Get("/swagger/index.html", func(c *fiber.Ctx) error {
		return c.SendString("swagger-ui")
	})

	// 1. Initial request should succeed with rate limit headers
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
	if limit := resp.Header.Get("X-RateLimit-Limit"); limit != "120" {
		t.Errorf("expected X-RateLimit-Limit 120, got %s", limit)
	}

	// 2. Health check should not be rate limited
	req = httptest.NewRequest(http.MethodGet, "/health", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected health to return 200, got %d", resp.StatusCode)
	}

	// 3. Swagger should not be rate limited
	req = httptest.NewRequest(http.MethodGet, "/swagger/index.html", nil)
	resp, err = app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected swagger to return 200, got %d", resp.StatusCode)
	}
}

func TestRateLimitHeavy(t *testing.T) {
	app := fiber.New()
	app.Post("/connections/test", middleware.RateLimitHeavy(), func(c *fiber.Ctx) error {
		return c.SendString("connection ok")
	})

	// First 10 requests should succeed
	for i := 1; i <= 10; i++ {
		req := httptest.NewRequest(http.MethodPost, "/connections/test", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("unexpected error at request %d: %v", i, err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected request %d to succeed (200), got %d", i, resp.StatusCode)
		}
	}

	// 11th request should be rejected with 429 Too Many Requests
	req := httptest.NewRequest(http.MethodPost, "/connections/test", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != http.StatusTooManyRequests {
		t.Fatalf("expected request 11 to return 429 Too Many Requests, got %d", resp.StatusCode)
	}

	var res domain.Response
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		t.Fatalf("failed to decode response body: %v", err)
	}
	if res.Success {
		t.Errorf("expected success false, got true")
	}
	expectedErr := "Connection test rate limit exceeded. Please wait before running another connection test."
	if res.Error != expectedErr {
		t.Errorf("expected error %q, got %q", expectedErr, res.Error)
	}
}

func TestRateLimitUserKeyIsolation(t *testing.T) {
	app := fiber.New()

	// Middleware setting user ID from custom header for test isolation
	app.Use(func(c *fiber.Ctx) error {
		if uid := c.Get("X-User-ID"); uid != "" {
			c.Locals("userID", uid)
		}
		return c.Next()
	})
	app.Post("/test-heavy", middleware.RateLimitHeavy(), func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})

	// User 1 uses all 10 heavy tokens
	for i := 1; i <= 10; i++ {
		req := httptest.NewRequest(http.MethodPost, "/test-heavy", nil)
		req.Header.Set("X-User-ID", "user-alpha")
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected user-alpha request %d to succeed, got %d", i, resp.StatusCode)
		}
	}

	// 11th request for user-alpha should be 429
	req := httptest.NewRequest(http.MethodPost, "/test-heavy", nil)
	req.Header.Set("X-User-ID", "user-alpha")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.StatusCode != http.StatusTooManyRequests {
		t.Errorf("expected user-alpha to be rate limited (429), got %d", resp.StatusCode)
	}

	// User 2 should NOT be blocked even though user-alpha reached limit
	reqBeta := httptest.NewRequest(http.MethodPost, "/test-heavy", nil)
	reqBeta.Header.Set("X-User-ID", "user-beta")
	respBeta, err := app.Test(reqBeta)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if respBeta.StatusCode != http.StatusOK {
		t.Errorf("expected user-beta to succeed (200), got %d", respBeta.StatusCode)
	}
}
