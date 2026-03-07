package routes

import (
	"c2-control-panel/api/controllers"
	"c2-control-panel/middleware"

	"github.com/gofiber/fiber/v2"
)

func RegisterAuthRoutes(app fiber.Router, authController *controllers.AuthController) {
	app.Post("/login", authController.Login)
	
	// Protected routes
	auth := app.Group("", middleware.AuthRequired())
	auth.Get("/me", authController.Me)
	auth.Post("/change-password", authController.ChangePassword)
}
