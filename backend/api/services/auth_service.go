package services

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"

	"c2-control-panel/models"

	bolt "go.etcd.io/bbolt"
	"golang.org/x/crypto/bcrypt"
)

var BucketUsers = []byte("users")

type AuthService struct {
	db *bolt.DB
}

func NewAuthService(db *bolt.DB) *AuthService {
	return &AuthService{db: db}
}

// Initialize creates the default admin user if it doesn't exist
func (s *AuthService) Initialize() error {
	return s.db.Update(func(tx *bolt.Tx) error {
		bucket, err := tx.CreateBucketIfNotExists(BucketUsers)
		if err != nil {
			return err
		}

		// Check if admin already exists
		if bucket.Get([]byte("admin")) != nil {
			return nil
		}

		// Create default admin user with random password
		password := generateRandomPassword(16)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		admin := models.User{
			ID:           "admin",
			Username:     "admin",
			PasswordHash: string(hashedPassword),
		}

		data, err := json.Marshal(admin)
		if err != nil {
			return err
		}

		if err := bucket.Put([]byte("admin"), data); err != nil {
			return err
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
	})
}

func (s *AuthService) Login(username, password string) (*models.User, error) {
	var user models.User

	err := s.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(BucketUsers)
		if bucket == nil {
			return errors.New("users bucket not found")
		}

		data := bucket.Get([]byte(username))
		if data == nil {
			return errors.New("invalid credentials")
		}

		if err := json.Unmarshal(data, &user); err != nil {
			return err
		}

		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
			return errors.New("invalid credentials")
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *AuthService) ChangePassword(username, newPassword string) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket(BucketUsers)
		if bucket == nil {
			return errors.New("users bucket not found")
		}

		data := bucket.Get([]byte(username))
		if data == nil {
			return errors.New("user not found")
		}

		var user models.User
		if err := json.Unmarshal(data, &user); err != nil {
			return err
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		user.PasswordHash = string(hashedPassword)

		updatedData, err := json.Marshal(user)
		if err != nil {
			return err
		}

		return bucket.Put([]byte(username), updatedData)
	})
}

func generateRandomPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
	b := make([]byte, length)
	rand.Read(b)
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b)
}
