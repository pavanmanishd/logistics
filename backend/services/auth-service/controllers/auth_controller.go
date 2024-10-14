package controllers

import (
	"auth-service/models"
	"auth-service/services"
	"auth-service/utils"
	"bytes"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Register(c *gin.Context) {
	var input models.Auth
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error hashing password"})
		return
	}
	input.Password = hashedPassword

	if err := services.CreateAuth(input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating auth"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Auth created successfully"})
}

func Login(c *gin.Context) {
	var input models.Auth
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	auth, err := services.FindAuthByEmail(input.Email)
	if err != nil || !utils.CheckPasswordHash(input.Password, auth.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := utils.GenerateJWT(auth.ID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Auth service is healthy"})
}

func GetAuthByJwtToken(c *gin.Context) {
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

	c.JSON(http.StatusOK, auth)
}

func RegisterAdditional(c *gin.Context) {
	var input models.AdditionalAuth
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	auth, err := services.FindAuthByEmail(input.Email)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Auth not found"})
		return
	}

	input.ID = auth.ID

	if err := sendToDriverService(input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating driver"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Driver created successfully"})
}

func sendToDriverService(input models.AdditionalAuth) error {
	url := "http://localhost:8082/new"
	jsonData, err := json.Marshal(input)
	log.Printf("Sending data to driver service: %s", string(jsonData))
	if err != nil {
		return err
	}

	_, err = http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	return nil
}