package services

import (
	"errors"
	"io"
	"net/http"

	"auth-service/models"
	"encoding/json"
	"bytes"
)

// GetBookings is a function to get bookings
func GetBookings(userID, role string) ([]models.Booking, error) {
	resp, err := http.Get("http://booking-service:8081/bookings?id=" + userID + "&type=" + role)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var bookings []models.Booking
	err = json.Unmarshal(body, &bookings)
	if err != nil {
		return nil, err
	}

	return bookings, nil
}

func GetBookingByID(id string) (models.Booking, error) {
	resp, err := http.Get("http://booking-service:8081/booking/" + id)
	if err != nil {
		return models.Booking{}, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return models.Booking{}, err
	}

	var booking models.Booking
	err = json.Unmarshal(body, &booking)
	if err != nil {
		return models.Booking{}, err
	}

	return booking, nil
}

func GetCurrentBookingByDriverID(driverID string) (models.Booking, error) {
	resp, err := http.Get("http://booking-service:8081/booking/current/driver/" + driverID)
	if err != nil {
		return models.Booking{}, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return models.Booking{}, err
	}

	var booking models.Booking
	err = json.Unmarshal(body, &booking)
	if err != nil {
		return models.Booking{}, err
	}

	return booking, nil
}

func Book(bookingRequest models.BookingRequest) error{
	bytesData, err := json.Marshal(bookingRequest)
	if err != nil {
		return err
	}
	ioReader := bytes.NewReader(bytesData)
	resp, err := http.Post("http://booking-service:8081/book", "application/json", ioReader)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	//201
	if resp.StatusCode != http.StatusCreated {
		return errors.New("failed to book")
	}

	return nil
}

func GetDriverLocation(driverID string) (models.Point, error) {
	resp, err := http.Get("http://driver-service:8082/driver?id=" + driverID)
	if err != nil {
		return models.Point{}, err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return models.Point{}, err
	}

	var location models.Point
	err = json.Unmarshal(body, &location)
	if err != nil {
		return models.Point{}, err
	}

	return location, nil
}