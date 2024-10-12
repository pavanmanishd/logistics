package controllers

import (
	"booking-service/services"
	"booking-service/models"

	"github.com/gin-gonic/gin"
)

func Book(c *gin.Context) {
	var booking models.Booking
	if err := c.ShouldBindJSON(&booking); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	err := services.CreateBooking(booking)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"message": "Booking created successfully"})
}

func Health(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Booking service is healthy"})
}

func GetBookingByID(c *gin.Context) {
	id := c.Param("id")
	booking, err := services.FindBookingByID(id)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, booking)
}

func GetBookingByUserID(c *gin.Context) {
	userID := c.Param("userID")
	bookings, err := services.FindBookingByUserID(userID)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, bookings)
}

func GetBookingByDriverID(c *gin.Context) {
	driverID := c.Param("driverID")
	bookings, err := services.FindBookingByDriverID(driverID)
	if err != nil {
		c.JSON(404, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, bookings)
}

func UpdateBookingStatus(c *gin.Context) {
	id := c.Param("id")
	var input models.Booking
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	err := services.UpdateBookingStatus(id, input.Status)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Booking updated successfully"})
}

