"use client";
import { use, useEffect, useState } from "react";
import axios from "axios";
import dynamic from 'next/dynamic'; // Import dynamic for client-side import
import ProtectedRoute from "@/validation/ProtectedRoute";
import { useParams } from "next/navigation";

// Dynamically import the MapContainer, Marker, TileLayer, and Tooltip from 'react-leaflet' only on the client side
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then(mod => mod.Tooltip), { ssr: false });

import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS

// Import Leaflet's default marker icon assets
import L from "leaflet";
import "leaflet/dist/images/marker-icon.png";
import "leaflet/dist/images/marker-shadow.png";

// Fix default marker icon issues
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconAnchor: [12, 41], // Adjust to make it appear at the correct position
});

const CarIcon = L.icon({
    iconUrl: "/car.png", // Replace with your custom destination marker icon URL
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [32, 41], // Adjust size of the icon
    iconAnchor: [16, 41], // Anchor point of the icon (centered at bottom)
    popupAnchor: [0, -41], // Popup anchor if needed
});
L.Marker.prototype.options.icon = DefaultIcon;

const currentStatuses = [
    "Booking Placed - Waiting for Driver",
    "Driver Accepted - Enroute to Source",
    "Driver Arrived - Picked Up",
    "Enroute to Destination",
    "Dropped at Destination",
    "Booking Completed",
];

const bookingsAPIURL = "http://localhost:8080";

interface Booking {
    id: string;
    user_id: string;
    driver_id: string;
    status: string;
    source: {
        type: string;
        coordinates: [number, number];
    };
    destination: {
        type: string;
        coordinates: [number, number];
    };
    fare: number;
}

interface Location {
    latitude: number;
    longitude: number;
}

