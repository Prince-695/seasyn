package handlers

import (
	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type UsersHandler struct {
	usersService ports.UsersService
	validate     *validator.Validate
}

func NewUsersHandler(usersService ports.UsersService) *UsersHandler {
	return &UsersHandler{
		usersService: usersService,
		validate:     validator.New(),
	}
}

// jsonResponse is a helper to format standard JSON responses
func (h *UsersHandler) jsonResponse(c *fiber.Ctx, status int, success bool, message string, data interface{}) error {
	resp := domain.Response{
		Success: success,
		Message: message,
		Data:    data,
	}
	if !success {
		resp.Error = message
		resp.Message = ""
	}
	return c.Status(status).JSON(resp)
}

func (h *UsersHandler) RegisterRoutes(router fiber.Router, authMiddleware fiber.Handler, requireVerified fiber.Handler) {
	usersGroup := router.Group("/users")

	// Open route for checking username
	usersGroup.Get("/username", h.CheckUsername)

	// Protected routes (Only requires authentication)
	usersGroup.Use(authMiddleware)
	usersGroup.Get("/me", h.GetMe)

	// Verified routes (Requires authentication AND verified email)
	usersGroup.Post("/username", requireVerified, h.SetUsername)
	usersGroup.Put("/update", requireVerified, h.UpdateProfile)
}

// GetMe godoc
// @Summary Get currently logged in user profile
// @Description Returns the profile of the currently authenticated user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} domain.Response{data=domain.PublicUser}
// @Failure 401 {object} domain.Response
// @Failure 404 {object} domain.Response
// @Router /v1/users/me [get]
func (h *UsersHandler) GetMe(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	user, err := h.usersService.GetMe(c.Context(), userID.(string))
	if err != nil {
		return err
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "User profile retrieved", user)
}

// CheckUsername godoc
// @Summary Check if a username is available
// @Description Checks whether a specific username is already taken
// @Tags users
// @Accept json
// @Produce json
// @Param u query string true "Username to check"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response
// @Router /v1/users/username [get]
func (h *UsersHandler) CheckUsername(c *fiber.Ctx) error {
	username := c.Query("u")
	if username == "" {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Username query parameter 'u' is required", nil)
	}

	taken, err := h.usersService.CheckUsername(c.Context(), username)
	if err != nil {
		return err
	}

	if taken {
		return h.jsonResponse(c, fiber.StatusOK, true, "Username is already taken", fiber.Map{"available": false})
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Username is available", fiber.Map{"available": true})
}

// SetUsername godoc
// @Summary Set unique username
// @Description Allows the user to set their username once. Cannot be updated.
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body domain.SetUsernameRequest true "Set Username Request"
// @Success 200 {object} domain.Response
// @Failure 400 {object} domain.Response
// @Failure 401 {object} domain.Response
// @Router /v1/users/username [post]
func (h *UsersHandler) SetUsername(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	var req domain.SetUsernameRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	if err := h.usersService.SetUsername(c.Context(), userID.(string), req.Username); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Username set successfully", nil)
}

// UpdateProfile godoc
// @Summary Update User Profile
// @Description Update the first and last name of the user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body domain.UpdateProfileRequest true "Update Profile Request"
// @Success 200 {object} domain.Response{data=domain.PublicUser}
// @Failure 400 {object} domain.Response
// @Failure 401 {object} domain.Response
// @Router /v1/users/update [put]
func (h *UsersHandler) UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return h.jsonResponse(c, fiber.StatusUnauthorized, false, "Unauthorized", nil)
	}

	var req domain.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, "Invalid request body", nil)
	}
	if err := h.validate.Struct(req); err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	user, err := h.usersService.UpdateProfile(c.Context(), userID.(string), req)
	if err != nil {
		return h.jsonResponse(c, fiber.StatusBadRequest, false, err.Error(), nil)
	}

	return h.jsonResponse(c, fiber.StatusOK, true, "Profile updated successfully", user)
}
