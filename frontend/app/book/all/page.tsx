"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "@/validation/ProtectedRoute";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
    
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

    useEffect(() => {
        if (!userid) {
            return;
        }

        const socket = new WebSocket("ws://localhost:8080/ws/notification?id=" + userid);

        socket.onopen = () => {
            console.log("WebSocket connection established.");
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        socket.onmessage = (message) => {
            console.log("WebSocket message:", message.data);
            const msgJSON = JSON.parse(message.data);
            if (msgJSON.type == "update") {
                axios.get(`${bookingsAPIURL}/bookings?id=${userid}`)
                    .then((response) => {
                        setBookings(response.data);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        };

        return () => {
            socket.close();
        };

    }, [userid]);

    const handleClick = (id: string) => {
        router.push(`/book/${id}`);
    };

    return (
        <ProtectedRoute element={
            <div>
                <h1>All Bookings</h1>
                {bookings.length > 0 ? (
                    <ul>
                        {bookings.map((booking) => (
                            <li key={booking.id} onClick={() => handleClick(booking.id)}>
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
        } />
    );
}
