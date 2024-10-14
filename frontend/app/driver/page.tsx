"use client";
import ProtectedRoute from '@/validation/ProtectedRoute';
import React, { useEffect, useState } from 'react';

interface Location {
    latitude: number;
    longitude: number;
}

const LocationTracker: React.FC = () => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [location, setLocation] = useState<Location>({ latitude: 0, longitude: 0 });

    useEffect(() => {
        // Open WebSocket connection
        const socket = new WebSocket("ws://localhost:8080/ws/location");

        socket.onopen = () => {
            console.log("WebSocket connection established.");
            setWs(socket); // Set WebSocket only after the connection is established
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        // Clean up WebSocket connection on component unmount
        return () => {
            socket.close();
        };
    }, []);

    useEffect(() => {
        // Send location every 5 seconds only if the WebSocket connection is ready
        if (ws && ws.readyState === WebSocket.OPEN) {
            const interval = setInterval(() => {
                sendLocation();
            }, 5000);

            // Clear interval on component unmount
            return () => {
                clearInterval(interval);
            };
        }
    }, [ws, ws?.readyState, location]); // Depend on ws and location

    const sendLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });

                const jsonData = JSON.stringify({
                    latitude: latitude,
                    longitude: longitude,
                    driver_id: "driver123" // Replace with real driver ID
                });

                console.log("Sending location:", jsonData);

                if (ws && ws.readyState === WebSocket.OPEN) {
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
        <ProtectedRoute>
            <div>
                <h3>Location Tracker</h3>
                <p>Latitude: {location.latitude}</p>
                <p>Longitude: {location.longitude}</p>
            </div>
        </ProtectedRoute>
    );
};

export default LocationTracker;
