package main

import (
	"notification-service/config"
	"notification-service/routes"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadConfig()

	router := gin.Default()
	routes.SetupRoutes(router)

	if err := router.Run(":8083"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}