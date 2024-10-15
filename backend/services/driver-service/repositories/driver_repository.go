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
	did, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return driver, err
	}
	err = repo.collection.FindOne(context.TODO(), bson.M{"_id": did}).Decode(&driver)
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
	_, err = repo.collection.UpdateOne(context.TODO(), bson.M{"_id": objectId}, bson.M{"$set": bson.M{"location": models.Point{Type: "Point", Coordinates: [2]float64{longitude, latitude}}}})
	return err
}

func (repo *DriverRepository) FindDriversInRadius(longitude, latitude, radius float64) ([]models.Driver, error) {
	cursor, err := repo.collection.Find(context.TODO(), bson.M{"location": bson.M{"$near": bson.M{"$geometry": bson.M{"type": "Point", "coordinates": [2]float64{longitude, latitude}}, "$maxDistance": radius}}})
	if err != nil {
		log.Printf("Error finding drivers in radius: %s", err.Error())
		return nil, err
	}
	defer cursor.Close(context.Background())
	log.Printf("Found %d drivers in radius", cursor.RemainingBatchLength())
	var drivers []models.Driver
	err = cursor.All(context.Background(), &drivers)
	return drivers, err
}

func (repo *DriverRepository) CreateIndex() {
	_, err := repo.collection.Indexes().CreateOne(context.TODO(), mongo.IndexModel{
		Keys: bson.M{"location": "2dsphere"},
	})
	if err != nil {
		log.Printf("Error creating index: %s", err.Error())
	}
}