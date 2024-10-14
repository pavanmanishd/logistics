package main

import (
	"driver-service/config"
	"driver-service/routes"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	config.LoadConfig()

	router := gin.Default()
	routes.SetupRoutes(router)

	if err := router.Run(":8082"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}