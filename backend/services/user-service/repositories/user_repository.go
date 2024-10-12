package repositories

import (
	"context"
	"user-service/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserRepository struct {
	collection *mongo.Collection
}

func NewUserRepository(collection *mongo.Collection) *UserRepository {
    return &UserRepository{collection: collection}
}

func (repo *UserRepository) CreateUser(user models.User) error {
    _, err := repo.collection.InsertOne(context.TODO(), user)
    return err
}

func (repo *UserRepository) FindUserByEmail(email string) (models.User, error) {
    var user models.User
    err := repo.collection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&user)
    return user, err
}