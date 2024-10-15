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
    const [driverId, setDriverId] = useState<string | null>(null);
    
    useEffect(() => {
        // Get driver ID from local storage
        const driverId = localStorage.getItem("id");
        if (driverId) {
            setDriverId(driverId);
        }
    }, []);
    
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


    const [notificationWs, setNotificationWs] = useState<WebSocket | null>(null);
    const [notification, setNotification] = useState(null);
 
    useEffect(() => {
        if (!driverId) {
            return;
        }
        // Open WebSocket connection
        const socket = new WebSocket(`ws://localhost:8080/ws/notification?id=${driverId}`);

        socket.onopen = () => {
            console.log("WebSocket connection established.");
            setNotificationWs(socket); // Set WebSocket only after the connection is established
        };

        socket.onmessage = (event) => {
            console.log("WebSocket message received:", event.data);
            setNotification(event.data);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        // Clean up WebSocket connection on component unmount
        return () => {
            socket.close();
        };
    }, [driverId]);

    return (
        <ProtectedRoute element={
            <div>
                <h3>Location Tracker</h3>
                <p>Latitude: {location.latitude}</p>
                <p>Longitude: {location.longitude}</p>
                {notification && <p>Notification: {notification}</p>}
            </div>
        } />
    );
};

export default LocationTracker;
