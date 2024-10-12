package services

import (
	"auth-service/config"
	"auth-service/models"
	"auth-service/repositories"

	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var authRepo *repositories.AuthRepository

func InitService() {
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(config.MongoURI))
	if err != nil {
		panic(err)
	}

	authRepo = repositories.NewAuthRepository(client.Database("logistics").Collection("auths"))
}

func CreateAuth(auth models.Auth) error {
	return authRepo.CreateAuth(auth)
}

func FindAuthByEmail(email string) (models.Auth, error) {
	return authRepo.FindAuthByEmail(email)
}

func FindAuthByID(id string) (models.Auth, error) {
	return authRepo.FindAuthByID(id)
}