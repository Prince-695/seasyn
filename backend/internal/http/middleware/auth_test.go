package middleware_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/http/middleware"
	"github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/gofiber/fiber/v2"
)

type mockAuthService struct {
	validateFn func(token string) (string, error)
	refreshFn  func(ctx context.Context, refreshToken string) (*domain.AuthResponse, error)
	getMeFn    func(ctx context.Context, userID string) (*domain.PublicUser, error)
}

func (m *mockAuthService) Signup(ctx context.Context, req domain.SignupRequest) (*domain.AuthResponse, error) {
	return nil, nil
}
func (m *mockAuthService) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error) {
	return nil, nil
}
func (m *mockAuthService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
	if m.refreshFn != nil {
		return m.refreshFn(ctx, refreshToken)
	}
	return nil, errors.Unauthorized("invalid refresh token")
}
func (m *mockAuthService) ForgotPassword(ctx context.Context, req domain.ForgotPasswordRequest) error {
	return nil
}
func (m *mockAuthService) ResetPassword(ctx context.Context, req domain.ResetPasswordRequest) error {
	return nil
}
func (m *mockAuthService) ChangePassword(ctx context.Context, userID string, req domain.ChangePasswordRequest) error {
	return nil
}
func (m *mockAuthService) SendOTP(ctx context.Context, userID string) error {
	return nil
}
func (m *mockAuthService) VerifyEmail(ctx context.Context, userID string, otp string) error {
	return nil
}
func (m *mockAuthService) Logout(ctx context.Context, accessToken, refreshToken string) error {
	return nil
}
func (m *mockAuthService) GetMe(ctx context.Context, userID string) (*domain.PublicUser, error) {
	if m.getMeFn != nil {
		return m.getMeFn(ctx, userID)
	}
	return &domain.PublicUser{Email: "test@example.com", IsVerified: true}, nil
}
func (m *mockAuthService) ValidateToken(token string) (string, error) {
	if m.validateFn != nil {
		return m.validateFn(token)
	}
	return "", errors.Unauthorized("invalid token")
}
func (m *mockAuthService) GetOAuthURL(provider string) (string, error) {
	return "", nil
}
func (m *mockAuthService) HandleOAuthCallback(ctx context.Context, provider, code, state string) (*domain.AuthResponse, error) {
	return nil, nil
}

func setupTestApp(authSvc *mockAuthService, isProd bool) *fiber.App {
	app := fiber.New()
	app.Get("/protected", middleware.Auth(authSvc, isProd), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"userID": c.Locals("userID"),
		})
	})
	return app
}

func TestAuthMiddleware_ValidAccessToken(t *testing.T) {
	mockSvc := &mockAuthService{
		validateFn: func(token string) (string, error) {
			if token == "valid-access-token" {
				return "usr_123", nil
			}
			return "", errors.Unauthorized("invalid token")
		},
	}

	app := setupTestApp(mockSvc, false)

	// Test via cookie
	req := httptest.NewRequest("GET", "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "access_token", Value: "valid-access-token"})

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", resp.StatusCode)
	}

	// Test via Authorization header
	reqHeader := httptest.NewRequest("GET", "/protected", nil)
	reqHeader.Header.Set("Authorization", "Bearer valid-access-token")

	respHeader, err := app.Test(reqHeader)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if respHeader.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", respHeader.StatusCode)
	}
}

