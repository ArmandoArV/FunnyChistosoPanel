package models

import "time"

type Victim struct {
	ID       string            `json:"id"`
	Info     map[string]string `json:"info"`
	LastSeen time.Time         `json:"lastSeen"`
}
