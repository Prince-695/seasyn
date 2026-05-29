package handlers

import (
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService ports.AuthService
	validate    *validator.Validate
}

func NewAuthHandler(authService ports.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validate:    validator.New(),
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
// @Description Register a new user and receive access token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.SignupRequest true "Signup Request"
// @Success 201 {object} domain.Response
// @Router /v1/auth/signup [post]
func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req domain.SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", "", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), "", nil)
	}
	res, err := h.authService.Signup(c.Context(), req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusInternalServerError, false, err.Error(), "", nil)
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return h.jsonResponse(c, fiber.StatusCreated, true, "User registered and logged in successfully", res.AccessToken, nil)
}

// Login godoc
// @Summary User Login
// @Description Authenticate user and receive access token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.LoginRequest true "Login Request"
// @Success 200 {object} domain.Response
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
// @Description Get a new access token using a refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.RefreshRequest true "Refresh Request"
// @Success 200 {object} domain.Response
// @Router /v1/auth/refresh [post]
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	var req domain.RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", "", nil)
	}
	res, err := h.authService.RefreshToken(c.Context(), req.RefreshToken)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, err.Error(), "", nil)
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return h.jsonResponse(c, fiber.StatusOK, true, "Token refreshed successfully", res.AccessToken, nil)
}

// Logout godoc
// @Summary Logout User
// @Description Clear authentication cookies
// @Tags auth
// @Security BearerAuth
// @Success 200 {object} domain.Response
// @Router /v1/auth/logout [post]
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Strict",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Strict",
	})
	return h.jsonResponse(c, fiber.StatusOK, true, "Logged out successfully", "", nil)
}

// ForgotPassword godoc
// @Summary Request Password Reset
// @Description Send OTP to user email
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.ForgotPasswordRequest true "Forgot Password Request"
// @Success 200 {object} domain.Response
// @Router /v1/auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req domain.ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", "", nil)
	}
	if err := h.authService.ForgotPassword(c.Context(), req); err != nil {
		return h.jsonResponse(c, fiber.StatusInternalServerError, false, err.Error(), "", nil)
	}
	return h.jsonResponse(c, fiber.StatusOK, true, "If email exists, OTP has been sent", "", nil)
}

// ResetPassword godoc
// @Summary Reset Password with OTP
// @Description Verify OTP and update password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.ResetPasswordRequest true "Reset Password Request"
// @Success 200 {object} domain.Response
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
// @Description Get the authorization URL for a specific provider (google, github)
// @Tags auth
// @Param provider path string true "OAuth Provider" Enums(google, github)
// @Success 200 {object} domain.Response{data=map[string]string}
// @Router /v1/auth/{provider}/login [get]
func (h *AuthHandler) OAuthLogin(c *fiber.Ctx) error {
	provider := c.Params("provider")
	url, err := h.authService.GetOAuthURL(provider)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), "", nil)
	}
	// Return URL as JSON so frontend can handle the redirection
	return h.jsonResponse(c, fiber.StatusOK, true, "OAuth URL generated", "", fiber.Map{
		"auth_url": url,
	})
}

// OAuthCallback godoc
// @Summary OAuth Callback
// @Description Handle OAuth callback and return user data + tokens as JSON
// @Tags auth
// @Param provider path string true "OAuth Provider" Enums(google, github)
// @Param code query string true "OAuth Code"
// @Success 200 {object} domain.Response
// @Router /v1/auth/{provider}/callback [get]
func (h *AuthHandler) OAuthCallback(c *fiber.Ctx) error {
	provider := c.Params("provider")
	code := c.Query("code")
	res, err := h.authService.HandleOAuthCallback(c.Context(), provider, code)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusInternalServerError, false, err.Error(), "", nil)
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	// Return full AuthResponse as JSON instead of redirecting
	return h.jsonResponse(c, fiber.StatusOK, true, "OAuth login successful", res.AccessToken, nil)
}

func (h *AuthHandler) setAuthCookies(c *fiber.Ctx, access, refresh string) {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    access,
		Expires:  time.Now().Add(30 * time.Minute),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Strict",
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refresh,
		Expires:  time.Now().Add(168 * time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Strict",
	})
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
