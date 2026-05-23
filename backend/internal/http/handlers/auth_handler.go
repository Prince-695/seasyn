package handlers

import (
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

func (h *AuthHandler) RegisterRoutes(router fiber.Router) {
	authGroup := router.Group("/auth")
	authGroup.Post("/signup", h.Signup)
	authGroup.Post("/login", h.Login)
	authGroup.Post("/refresh", h.Refresh)
	authGroup.Post("/forgot-password", h.ForgotPassword)
	authGroup.Post("/reset-password", h.ResetPassword)
	
	// OAuth
	authGroup.Get("/:provider/login", h.OAuthLogin)
	authGroup.Get("/:provider/callback", h.OAuthCallback)
}

// Signup godoc
// @Summary User Signup
// @Description Register a new user with full details
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.SignupRequest true "Signup Request"
// @Success 201 {object} domain.User
// @Router /auth/signup [post]
func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req domain.SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, err.Error())
	}
	user, err := h.authService.Signup(c.Context(), req)
	if err != nil {
		return h.jsonError(c, fiber.StatusInternalServerError, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(user)
}

// Login godoc
// @Summary User Login
// @Description Authenticate user and receive tokens via cookies
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.LoginRequest true "Login Request"
// @Success 200 {object} domain.AuthResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req domain.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, err.Error())
	}
	res, err := h.authService.Login(c.Context(), req)
	if err != nil {
		return h.jsonError(c, fiber.StatusUnauthorized, "Invalid credentials")
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return c.Status(fiber.StatusOK).JSON(res)
}

// Refresh godoc
// @Summary Refresh Access Token
// @Description Get a new access token using a refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.RefreshRequest true "Refresh Request"
// @Success 200 {object} domain.AuthResponse
// @Router /auth/refresh [post]
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	var req domain.RefreshRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, "Invalid request body")
	}
	res, err := h.authService.RefreshToken(c.Context(), req.RefreshToken)
	if err != nil {
		return h.jsonError(c, fiber.StatusUnauthorized, err.Error())
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return c.Status(fiber.StatusOK).JSON(res)
}

// ForgotPassword godoc
// @Summary Request Password Reset
// @Description Send OTP to user email
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.ForgotPasswordRequest true "Forgot Password Request"
// @Success 200 {object} map[string]string
// @Router /auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req domain.ForgotPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.authService.ForgotPassword(c.Context(), req); err != nil {
		return h.jsonError(c, fiber.StatusInternalServerError, err.Error())
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "If email exists, OTP has been sent"})
}

// ResetPassword godoc
// @Summary Reset Password with OTP
// @Description Verify OTP and update password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body domain.ResetPasswordRequest true "Reset Password Request"
// @Success 200 {object} map[string]string
// @Router /auth/reset-password [post]
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req domain.ResetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, err.Error())
	}
	if err := h.authService.ResetPassword(c.Context(), req); err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Password reset successful"})
}

// OAuthLogin godoc
// @Summary OAuth Login
// @Description Redirect to OAuth provider login page
// @Tags auth
// @Param provider path string true "OAuth Provider (google or github)" Enums(google, github)
// @Success 302
// @Router /auth/{provider}/login [get]
func (h *AuthHandler) OAuthLogin(c *fiber.Ctx) error {
	provider := c.Params("provider")
	url, err := h.authService.GetOAuthURL(provider)
	if err != nil {
		return h.jsonError(c, fiber.StatusBadRequest, err.Error())
	}
	return c.Redirect(url)
}

// OAuthCallback godoc
// @Summary OAuth Callback
// @Description Handle OAuth callback and return tokens
// @Tags auth
// @Param provider path string true "OAuth Provider" Enums(google, github)
// @Param code query string true "OAuth Code"
// @Success 200 {object} domain.AuthResponse
// @Router /auth/{provider}/callback [get]
func (h *AuthHandler) OAuthCallback(c *fiber.Ctx) error {
	provider := c.Params("provider")
	code := c.Query("code")
	res, err := h.authService.HandleOAuthCallback(c.Context(), provider, code)
	if err != nil {
		return h.jsonError(c, fiber.StatusInternalServerError, err.Error())
	}
	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return c.Status(fiber.StatusOK).JSON(res)
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

func (h *AuthHandler) jsonError(c *fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(fiber.Map{"error": message})
}
