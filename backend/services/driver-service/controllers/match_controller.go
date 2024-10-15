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

	radius := 10000 // 10000 meters
	log.Printf("Finding drivers within %d meters of location: %f, %f", radius, lan, lon)
	
	drivers, err := services.FindDriversInRadius(lan, lon, float64(radius))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Publishing each driver's ID
	for _, driver := range drivers {
		log.Printf("Found driver: %s", driver.ID.Hex())

		// Publishing the driver ID to a specific exchange and routing key
		err = services.Publish("driver.found", driver.ID.Hex())
		if err != nil {
			log.Printf("Failed to publish driver %s: %s", driver.ID.Hex(), err.Error())
		} else {
			log.Printf("Published driver %s successfully", driver.ID.Hex())
		}
	}

	c.JSON(200, drivers)
}
