package routes

import (
	"notification-service/services"
	"notification-service/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	services.InitMQService()
	services.Consume()

	router.POST("/ws", controllers.HandleConnections)
}