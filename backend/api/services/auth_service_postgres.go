package services

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"c2-control-panel/models"

	"golang.org/x/crypto/bcrypt"
)

type AuthServicePostgres struct {
	db *sql.DB
}

func NewAuthServicePostgres(db *sql.DB) *AuthServicePostgres {
	return &AuthServicePostgres{db: db}
}

// Initialize creates the default admin user if it doesn't exist
func (s *AuthServicePostgres) Initialize() error {
	// Check if admin already exists
	var exists bool
	err := s.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)", "admin").Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check admin user: %w", err)
	}

	if exists {
		return nil
	}

	// Create default admin user with random password
	password := generateRandomPassword(16)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(
		"INSERT INTO users (id, username, password_hash, created_at) VALUES ($1, $2, $3, $4)",
		"admin",
		"admin",
		string(hashedPassword),
		time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	// Log the generated password (only once, during initialization)
	fmt.Println("=====================================")
	fmt.Println("🔐 ADMIN CREDENTIALS")
	fmt.Println("=====================================")
	fmt.Printf("Username: admin\n")
	fmt.Printf("Password: %s\n", password)
	fmt.Println("=====================================")
	fmt.Println("⚠️  SAVE THIS PASSWORD - IT WON'T BE SHOWN AGAIN!")
	fmt.Println("=====================================")

	return nil
}

func (s *AuthServicePostgres) Login(username, password string) (*models.User, error) {
	var user models.User
	var passwordHash string

	err := s.db.QueryRow(
		"SELECT id, username, password_hash, created_at FROM users WHERE username = $1",
		username,
	).Scan(&user.ID, &user.Username, &passwordHash, &user.CreatedAt)

	if err == sql.ErrNoRows {
		return nil, errors.New("invalid credentials")
	}
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return &user, nil
}

func (s *AuthServicePostgres) ChangePassword(username, newPassword string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	result, err := s.db.Exec(
		"UPDATE users SET password_hash = $1 WHERE username = $2",
		string(hashedPassword),
		username,
	)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("user not found")
	}

	return nil
}
