package database

import (
	"log"
	"os"

	bolt "go.etcd.io/bbolt"
)

var (
	BucketVictims  = []byte("victims")
	BucketCommands = []byte("commands")
)

func Init(dbPath string) (*bolt.DB, error) {
	log.Printf("[DB] Creating data directory...")
	if err := os.MkdirAll("./data", 0755); err != nil {
		return nil, err
	}

	log.Printf("[DB] Opening database at %s...", dbPath)
	db, err := bolt.Open(dbPath, 0600, nil)
	if err != nil {
		return nil, err
	}

	log.Printf("[DB] Creating buckets...")
	// Create buckets
	return db, db.Update(func(tx *bolt.Tx) error {
		for _, bucket := range [][]byte{BucketVictims, BucketCommands} {
			if _, err := tx.CreateBucketIfNotExists(bucket); err != nil {
				return err
			}
		}
		log.Printf("[DB] Buckets created successfully")
		return nil
	})
}
