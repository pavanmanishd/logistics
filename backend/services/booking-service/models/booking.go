package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Point struct {
	Type        string    `bson:"type" json:"type"`         // Always "Point"
	Coordinates [2]float64 `bson:"coordinates" json:"coordinates"` // [longitude, latitude]
}

type Booking struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID      string             `bson:"user_id" json:"user_id"`
	DriverID    string             `bson:"driver_id" json:"driver_id"`
	Status      string             `bson:"status" json:"status"`
	Source      Point              `bson:"source" json:"source"`
	Destination Point              `bson:"destination" json:"destination"`
	Fare        float64            `bson:"fare" json:"fare"`
}


type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type BookingRequest struct {
	UserID      string `json:"user_id"`
	Source      Location  `json:"source"`
	Destination Location  `json:"destination"`
	Fare        float64 `json:"fare"`
}