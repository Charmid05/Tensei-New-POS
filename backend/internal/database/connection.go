package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func Connect(config Config) (*sql.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Database connection established successfully")
	return db, nil
}

func IsConnectionError(err error) bool {
	if err == nil {
		return false
	}
	
	// Check for common database connection errors
	errorString := err.Error()
	connectionErrors := []string{
		"connection refused",
		"no such host",
		"timeout",
		"connection reset",
		"broken pipe",
		"network is unreachable",
	}

	for _, connErr := range connectionErrors {
		if len(errorString) > 0 && len(connErr) > 0 {
			// Simple substring check
			found := false
			for i := 0; i <= len(errorString)-len(connErr); i++ {
				if errorString[i:i+len(connErr)] == connErr {
					found = true
					break
				}
			}
			if found {
				return true
			}
		}
	}
	
	return false
}

