package routes

import (
	"driver-service/services"
	"driver-service/controllers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	services.InitService()

	router.GET("/health", controllers.Health)
	router.POST("/new", controllers.CreateDriver)
	router.GET("/ws/location", controllers.LocationWebSocket)
}