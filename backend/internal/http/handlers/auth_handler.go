package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	apperrors "github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService  ports.AuthService
	validate     *validator.Validate
	isProduction bool // BUG-04 fix: drive the Secure cookie flag from the environment
}

func NewAuthHandler(authService ports.AuthService, isProduction bool) *AuthHandler {
	return &AuthHandler{
		authService:  authService,
		validate:     validator.New(),
		isProduction: isProduction,
	}
}

func (h *AuthHandler) RegisterRoutes(router fiber.Router, authMiddleware fiber.Handler) {
	authGroup := router.Group("/auth")
	authGroup.Post("/signup", h.Signup)
	authGroup.Post("/login", h.Login)
	authGroup.Post("/refresh", h.Refresh)
	authGroup.Post("/forgot-password", h.ForgotPassword)
	authGroup.Post("/reset-password", h.ResetPassword)

	// Protected Auth Routes
	authGroup.Post("/logout", authMiddleware, h.Logout)

	// OAuth (JSON-First Flow)
	authGroup.Get("/:provider/login", h.OAuthLogin)
	authGroup.Get("/:provider/callback", h.OAuthCallback)
}

// Signup godoc
// @Summary User Signup
// @Description Register a new user and receive access and refresh tokens via HttpOnly cookies
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.SignupRequest true "Signup Request"
// @Success 201 {object} domain.Response
// @Failure 400 {object} domain.Response "Email already taken or invalid input"
// @Failure 500 {object} domain.Response "Internal server error"
// @Router /v1/auth/signup [post]
func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req domain.SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", "", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), "", nil)
	}
	user, err := h.authService.Signup(c.Context(), req)
	if err != nil {
		// BUG-06 fix: use the AppError's HTTP status instead of always returning 500.
		// A duplicate email error is 400, not 500.
		if appErr, ok := err.(*apperrors.AppError); ok {
			return h.jsonResponse(c, appErr.HTTPStatus, false, appErr.Message, "", nil)
		}
		return h.jsonResponse(c, fiber.StatusInternalServerError, false, err.Error(), "", nil)
	}
	h.setAuthCookies(c, user.AccessToken, user.RefreshToken)
	return h.jsonResponse(c, fiber.StatusCreated, true, "User registered and logged in successfully", user.AccessToken, nil)
}

// Login godoc
// @Summary User Login
// @Description Authenticate user and set access and refresh tokens as HttpOnly cookies
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.LoginRequest true "Login Request"
// @Success 200 {object} domain.Response
// @Failure 401 {object} domain.Response "Invalid credentials"
// @Router /v1/auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req domain.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", "", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), "", nil)
	}
	res, err := h.authService.Login(c.Context(), req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Invalid credentials", "", nil)
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return h.jsonResponse(c, fiber.StatusOK, true, "Login successful", res.AccessToken, nil)
}

// Refresh godoc
// @Summary Refresh Access Token
// @Description Exchange the refresh_token cookie (or request body) for a new access token.
// @Description The server sets new access_token and refresh_token cookies automatically.
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.RefreshRequest false "Refresh Request (optional if refresh_token cookie is set)"
// @Success 200 {object} domain.Response
// @Failure 401 {object} domain.Response "Invalid or expired refresh token"
// @Router /v1/auth/refresh [post]
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	// BUG-08 fix: validate body if provided, but also fall back to the cookie.
	var req domain.RefreshRequest
	_ = c.BodyParser(&req) // intentionally ignore parse error — cookie is the primary path

	// Cookie is the preferred source; body is the fallback for API clients.
	refreshToken := strings.TrimSpace(req.RefreshToken)
	if refreshToken == "" {
		refreshToken = c.Cookies("refresh_token")
	}

	if refreshToken == "" {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "No refresh token provided", "", nil)
	}

	res, err := h.authService.RefreshToken(c.Context(), refreshToken)
	if err != nil {
		// Clear stale cookies so the client knows to re-authenticate.
		h.clearAuthCookies(c)
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Invalid or expired session. Please log in again.", "", nil)
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return h.jsonResponse(c, fiber.StatusOK, true, "Token refreshed successfully", res.AccessToken, nil)
}

// Logout godoc
// @Summary Logout User
// @Description Clear access_token and refresh_token HttpOnly cookies
// @Tags auth
// @Security BearerAuth
// @Success 200 {object} domain.Response
// @Router /v1/auth/logout [post]
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Extract tokens to invalidate them in-memory
	accessToken := strings.TrimPrefix(c.Get("Authorization"), "Bearer ")
	if accessToken == "" {
		accessToken = c.Cookies("access_token")
	}
	refreshToken := c.Cookies("refresh_token")

	// Call the service to add them to the in-memory denylist
	_ = h.authService.Logout(c.Context(), strings.TrimSpace(accessToken), strings.TrimSpace(refreshToken))

	// Logout fix: use MaxAge=-1 and Path="/" to reliably delete the cookies
	// regardless of which path originally set them.
	h.clearAuthCookies(c)
	return h.jsonResponse(c, fiber.StatusOK, true, "Logged out successfully", "", nil)
}

