package routes

import (
	"auth-service/controllers"
	"auth-service/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	services.InitService()

	router.GET("/health", controllers.Health)
	router.POST("/register", controllers.Register)
	router.POST("/register/additional", controllers.RegisterAdditional)
	router.POST("/login", controllers.Login)
	router.GET("/ws/location", controllers.HandleLocationWSProxy)
	router.GET("/ws/notification", controllers.HandleNotificationWSProxy)
}
