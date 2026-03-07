package controllers

import (
	"c2-control-panel/api/services"
	"c2-control-panel/models"

	"github.com/gofiber/fiber/v2"
)

type DeploymentController struct {
	deployService *services.DeploymentService
}

func NewDeploymentController(deployService *services.DeploymentService) *DeploymentController {
	return &DeploymentController{
		deployService: deployService,
	}
}

func (dc *DeploymentController) Deploy(c *fiber.Ctx) error {
	var req models.DeploymentRequest
	if err := c.BodyParser(&req); err != nil {
		// Empty body is OK, use defaults
		req = models.DeploymentRequest{}
	}

	result, err := dc.deployService.Deploy(&req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(result)
	}

	return c.JSON(result)
}

func (dc *DeploymentController) GetStatus(c *fiber.Ctx) error {
	status := dc.deployService.GetStatus()
	return c.JSON(status)
}
