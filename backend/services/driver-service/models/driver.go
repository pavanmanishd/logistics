package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Driver struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	VehicleNo string             `bson:"vehicle_no" json:"vehicle_no"`
	LicenseNo string             `bson:"license_no" json:"license_no"`
	Avaliable bool               `bson:"avaliable" json:"avaliable"`
}