package controllers

import (
	"driver-service/models"
	"driver-service/services"
	"log"

	"github.com/gin-gonic/gin"
)

type MatchRequest struct{
	Location models.Point `json:"location"`
	UserID string `json:"user_id"`
	BookingID string `json:"booking_id"`
}

func FindDrivers(c *gin.Context) {
	var body MatchRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	var location models.Point = body.Location
	
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

		jsonData := map[string]interface{}{
			"client_id": driver.ID.Hex(),
			"body" : map[string]string{
				"driver_id": driver.ID.Hex(),
				"user_id": body.UserID,
				"booking_id": body.BookingID,
				"type": "accept_ride",
			},
		}
		// Publishing the driver ID to a specific exchange and routing key
		err = services.Publish("driver.found", jsonData)
		if err != nil {
			log.Printf("Failed to publish driver %s: %s", driver.ID.Hex(), err.Error())
		} else {
			log.Printf("Published driver %s successfully", driver.ID.Hex())
		}
	}

	c.JSON(200, drivers)
}
