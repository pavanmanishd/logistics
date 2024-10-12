package repositories

import (
	"auth-service/models"
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthRepository struct {
	collection *mongo.Collection
}

func NewAuthRepository(collection *mongo.Collection) *AuthRepository {
	return &AuthRepository{collection: collection}
}

func (repo *AuthRepository) CreateAuth(auth models.Auth) error {
	_, err := repo.collection.InsertOne(context.TODO(), auth)
	return err
}

func (repo *AuthRepository) FindAuthByEmail(email string) (models.Auth, error) {
	var auth models.Auth
	err := repo.collection.FindOne(context.TODO(), bson.M{"email": email}).Decode(&auth)
	return auth, err
}

func (repo *AuthRepository) FindAuthByID(id string) (models.Auth, error) {
	var auth models.Auth
	err := repo.collection.FindOne(context.TODO(), bson.M{"_id": id}).Decode(&auth)
	return auth, err
}