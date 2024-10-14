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