package services

import (
	"driver-service/config"
	"driver-service/models"
	"driver-service/repositories"

	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

)

var driverRepo *repositories.DriverRepository

func InitService() {
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(config.MongoURI))
	if err != nil {
		panic(err)
	}

	driverRepo = repositories.NewDriverRepository(client.Database("logistics").Collection("drivers"))
	driverRepo.CreateIndex()
}

func CreateDriver(driver models.Driver) error {
	return driverRepo.CreateDriver(driver)
}

func UpdateLocation(driverID string, longitude, latitude float64) error {
	return driverRepo.UpdateLocation(driverID, longitude, latitude)
}

func FindDriversInRadius(longitude, latitude, radius float64) ([]models.Driver, error) {
	return driverRepo.FindDriversInRadius(longitude, latitude, radius)
}

func GetDriverLocation(driverID string) (models.Point, error) {
	driver, err := driverRepo.FindDriverByID(driverID)
	if err != nil {
		return models.Point{}, err
	}

	return driver.Location, nil
}

func UpdateDriverAvailability(driverID string, available bool) error {
	return driverRepo.UpdateDriverAvailability(driverID, available)
}