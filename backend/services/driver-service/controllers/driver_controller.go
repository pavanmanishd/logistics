package controllers

import (
	"driver-service/services"
	"driver-service/models"

	"github.com/gin-gonic/gin"
)

func CreateDriver(c *gin.Context) {
	var driver models.Driver
	if err := c.ShouldBindJSON(&driver); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	driver.Avaliable = true
	driver.Location.Type = "Point"
	driver.Location.Coordinates[0] = 0
	driver.Location.Coordinates[1] = 0

	err := services.CreateDriver(driver)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{"message": "Driver created successfully"})
}

func Health(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Driver service is healthy"})
}

