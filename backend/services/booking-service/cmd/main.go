package main

import (
	"booking-service/config"
	"booking-service/routes"
	"log"
	
	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadConfig()

	router := gin.Default()
	routes.SetupRoutes(router)

	if err := router.Run(":8081"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}