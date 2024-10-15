"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import dynamic from 'next/dynamic'; // Import dynamic for client-side import

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
// Set the default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

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

    const [position, setPosition] = useState<[number, number]>([0, 0]);
    useEffect(() => {
        if (booking) {
            setPosition([booking.source.coordinates[1], booking.source.coordinates[0]]);
        }
    }, [booking]);

    const [carloc, setCarloc] = useState<[number, number]>([0, 0]);
    useEffect(() => {
        if (!booking) return;
        const fetchLocation = () => {
            axios.get(`http://localhost:8082/driver?id=${booking.driver_id}`)
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
                        <Marker position={[carloc[1],carloc[0]]} icon={CarIcon}>
                            <Tooltip permanent>
                                Car Location: {carloc[0]}, {carloc[1]}
                            </Tooltip>
                        </Marker>
                    </MapContainer>
                }
            </div>
        }/>
    );
}
