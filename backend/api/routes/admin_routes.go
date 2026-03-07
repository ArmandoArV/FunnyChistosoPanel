package routes

import (
	"c2-control-panel/api/controllers"
	"c2-control-panel/middleware"

	"github.com/gofiber/fiber/v2"
)

func RegisterAdminRoutes(app fiber.Router, deployController *controllers.DeploymentController) {
	admin := app.Group("/admin", middleware.AuthRequired())
	
	admin.Get("/deployment/status", deployController.GetStatus)
	admin.Post("/deployment/deploy", deployController.Deploy)
}
