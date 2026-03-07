package controllers

import (
	"c2-control-panel/api/services"
	"c2-control-panel/middleware"
	"c2-control-panel/models"

	"github.com/gofiber/fiber/v2"
)

type AuthController struct {
	authService services.AuthServiceInterface
}

func NewAuthController(authService services.AuthServiceInterface) *AuthController {
	return &AuthController{
		authService: authService,
	}
}

func (ac *AuthController) Login(c *fiber.Ctx) error {
	var req models.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := ac.authService.Login(req.Username, req.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(models.LoginResponse{
		Token: token,
		User:  *user,
	})
}

func (ac *AuthController) Me(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	username := c.Locals("username").(string)

	return c.JSON(fiber.Map{
		"id":       userID,
		"username": username,
	})
}

func (ac *AuthController) ChangePassword(c *fiber.Ctx) error {
	username := c.Locals("username").(string)

	var req struct {
		NewPassword string `json:"newPassword"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if len(req.NewPassword) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Password must be at least 8 characters",
		})
	}

	if err := ac.authService.ChangePassword(username, req.NewPassword); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to change password",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Password changed successfully",
	})
}
