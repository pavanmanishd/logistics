package routes

import (
    "user-service/controllers"
    "user-service/services"

    "github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
    services.InitService()

	router.GET("/health", controllers.Health)
    router.POST("/register", controllers.Register)
    router.POST("/login", controllers.Login)
}
