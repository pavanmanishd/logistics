"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface Location {
  latitude: number;
  longitude: number;
}

interface Notification {
  id: string;
  booking_id: string;
  driver_id: string;
  user_id: string;
  message: string;
  timer: NodeJS.Timeout;
}

type LocationType = {
  type: string;
  coordinates: [number, number];
};

type Booking = {
  id: string;
  user_id: string;
  driver_id: string;
  status: string;
  source: LocationType;
  destination: LocationType;
  fare: number;
};

const timerForNotification = 5000;
const bookingsAPIURL = "http://" + process.env.NEXT_PUBLIC_IP;
const bookingsAPIWS = "ws://" + process.env.NEXT_PUBLIC_IP;

const LocationTracker: React.FC = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [location, setLocation] = useState<Location>({
    latitude: 0,
    longitude: 0,
  });
  const [driverId, setDriverId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationWs, setNotificationWs] = useState<WebSocket | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const driverId = localStorage.getItem("id");
    if (driverId) setDriverId(driverId);
  }, []);

  useEffect(() => {
    const socket = new WebSocket(bookingsAPIWS + "/ws/location");
    socket.onopen = () => setWs(socket);
    socket.onerror = (error) => console.error("WebSocket error:", error);
    return () => socket.close();
  }, []);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const interval = setInterval(() => sendLocation(), 5000);
      return () => clearInterval(interval);
    }
  }, [ws, location]);

  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        if (ws && ws.readyState === WebSocket.OPEN && driverId) {
          const jsonData = JSON.stringify({
            latitude,
            longitude,
            driver_id: driverId,
          });
          ws.send(jsonData);
        }
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    if (!driverId) return;
    const socket = new WebSocket(
      `${bookingsAPIWS}/ws/notification?id=${driverId}`
    );
    socket.onopen = () => setNotificationWs(socket);
    socket.onmessage = (event) => {
      const jsonData = JSON.parse(event.data);
      if (jsonData.type === "ask") {
        const parsedData = jsonData.body;
        const newNotification: Notification = {
          id: Date.now().toString(),
          booking_id: parsedData.booking_id,
          driver_id: parsedData.driver_id,
          user_id: parsedData.user_id,
          message: event.data,
          timer: setTimeout(() => {
            rejectNotification(
              Date.now().toString(),
              parsedData.booking_id,
              parsedData.driver_id,
              parsedData.user_id
            );
          }, timerForNotification),
        };
        setNotifications((prev) => [...prev, newNotification]);
      } else if (jsonData.type === "update") {
        window.location.reload();
      }
    };
    return () => socket.close();
  }, [driverId]);

  const acceptNotification = (
    id: string,
    booking_id: string,
    driver_id: string,
    user_id: string
  ) => {
    if (notificationWs && driverId) {
      notificationWs.send(
        JSON.stringify({
          driver_id,
          action: "driver.update",
          status: "Driver Accepted - Enroute to Source",
          booking_id,
          user_id,
        })
      );
      notifications.forEach((notification) => {
        if (notification.id !== id) {
          rejectNotification(
            notification.id,
            notification.booking_id,
            notification.driver_id,
            notification.user_id
          );
        }
      });
      setNotifications([]);
    }
  };

  const rejectNotification = (
    id: string,
    booking_id: string,
    driver_id: string,
    user_id: string
  ) => {
    if (notificationWs && driverId) {
      notificationWs.send(
        JSON.stringify({
          driver_id,
          action: "driver.update.reject",
          status: "Rejected",
          booking_id,
          user_id,
        })
      );
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    }
  };

  const goToCurrentBooking = () => {
    if (!driverId) return;
    axios
      .get(`${bookingsAPIURL}/booking/current/driver/${driverId}`)
      .then((response) => {
        const booking = response.data;
        if (booking && booking.id) {
          window.location.href = `/book/${booking.id}`;
        }
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    if (driverId) {
      axios
        .get(`${bookingsAPIURL}/bookings?id=${driverId}&type=driver`)
        .then((response) => setBookings(response.data))
        .catch((error) => console.error(error));
    }
  }, [driverId]);

  return (
    <ProtectedRoute
      element={
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4">Location Tracker</h3>
          <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
            <p className="text-gray-700">
              Latitude:{" "}
              <span className="font-semibold">{location.latitude}</span>
            </p>
            <p className="text-gray-700">
              Longitude:{" "}
              <span className="font-semibold">{location.longitude}</span>
            </p>
          </div>

          <h3 className="text-2xl font-bold mb-4">Notifications</h3>
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="mb-4 p-4 bg-gray-100 rounded-lg shadow-md"
              >
                {/* <p className="mb-2 text-gray-700">Message: <span className="font-semibold">{notification.message}</span></p> */}
                <div>
                  <p>New Booking:</p>
                  <p className="text-gray-700">
                    Booking ID: {notification.booking_id}
                  </p>
                  <p className="text-gray-700">
                    Driver ID: {notification.driver_id}
                  </p>
                  <p className="text-gray-700">
                    User ID: {notification.user_id}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() =>
                      acceptNotification(
                        notification.id,
                        notification.booking_id,
                        notification.driver_id,
                        notification.user_id
                      )
                    }
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      rejectNotification(
                        notification.id,
                        notification.booking_id,
                        notification.driver_id,
                        notification.user_id
                      )
                    }
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No notifications available.</p>
          )}

          <button
            onClick={goToCurrentBooking}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Current Booking
          </button>

          <h3 className="text-2xl font-bold mt-8 mb-4">All Bookings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {bookings && bookings.length > 0 ? (
              bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center bg-white p-4 rounded-lg shadow-md"
                >
                  <div className="flex-grow">
                    <p className="text-gray-700">
                      <span className="font-semibold">Booking ID:</span>{" "}
                      {booking.id}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">User ID:</span>{" "}
                      {booking.user_id}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Driver ID:</span>{" "}
                      {booking.driver_id}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Status:</span>{" "}
                      {booking.status}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Source:</span>{" "}
                      {booking.source.coordinates.join(", ")}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">Destination:</span>{" "}
                      {booking.destination.coordinates.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-800 font-bold">${booking.fare}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No bookings available.</p>
            )}
          </div>
        </div>
      }
    />
  );
};

export default LocationTracker;
