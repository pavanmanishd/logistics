package repositories

import (
	"booking-service/models"
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BookingRepository struct {
	collection *mongo.Collection
}

func NewBookingRepository(collection *mongo.Collection) *BookingRepository {
	return &BookingRepository{collection: collection}
}

func (repo *BookingRepository) CreateBooking(booking models.Booking) (string, error) {
	res, err := repo.collection.InsertOne(context.TODO(), booking)
	if err != nil {
		return "", err
	}
	id := res.InsertedID.(primitive.ObjectID).Hex()
	return id, nil
}

func (repo *BookingRepository) FindBookingByID(id string) (models.Booking, error) {
	var booking models.Booking
	bid,err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return booking, err
	}
	err = repo.collection.FindOne(context.TODO(), bson.M{"_id": bid}).Decode(&booking)
	return booking, err
}

func (repo *BookingRepository) FindBookingByUserID(userID string) ([]models.Booking, error) {
	var bookings []models.Booking
	cursor, err := repo.collection.Find(context.TODO(), bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}

	err = cursor.All(context.TODO(), &bookings)
	return bookings, err
}

func (repo *BookingRepository) FindBookingByDriverID(driverID string) ([]models.Booking, error) {
	var bookings []models.Booking
	cursor, err := repo.collection.Find(context.TODO(), bson.M{"driver_id": driverID})
	if err != nil {
		return nil, err
	}

	err = cursor.All(context.TODO(), &bookings)
	return bookings, err
}

func (repo *BookingRepository) UpdateBookingStatus(id string, status string) error {
	_, err := repo.collection.UpdateOne(context.TODO(), bson.M{"_id": id}, bson.M{"$set": bson.M{"status": status}})
	return err
}

func (repo *BookingRepository) DeleteBooking(id string) error {
	_, err := repo.collection.DeleteOne(context.TODO(), bson.M{"_id": id})
	return err
}

func (repo *BookingRepository) FindBookingByUserIDAndAddDriverID(userID string, driverID string) error {
	_, err := repo.collection.UpdateOne(context.TODO(), bson.M{"user_id": userID, "driver_id": ""}, bson.M{"$set": bson.M{"driver_id": driverID}})
	return err
}

func (repo *BookingRepository) UpdateDriverID(bookingID string, driverID string) error {
	bookingIDObjectID, _ := primitive.ObjectIDFromHex(bookingID)
	_, err := repo.collection.UpdateOne(context.TODO(), bson.M{"_id": bookingIDObjectID, "driver_id": ""}, bson.M{"$set": bson.M{"driver_id": driverID, "status": "accepted"}})
	return err
}