func TestAuthMiddleware_ExpiredAccess_AutoRefreshesViaCookie(t *testing.T) {
	validatedNew := false
	mockSvc := &mockAuthService{
		validateFn: func(token string) (string, error) {
			if token == "new-access-token" {
				validatedNew = true
				return "usr_refreshed_123", nil
			}
			return "", errors.Unauthorized("token expired")
		},
		refreshFn: func(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
			if refreshToken == "valid-refresh-token" {
				return &domain.AuthResponse{
					AccessToken:  "new-access-token",
					RefreshToken: "new-refresh-token",
					ExpiresAt:    time.Now().Add(30 * time.Minute).Format(time.RFC3339),
				}, nil
			}
			return nil, errors.Unauthorized("invalid refresh token")
		},
	}

	app := setupTestApp(mockSvc, true) // isProduction = true

	req := httptest.NewRequest("GET", "/protected", nil)
	req.AddCookie(&http.Cookie{Name: "access_token", Value: "expired-access-token"})
	req.AddCookie(&http.Cookie{Name: "refresh_token", Value: "valid-refresh-token"})

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200 after auto-refresh, got %d", resp.StatusCode)
	}

	if !validatedNew {
		t.Fatal("Expected new access token to be validated internally")
	}

	// Check response headers
	if resp.Header.Get("X-Access-Token") != "new-access-token" {
		t.Fatalf("Expected X-Access-Token header to be new-access-token, got %q", resp.Header.Get("X-Access-Token"))
	}

	// Check Set-Cookie headers for Path=/ and SameSite=None and Secure
	cookies := resp.Header.Values("Set-Cookie")
	if len(cookies) < 2 {
		t.Fatalf("Expected at least 2 Set-Cookie headers, got %d", len(cookies))
	}

	hasAccessCookie := false
	hasRefreshCookie := false
	for _, c := range cookies {
		lower := strings.ToLower(c)
		if strings.Contains(c, "access_token=new-access-token") {
			hasAccessCookie = true
			if !strings.Contains(lower, "path=/") {
				t.Errorf("access_token cookie missing path=/: %s", c)
			}
			if !strings.Contains(lower, "samesite=none") {
				t.Errorf("access_token cookie missing samesite=none in production: %s", c)
			}
			if !strings.Contains(lower, "secure") {
				t.Errorf("access_token cookie missing secure flag in production: %s", c)
			}
		}
		if strings.Contains(c, "refresh_token=new-refresh-token") {
			hasRefreshCookie = true
			if !strings.Contains(lower, "path=/") {
				t.Errorf("refresh_token cookie missing path=/: %s", c)
			}
			if !strings.Contains(lower, "samesite=none") {
				t.Errorf("refresh_token cookie missing samesite=none in production: %s", c)
			}
			if !strings.Contains(lower, "secure") {
				t.Errorf("refresh_token cookie missing secure flag in production: %s", c)
			}
		}
	}

	if !hasAccessCookie || !hasRefreshCookie {
		t.Fatalf("Expected both access and refresh cookies to be set, got: %v", cookies)
	}
}

func TestAuthMiddleware_ExpiredAccess_AutoRefreshesViaHeader(t *testing.T) {
	mockSvc := &mockAuthService{
		validateFn: func(token string) (string, error) {
			if token == "new-access-token-swagger" {
				return "usr_swagger_456", nil
			}
			return "", errors.Unauthorized("token expired")
		},
		refreshFn: func(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
			if refreshToken == "header-refresh-token" {
				return &domain.AuthResponse{
					AccessToken:  "new-access-token-swagger",
					RefreshToken: "new-refresh-token-swagger",
					ExpiresAt:    time.Now().Add(30 * time.Minute).Format(time.RFC3339),
				}, nil
			}
			return nil, errors.Unauthorized("invalid refresh token")
		},
	}

	app := setupTestApp(mockSvc, false)

	req := httptest.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "Bearer expired-token")
	req.Header.Set("X-Refresh-Token", "header-refresh-token")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", resp.StatusCode)
	}

	if resp.Header.Get("X-Access-Token") != "new-access-token-swagger" {
		t.Fatalf("Expected X-Access-Token header to be set, got %q", resp.Header.Get("X-Access-Token"))
	}
	if resp.Header.Get("X-Refresh-Token") != "new-refresh-token-swagger" {
		t.Fatalf("Expected X-Refresh-Token header to be set, got %q", resp.Header.Get("X-Refresh-Token"))
	}
}

func TestAuthMiddleware_UnauthorizedRejection(t *testing.T) {
	mockSvc := &mockAuthService{
		validateFn: func(token string) (string, error) {
			return "", errors.Unauthorized("invalid token")
		},
		refreshFn: func(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
			return nil, errors.Unauthorized("invalid refresh token")
		},
	}

	app := setupTestApp(mockSvc, false)

	// No token at all
	req := httptest.NewRequest("GET", "/protected", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Expected 401 Unauthorized, got %d", resp.StatusCode)
	}

	// Invalid token and invalid refresh token
	reqInvalid := httptest.NewRequest("GET", "/protected", nil)
	reqInvalid.AddCookie(&http.Cookie{Name: "access_token", Value: "bad-token"})
	reqInvalid.AddCookie(&http.Cookie{Name: "refresh_token", Value: "bad-refresh"})
	respInvalid, err := app.Test(reqInvalid)
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}
	if respInvalid.StatusCode != http.StatusUnauthorized {
		t.Fatalf("Expected 401 Unauthorized, got %d", respInvalid.StatusCode)
	}
}