export default function BookingDetails() {
    const params = useParams();
    const bookingId = params.id;
    const [booking, setBooking] = useState<Booking | null>(null);
    const [currentStatusIndex, setCurrentStatusIndex] = useState<number>(0); // Track the current status
    const [position, setPosition] = useState<[number, number]>([0, 0]);
    const [carloc, setCarloc] = useState<[number, number]>([0, 0]);
    const [userRole, setUserRole] = useState<string | null>(null);
    
    useEffect(() => {
        axios.get(`${bookingsAPIURL}/booking/${bookingId}`)
            .then((response) => {
                setBooking(response.data);
                setCurrentStatusIndex(currentStatuses.indexOf(response.data.status));
            })
            .catch((error) => {
                console.error(error);
            });
    }, [bookingId]);

    useEffect(() => {
        if (booking) {
            setPosition([booking.source.coordinates[1], booking.source.coordinates[0]]);
        }
    }, [booking]);

    useEffect(() => {
        if (!booking) return;
        const fetchLocation = () => {
            axios.get(`http://localhost:8080/driver?id=${booking.driver_id}`)
            .then((response) => {
                setCarloc(response.data.coordinates);
            })
            .catch((error) => {
                console.error(error);
            });
        };
        
        fetchLocation();
        const interval = setInterval(fetchLocation, 4000);
        return () => clearInterval(interval);
    }, [booking]);

    useEffect(() => {
        const userRole = localStorage.getItem("role");
        if (userRole) {
            setUserRole(userRole);
        }
    }, []);

    const [notificationWs, setNotificationWs] = useState<WebSocket | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const userId = localStorage.getItem("id");
        if (userId) {
            setUserId(userId);
        }
    }, []);


    useEffect(() => {
        if (!userId) {
            console.log("User ID not available.", userId);
            return;
        }

        const socket = new WebSocket(`ws://localhost:8080/ws/notification?id=${userId}`);

        socket.onopen = () => {
            console.log("Notification WebSocket connection established.");
            setNotificationWs(socket);
        };

        socket.onmessage = (event) => {
            console.log("WebSocket notification received:", event.data);

            const jsonData = JSON.parse(event.data);
            console.log(jsonData);
            if(jsonData.type == "update") {
                axios.get(`${bookingsAPIURL}/booking/${bookingId}`)
                    .then((response) => {
                        setBooking(response.data);
                        setCurrentStatusIndex(currentStatuses.indexOf(response.data.status));
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        };

        socket.onerror = (error) => {
            console.error("Notification WebSocket error:", error);
        };

        return () => {
            socket.close();
        };
    }, [userId, bookingId]);
    

    const nextStatus = () => {
        if (currentStatusIndex < currentStatuses.length - 1) {
            setCurrentStatusIndex(currentStatusIndex + 1);
            if (notificationWs && booking) {
                const jsonData = JSON.stringify({ driver_id: booking.driver_id, booking_id: booking.id, status: currentStatuses[currentStatusIndex + 1], user_id: booking.user_id,action: "driver.update" });
                notificationWs.send(jsonData);
            }       
        }
    };

    const [ws, setWs] = useState<WebSocket | null>(null);
    const [location, setLocation] = useState<Location>({ latitude: 0, longitude: 0 });
    const [driverId, setDriverId] = useState<string | null>(null);

    useEffect(() => {
        if (!userRole) {
            return;
        }
        if (userRole == "driver") {
            const driverId = localStorage.getItem("id");
            if (driverId) {
                setDriverId(driverId);
            }
        }
    }, [userRole]);

    useEffect(() => {
        if (!userRole || userRole != "driver") {
            return;
        }
        // Open WebSocket connection for location tracking
        const socket = new WebSocket("ws://localhost:8080/ws/location");

        socket.onopen = () => {
            console.log("WebSocket connection established.");
            setWs(socket); // Set WebSocket only after the connection is established
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            socket.close();
        };
    }, [userRole]);


    useEffect(() => {
        if (!userRole || userRole != "driver") {
            return;
        }
        if (ws && ws.readyState === WebSocket.OPEN) {
            const interval = setInterval(() => {
                sendLocation();
            }, 5000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [ws, ws?.readyState, location, userRole]);

    const sendLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });

                const jsonData = JSON.stringify({
                    latitude: latitude,
                    longitude: longitude,
                    driver_id: driverId,
                });

                console.log("Sending location:", jsonData);

                if (ws && ws.readyState === WebSocket.OPEN) {
                    if (!driverId) {
                        console.error("Driver ID is not set.");
                        return;
                    }
                    ws.send(jsonData);
                } else {
                    console.error("WebSocket connection is not open.");
                }
            });
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    };

    

    return (
        <ProtectedRoute element={
            <div>
                <h1>Booking Details</h1>
                <p>Booking ID: {bookingId}</p>
                <p>User ID: {booking?.user_id}</p>
                <p>Driver ID: {booking?.driver_id}</p>
                <p>Status: {currentStatuses[currentStatusIndex]}</p>
                <p>Source: {booking?.source.coordinates[0]}, {booking?.source.coordinates[1]}</p>
                <p>Destination: {booking?.destination.coordinates[0]}, {booking?.destination.coordinates[1]}</p>
                <p>Fare: {booking?.fare}</p>

                {/* Conditionally render the Map only if booking data is available */}
                {booking &&
                    <MapContainer
                        center={position}
                        zoom={13}
                        scrollWheelZoom={false}
                        style={{ height: '400px', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {/* Source Marker */}
                        <Marker position={[booking.source.coordinates[1], booking.source.coordinates[0]]}>
                            <Tooltip permanent>
                                Source Location: {booking.source.coordinates[0]}, {booking.source.coordinates[1]}
                            </Tooltip>
                        </Marker>
                        {/* Destination Marker */}
                        <Marker position={[booking.destination.coordinates[1], booking.destination.coordinates[0]]}>
                            <Tooltip permanent>
                                Destination Location: {booking.destination.coordinates[0]}, {booking.destination.coordinates[1]}
                            </Tooltip>
                        </Marker>
                        {/* Car Marker */}
                        <Marker position={[carloc[1], carloc[0]]} icon={CarIcon}>
                            <Tooltip permanent>
                                {(!userRole || userRole != "driver") ? (
                                        `Car Location: ${carloc[0]}, ${carloc[1]}`
                                ) : (
                                    "Your Location"
                                )}
                            </Tooltip>
                        </Marker>
                    </MapContainer>
                }

                {/* Display button only for drivers */}
                {userRole === "driver" && (
                    <div>
                        <h2>Change Status</h2>
                        <p>Current Status: {currentStatuses[currentStatusIndex]}</p>
                        {currentStatusIndex < currentStatuses.length - 1 && (
                            <button onClick={nextStatus}>Next Status</button>
                        )}
                    </div>
                )}
            </div>
        }/>
    );
}
