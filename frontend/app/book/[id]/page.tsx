"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

type Location = {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
};

type Booking = {
    _id: string;
    user_id: string;
    driver_id: string;
    status: string;
    source: Location;
    destination: Location;
    fare: number;
};

const bookingsAPIURL = "http://localhost:8081";
export default function BookingDetails() {
    const params = useParams();
    const bookingId = params.id;
    const [booking, setBooking] = useState<Booking | null>(null);

    useEffect(() => {
        axios.get(`${bookingsAPIURL}/booking/${bookingId}`)
            .then((response) => {
                setBooking(response.data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, [bookingId]);


    return (
        <ProtectedRoute element={
            <div>
                <h1>Booking Details</h1>
                <p>Booking ID: {bookingId}</p>
                <p>User ID: {booking?.user_id}</p>
                <p>Driver ID: {booking?.driver_id}</p>
                <p>Status: {booking?.status}</p>
                <p>Source: {booking?.source.coordinates[0]}, {booking?.source.coordinates[1]}</p>
                <p>Destination: {booking?.destination.coordinates[0]}, {booking?.destination.coordinates[1]}</p>
                <p>Fare: {booking?.fare}</p>
            </div>
        }/>
    );
}