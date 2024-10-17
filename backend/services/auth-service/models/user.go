package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Auth struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name     string             `bson:"name" json:"name"`
	Email    string             `bson:"email" json:"email"`
	Password string             `bson:"password" json:"password"`
	Role     string             `bson:"role" json:"role"`
}

type AdditionalAuth struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Email    string             `bson:"email" json:"email"`
	VehicleNo string             `bson:"vehicle_no" json:"vehicle_no"`
	LicenseNo string             `bson:"license_no" json:"license_no"`
}


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