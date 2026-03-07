package services

import "c2-control-panel/models"

// AuthServiceInterface defines the contract for authentication services
type AuthServiceInterface interface {
	Initialize() error
	Login(username, password string) (*models.User, error)
	ChangePassword(username, newPassword string) error
}
