package controllers

import (
	"auth-service/models"
	"auth-service/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetBookings(c *gin.Context) {
	userID := c.Query("id")
	role := c.Query("type")

	if userID != "" && role != "" {
		bookings, err := services.GetBookings(userID, role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, bookings)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "User ID and role are required"})
}

func GetBookingByID(c *gin.Context) {
	id := c.Param("id")

	if id != "" {
		booking, err := services.GetBookingByID(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, booking)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Booking ID is required"})
}

func GetCurrentBookingByDriverID(c *gin.Context) {
	driverID := c.Param("driverID")

	if driverID != "" {
		booking, err := services.GetCurrentBookingByDriverID(driverID)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"message": "No booking found"})
			return
		}
		c.JSON(http.StatusOK, booking)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Driver ID is required"})
}

func Book(c *gin.Context) {
	var bookingRequest models.BookingRequest
	if err := c.ShouldBindJSON(&bookingRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := services.Book(bookingRequest)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking successful"})
}

func DriverLocation(c *gin.Context) {
	driverID := c.Query("id")

	if driverID != "" {
		location, err := services.GetDriverLocation(driverID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, location)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Driver ID is required"})
}