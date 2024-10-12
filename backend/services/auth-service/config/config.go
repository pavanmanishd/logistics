package config

import (
	"log"
	"os"
	"github.com/joho/godotenv"
)

var (
	MongoURI string
	JwtSecret string
)

func LoadConfig() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	MongoURI = os.Getenv("MONGO_URI")
	JwtSecret = os.Getenv("JWT_SECRET")
}