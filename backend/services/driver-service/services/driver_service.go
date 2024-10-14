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
}

func CreateDriver(driver models.Driver) error {
	return driverRepo.CreateDriver(driver)
}

func UpdateLocation(driverID string, longitude, latitude float64) error {
	return driverRepo.UpdateLocation(driverID, longitude, latitude)
}