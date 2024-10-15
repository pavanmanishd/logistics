"use client";
import { useState, useEffect } from "react";
import axios from "axios";

const bookingsAPIURL = "http://localhost:8081";

type Location = {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
};

type Booking = {
    id: string;
    user_id: string;
    driver_id: string;
    status: string;
    source: Location;
    destination: Location;
    fare: number;
};

export default function AllBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [userid, setUserid] = useState<string>("");

    useEffect(() => {
        const id = localStorage.getItem("id");
        if (id) {
            setUserid(id);
        }
    }, []);

    useEffect(() => {
        if (userid) {
            axios.get(`${bookingsAPIURL}/bookings?id=${userid}`)
                .then((response) => {
                    setBookings(response.data);
                })
                .catch((error) => {
                    console.error(error);
                });
        }
    }, [userid]);

    return (
        <div>
            <h1>All Bookings</h1>
            {bookings.length > 0 ? (
                <ul>
                    {bookings.map((booking) => (
                        <li key={booking.id}>
                            <p>Booking ID: {booking.id}</p>
                            <p>User ID: {booking.user_id}</p>
                            <p>Driver ID: {booking.driver_id}</p>
                            <p>Status: {booking.status}</p>
                            <p>Source: {booking.source.coordinates.join(", ")}</p>
                            <p>Destination: {booking.destination.coordinates.join(", ")}</p>
                            <p>Fare: ${booking.fare.toFixed(2)}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No bookings found.</p>
            )}
        </div>
    );
}
