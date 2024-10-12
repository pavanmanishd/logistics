package main

import (
    "log"
    "user-service/config"
    "user-service/routes"
    "github.com/gin-gonic/gin"
)

func main() {
    config.LoadConfig()

    router := gin.Default()
    routes.SetupRoutes(router)

    if err := router.Run(":8080"); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}