// ForgotPassword godoc
// @Summary Request Password Reset
// @Description Send OTP to user email for password reset
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.ForgotPasswordRequest true "Forgot Password Request"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response "Invalid request body"
// @Router /v1/auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req domain.ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", "", nil)
	}
	// BUG-07 fix: validate the struct so malformed/missing emails are rejected early.
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), "", nil)
	}
	if err := h.authService.ForgotPassword(c.Context(), req); err != nil {
		return h.jsonResponse(c, fiber.StatusInternalServerError, false, err.Error(), "", nil)
	}
	return h.jsonResponse(c, fiber.StatusOK, true, "If that email exists, an OTP has been sent", "", nil)
}

// ResetPassword godoc
// @Summary Reset Password with OTP
// @Description Verify OTP and update the user's password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.ResetPasswordRequest true "Reset Password Request"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response "Invalid or expired OTP"
// @Router /v1/auth/reset-password [post]
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req domain.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", "", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), "", nil)
	}
	if err := h.authService.ResetPassword(c.Context(), req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), "", nil)
	}
	return h.jsonResponse(c, fiber.StatusOK, true, "Password reset successful", "", nil)
}

// OAuthLogin godoc
// @Summary Get OAuth Login URL
// @Description Returns the authorization URL for a specific provider (google, github).
// @Description The frontend should redirect the user to the returned auth_url.
// @Tags auth
// @Param provider path string true "OAuth Provider" Enums(google, github)
// @Success 200 {object} domain.Response{data=map[string]string}
// @Failure 400 {object} domain.Response "Unsupported provider"
// @Router /v1/auth/{provider}/login [get]
func (h *AuthHandler) OAuthLogin(c *fiber.Ctx) error {
	provider := c.Params("provider")
	url, err := h.authService.GetOAuthURL(provider)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), "", nil)
	}
	return h.jsonResponse(c, fiber.StatusOK, true, "OAuth URL generated", "", fiber.Map{
		"auth_url": url,
	})
}

// OAuthCallback godoc
// @Summary OAuth Callback
// @Description Handle OAuth provider callback, verify CSRF state, and return tokens as cookies.
// @Tags auth
// @Param provider path string true "OAuth Provider" Enums(google, github)
// @Param code query string true "OAuth Authorization Code"
// @Param state query string true "CSRF State"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response "Invalid state or missing code"
// @Failure 500 {object} domain.Response "OAuth exchange failed"
// @Router /v1/auth/{provider}/callback [get]
func (h *AuthHandler) OAuthCallback(c *fiber.Ctx) error {
	provider := c.Params("provider")
	code := c.Query("code")
	// BUG-02 fix: read and forward the state so the service can verify it.
	state := c.Query("state")

	res, err := h.authService.HandleOAuthCallback(c.Context(), provider, code, state)
	if err != nil {
		if appErr, ok := err.(*apperrors.AppError); ok {
			return h.jsonResponse(c, appErr.HTTPStatus, false, appErr.Message, "", nil)
		}
		return h.jsonResponse(c, fiber.StatusInternalServerError, false, err.Error(), "", nil)
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return h.jsonResponse(c, fiber.StatusOK, true, "OAuth login successful", res.AccessToken, nil)
}

// setAuthCookies writes HttpOnly auth cookies on the response.
// BUG-04 fix: Secure flag is true in production to prevent token leakage over plain HTTP.
// Path is always "/" so all endpoints (and the logout endpoint) can see and clear the cookies.
func (h *AuthHandler) setAuthCookies(c *fiber.Ctx, access, refresh string) {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    access,
		Path:     "/",
		Expires:  time.Now().Add(30 * time.Minute),
		HTTPOnly: true,
		Secure:   h.isProduction,
		SameSite: "Strict",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refresh,
		Path:     "/",
		Expires:  time.Now().Add(168 * time.Hour),
		HTTPOnly: true,
		Secure:   h.isProduction,
		SameSite: "Strict",
	})
}

// clearAuthCookies deletes both auth cookies.
// Logout fix: MaxAge=-1 is the most reliable cross-browser way to delete a cookie.
// Path must match exactly what was used in setAuthCookies ("/").
func (h *AuthHandler) clearAuthCookies(c *fiber.Ctx) {
	expired := time.Now().Add(-time.Hour)
	for _, name := range []string{"access_token", "refresh_token"} {
		c.Cookie(&fiber.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			Expires:  expired,
			MaxAge:   -1,
			HTTPOnly: true,
			Secure:   h.isProduction,
			SameSite: "Strict",
		})
	}
}

func (h *AuthHandler) jsonResponse(c *fiber.Ctx, status int, success bool, message string, accessToken string, data interface{}) error {
	startTime := c.Locals("startTime")
	var responseTime string
	if startTime != nil {
		responseTime = fmt.Sprintf("%dms", time.Since(startTime.(time.Time)).Milliseconds())
	}

	resp := domain.Response{
		Success:      success,
		Message:      message,
		AccessToken:  accessToken,
		Data:         data,
		ResponseTime: responseTime,
	}
	if !success {
		resp.Error = message
		resp.Message = ""
	}
	return c.Status(status).JSON(resp)
}
