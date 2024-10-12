package services

import (
    "user-service/models"
    "user-service/repositories"
    "user-service/config"

    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
    "context"
)

var userRepo *repositories.UserRepository

func InitService() {
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(config.MongoURI))
	if err != nil {
		panic(err)
	}

    userRepo = repositories.NewUserRepository(client.Database("logistics").Collection("users"))
}

func CreateUser(user models.User) error {
    return userRepo.CreateUser(user)
}

func FindUserByEmail(email string) (models.User, error) {
    return userRepo.FindUserByEmail(email)
}
