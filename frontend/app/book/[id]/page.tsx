"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import { useParams } from "next/navigation";

export default function BookingDetails() {
    const params = useParams();
    return (
        <ProtectedRoute element={
            <div>
                <h1>Booking Details</h1>
                <p>Booking ID: {params.id}</p>
            </div>
        }/>
    );
}