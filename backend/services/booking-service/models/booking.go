package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Booking struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    string             `bson:"user_id" json:"user_id"`
	DriverID  string             `bson:"driver_id" json:"driver_id"`
	Source    string             `bson:"source" json:"source"`
	Destination string             `bson:"destination" json:"destination"`
	Status    string             `bson:"status" json:"status"`
}