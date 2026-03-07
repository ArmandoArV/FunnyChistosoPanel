package models

import "time"

// Screenshot represents a captured screen image
type Screenshot struct {
	ID        int64     `json:"id" db:"id"`
	VictimID  string    `json:"victim_id" db:"victim_id"`
	Filename  string    `json:"filename" db:"filename"`
	FilePath  string    `json:"file_path" db:"file_path"`
	Size      int64     `json:"size" db:"size"`
	Width     int       `json:"width" db:"width"`
	Height    int       `json:"height" db:"height"`
	Format    string    `json:"format" db:"format"`
	TakenAt   time.Time `json:"taken_at" db:"taken_at"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// ScreenshotRequest for starting/stopping screen capture
type ScreenshotRequest struct {
	VictimID string `json:"victim_id"`
	Action   string `json:"action"` // "start", "stop", "capture"
	Interval int    `json:"interval"` // seconds between captures (for streaming)
	Quality  int    `json:"quality"` // 1-100, JPEG quality
}
