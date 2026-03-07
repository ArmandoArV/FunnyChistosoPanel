package models

import "time"

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"` // Never expose in JSON
	CreatedAt    time.Time `json:"createdAt"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type DeploymentRequest struct {
	CommitHash string `json:"commitHash,omitempty"`
	Branch     string `json:"branch,omitempty"`
}

type DeploymentResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Logs    string `json:"logs,omitempty"`
}
