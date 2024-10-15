package routes

import (
	"driver-service/services"
	"driver-service/controllers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	services.InitService()
	services.InitMQService()

	router.GET("/health", controllers.Health)
	router.POST("/new", controllers.CreateDriver)
	router.GET("/ws/location", controllers.LocationWebSocket)
	router.POST("/nearby", controllers.FindDrivers)
	router.GET("/driver", controllers.DriverLocation)
}