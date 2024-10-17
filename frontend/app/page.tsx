"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import { useEffect } from "react";
export default function Home() {
  useEffect (() => {
    const role = localStorage.getItem('role');
    if (role === 'driver') {
      window.location.href = '/driver';
    } else if (role === 'customer') {
      window.location.href = '/user';
    } else {
      window.location.href = '/login';
    }
  }, []);
  return (
    <ProtectedRoute element={<div>Redirecting...</div>} />
  );
}
