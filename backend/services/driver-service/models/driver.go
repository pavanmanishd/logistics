package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Point struct {
	Type        string    `bson:"type" json:"type"`
	Coordinates [2]float64 `bson:"coordinates" json:"coordinates"`
}

type Driver struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	VehicleNo string             `bson:"vehicle_no" json:"vehicle_no"`
	LicenseNo string             `bson:"license_no" json:"license_no"`
	Avaliable bool               `bson:"avaliable" json:"avaliable"`
	Location  Point              `bson:"location" json:"location"`
}