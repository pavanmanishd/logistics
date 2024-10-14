package controllers

import (
	"auth-service/services"

	"github.com/gin-gonic/gin"
	"net/http"
	"auth-service/utils"
)


func IsDriver(c *gin.Context) {
	token := c.Request.Header.Get("Authorization")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization token is required"})
		return
	}

	authID, err := utils.ValidateJWT(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	auth, err := services.FindAuthByID(authID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Auth not found"})
		return
	}

	if auth.Role != "driver" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User is not a driver"})
		return
	}

	c.Next()
}

func IsCustomer(c *gin.Context) {
	token := c.Request.Header.Get("Authorization")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization token is required"})
		return
	}

	authID, err := utils.ValidateJWT(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	auth, err := services.FindAuthByID(authID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Auth not found"})
		return
	}

	if auth.Role != "customer" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User is not a customer"})
		return
	}

	c.Next()
}