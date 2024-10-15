package controllers

import (
	"driver-service/models"
	"driver-service/services"
	"log"

	"github.com/gin-gonic/gin"
)

func FindDrivers(c *gin.Context) {
	var location models.Point
	if err := c.ShouldBindJSON(&location); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	lan := location.Coordinates[0]
	lon := location.Coordinates[1]

	radius := 1000
	log.Printf("Finding drivers within %d meters of location: %f, %f", radius, lan, lon)
	drivers, err := services.FindDriversInRadius(lan, lon, float64(radius))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, drivers)
}