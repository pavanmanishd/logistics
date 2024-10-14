package repositories

import (
	"context"
	"driver-service/models"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type DriverRepository struct {
	collection *mongo.Collection
}

func NewDriverRepository(collection *mongo.Collection) *DriverRepository {
	return &DriverRepository{collection: collection}
}

func (repo *DriverRepository) CreateDriver(driver models.Driver) error {
	_, err := repo.collection.InsertOne(context.TODO(), driver)
	return err
}

func (repo *DriverRepository) FindDriverByVehicleNo(vehicleNo string) (models.Driver, error) {
	var driver models.Driver
	err := repo.collection.FindOne(context.TODO(), bson.M{"vehicle_no": vehicleNo}).Decode(&driver)
	return driver, err
}

func (repo *DriverRepository) FindDriverByID(id string) (models.Driver, error) {
	var driver models.Driver
	err := repo.collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&driver)
	return driver, err
}

func (repo *DriverRepository) UpdateDriverAvailability(id string, availability bool) error {
	_, err := repo.collection.UpdateOne(context.TODO(), bson.M{"_id": id}, bson.M{"$set": bson.M{"avaliable": availability}})
	return err
}

func (repo *DriverRepository) UpdateLocation(id string, longitude, latitude float64) error {
	log.Printf("Updating location for driver: %s", id)
	objectId,err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = repo.collection.UpdateOne(context.TODO(), bson.M{"_id": objectId}, bson.M{"$set": bson.M{"latitude": latitude, "longitude": longitude}})
	return err
}