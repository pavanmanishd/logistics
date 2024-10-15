package routes

import (
	"notification-service/services"
	"notification-service/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	services.InitMQService()
	go services.Consume()

	router.GET("/ws/notification", controllers.HandleConnections)
}