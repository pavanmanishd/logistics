package services

import (
	"booking-service/config"
	"booking-service/models"
	"booking-service/repositories"

	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	// "github.com/google/uuid"
)

var bookingRepo *repositories.BookingRepository

func InitService() {
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(config.MongoURI))
	if err != nil {
		panic(err)
	}

	bookingRepo = repositories.NewBookingRepository(client.Database("logistics").Collection("bookings"))
}

func CreateBooking(booking models.Booking) error {
	return bookingRepo.CreateBooking(booking)
}

func FindBookingByID(id string) (models.Booking, error) {
	return bookingRepo.FindBookingByID(id)
}

func FindBookingByUserID(userID string) ([]models.Booking, error) {
	return bookingRepo.FindBookingByUserID(userID)
}

func FindBookingByDriverID(driverID string) ([]models.Booking, error) {
	return bookingRepo.FindBookingByDriverID(driverID)
}

func UpdateBookingStatus(id string, status string) error {
	return bookingRepo.UpdateBookingStatus(id, status)
}

func DeleteBooking(id string) error {
	return bookingRepo.DeleteBooking(id)
}

func GetBookingsByUserID(userID string) ([]models.Booking, error) {
	return bookingRepo.FindBookingByUserID(userID)
}