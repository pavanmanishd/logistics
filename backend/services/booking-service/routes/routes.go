package routes

import (
	"booking-service/controllers"
	"booking-service/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	services.InitService()

	router.GET("/health", controllers.Health)
	router.POST("/book", controllers.Book)
	router.GET("/bookings", controllers.GetBookings)
	// router.GET("/booking/:id", controllers.GetBookingByID)
	// router.GET("/booking/user/:userID", controllers.GetBookingByUserID)
	// router.GET("/booking/driver/:driverID", controllers.GetBookingByDriverID)
}