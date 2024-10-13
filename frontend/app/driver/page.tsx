"use client";
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
        setWs(socket);

        sendLocation();
        // Clean up WebSocket connection on component unmount
        return () => {
            socket.close();
        };
    }, []);

    useEffect(() => {
        // Set interval to send location every 5 seconds
        const interval = setInterval(() => {
            sendLocation();
        }, 5000); // 5000 ms = 5 seconds

        // Clear interval on component unmount
        return () => {
            clearInterval(interval);
        };
    }, [ws, location]); // Dependency array to ensure it sends updated location

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

                if (ws) {
                    ws.send(jsonData);
                }
            });
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    };

    return (
        <div>
            <h3>Location Tracker</h3>
            <p>Latitude: {location.latitude}</p>
            <p>Longitude: {location.longitude}</p>
        </div>
    );
};

export default LocationTracker;
