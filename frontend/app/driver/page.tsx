"use client";
import ProtectedRoute from '@/validation/ProtectedRoute';
import React, { useEffect, useState } from 'react';

interface Location {
    latitude: number;
    longitude: number;
}

interface Notification {
    id: string; // Unique identifier for each notification
    booking_id: string;
    driver_id: string;
    user_id: string;
    message: string;
    timer: NodeJS.Timeout; // Reference to the timer for auto-rejection
}

const timerForNotification = 5000; // 5 seconds for each notification

const LocationTracker: React.FC = () => {
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [location, setLocation] = useState<Location>({ latitude: 0, longitude: 0 });
    const [driverId, setDriverId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]); // Store multiple notifications
    const [notificationWs, setNotificationWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        // Get driver ID from local storage
        const driverId = localStorage.getItem("id");
        if (driverId) {
            setDriverId(driverId);
        }
    }, []);

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const interval = setInterval(() => {
                sendLocation();
            }, 5000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [ws, ws?.readyState, location]);

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

    useEffect(() => {
        if (!driverId) {
            return;
        }

        const socket = new WebSocket(`ws://localhost:8080/ws/notification?id=${driverId}`);

        socket.onopen = () => {
            console.log("Notification WebSocket connection established.");
            setNotificationWs(socket);
        };

        socket.onmessage = (event) => {
            console.log("WebSocket notification received:", event.data);

            const jsonData = JSON.parse(event.data);

            if (jsonData.type == "ask") {
                const parsedData = jsonData.body;
                const newNotification: Notification = {
                    id: Date.now().toString(), // Create a unique ID for each notification
                    booking_id: parsedData.booking_id, // Extract booking_id
                    driver_id: parsedData.driver_id,   // Extract driver_id
                    user_id: parsedData.user_id,       // Extract user_id
                    message: event.data,
                    timer: setTimeout(() => {
                        rejectNotification(Date.now().toString(), parsedData.booking_id, parsedData.driver_id, parsedData.user_id); // Reject on timeout
                    }, timerForNotification)
                };

                setNotifications((prevNotifications) => [...prevNotifications, newNotification]); // Add to the queue
            } else if(jsonData.type == "update") {
                window.location.reload();
            }
        };

        socket.onerror = (error) => {
            console.error("Notification WebSocket error:", error);
        };

        return () => {
            socket.close();
        };
    }, [driverId]);

    const acceptNotification = (id: string, booking_id: string, driver_id: string, user_id: string) => {
        console.log("Notification accepted.");

        // Send acceptance for the accepted notification along with booking_id and driver_id
        if (notificationWs && driverId) {
            notificationWs.send(JSON.stringify({ driver_id, action: "driver.update.accept", notification_id: id, booking_id, user_id }));
        }

        // Reject all other notifications
        notifications.forEach((notification) => {
            if (notification.id !== id) {
                rejectNotification(notification.id, notification.booking_id, notification.driver_id, notification.user_id);
            }
        });

        // Clear the entire notification queue
        setNotifications([]);
    };

    const rejectNotification = (id: string, booking_id: string, driver_id: string, user_id: string) => {
        console.log("Notification rejected.", id);

        // Send rejection to the server with booking_id and driver_id
        if (notificationWs && driverId) {
            notificationWs.send(JSON.stringify({ driver_id, action: "driver.update.reject", notification_id: id, booking_id, user_id }));
        }

        // Remove the rejected notification from the queue
        setNotifications((prevNotifications) =>
            prevNotifications.filter((notification) => notification.id !== id)
        );
    };

    return (
        <ProtectedRoute element={
            <div>
                <h3>Location Tracker</h3>
                <p>Latitude: {location.latitude}</p>
                <p>Longitude: {location.longitude}</p>

                {/* Display all notifications */}
                {notifications.length > 0 && notifications.map((notification) => (
                    <div key={notification.id}>
                        <p>Notification: {notification.message}</p>
                        <button onClick={() => acceptNotification(notification.id, notification.booking_id, notification.driver_id, notification.user_id)}>Accept</button>
                        <button onClick={() => rejectNotification(notification.id, notification.booking_id, notification.driver_id, notification.user_id)}>Reject</button>
                    </div>
                ))}
            </div>
        } />
    );
};

export default LocationTracker;
