package controllers

import (
	"booking-service/models"
	"booking-service/services"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func Book(c *gin.Context) {
	var bookingRequest models.BookingRequest
	if err := c.ShouldBindJSON(&bookingRequest); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	var booking models.Booking
	booking.UserID = bookingRequest.UserID
	booking.Fare = bookingRequest.Fare
	booking.Status = "Booking Placed - Waiting for Driver"
	booking.DriverID = ""

	booking.Source.Type = "Point"
	booking.Source.Coordinates[0] = bookingRequest.Source.Longitude
	booking.Source.Coordinates[1] = bookingRequest.Source.Latitude

	booking.Destination.Type = "Point"
	booking.Destination.Coordinates[0] = bookingRequest.Destination.Longitude
	booking.Destination.Coordinates[1] = bookingRequest.Destination.Latitude

	id, err := services.CreateBooking(booking)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// Get drivers nearby
	getDriversNearby(booking.Source, booking.UserID, id)

	c.JSON(201, gin.H{"message": "Booking created successfully"})
}

func Health(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Booking service is healthy"})
}

func getDriversNearby(loc models.Point, userID, bookingID string) {
	driverServiceURL := "http://localhost:8082"
	// Get drivers nearby
	httpClient := &http.Client{}

	body := `{"location": {"type": "Point", "coordinates": [` + strconv.FormatFloat(loc.Coordinates[0], 'f', -1, 64) + `, ` + strconv.FormatFloat(loc.Coordinates[1], 'f', -1, 64) + `]}, "user_id": "` + userID + `", "booking_id": "` + bookingID + `"}`
	req, err := http.NewRequest("POST", driverServiceURL+"/nearby", strings.NewReader(body))
	if err != nil {
		panic(err)
	}
	// Send the request
	res, err := httpClient.Do(req)
	if err != nil {
		panic(err)
	}

	// print the response
	log.Printf("Response from driver service: %v", res)

	// Close the response body
	defer res.Body.Close()
}

func GetBookings(c *gin.Context) {
	userID := c.Query("id")
	role := c.Query("type")
	if userID != "" && role != "" {
		if role == "driver"{
			bookings, err := services.GetBookingsByDriverID(userID)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, bookings)
			return
		} else {
			bookings, err := services.GetBookingsByUserID(userID)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, bookings)
			return
		}
	}
	c.JSON(400, gin.H{"error": "User ID is required"})
}

func GetBookingByID(c *gin.Context) {
	id := c.Param("id")
	booking, err := services.FindBookingByID(id)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, booking)
}