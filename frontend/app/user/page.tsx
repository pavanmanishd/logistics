"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

function debounce(func: Function, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

const accessToken = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
const bookingsAPIURL = "https://" + process.env.NEXT_PUBLIC_IP;
const bookingAPIWS = "wss://" + process.env.NEXT_PUBLIC_IP;

type Location = {
  type: string;
  coordinates: [number, number];
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

export default function User() {
  const [source, setSource] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<any | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("id");
    if (userId) setUserId(userId);
  }, []);

  const search = async (text: string, type: "source" | "destination") => {
    if (!text) return;
    try {
      const response = await axios.get(`https://api.olamaps.io/places/v1/autocomplete?input=${text}&api_key=${accessToken}`);
      if (type === "source") setSourceSuggestions(response.data.predictions);
      else setDestinationSuggestions(response.data.predictions);
    } catch (error) {
      console.error("Error searching places:", error);
    }
  };

  const debouncedSearch = useCallback(debounce(search, 500), [accessToken]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSource(text);
    debouncedSearch(text, "source");
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDestination(text);
    debouncedSearch(text, "destination");
  };

  const handleSourceClick = (suggestion: any) => {
    setSource(suggestion.description);
    setSelectedSource(suggestion);
    setSourceSuggestions([]);
  };

  const handleDestinationClick = (suggestion: any) => {
    setDestination(suggestion.description);
    setSelectedDestination(suggestion);
    setDestinationSuggestions([]);
  };

  const fetchDistanceAndCalculateFare = useCallback(async () => {
    if (!selectedSource || !selectedDestination) return;
    try {
      const sourceCoords = selectedSource.geometry.location;
      const destinationCoords = selectedDestination.geometry.location;
      const response = await axios.get(
        `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${sourceCoords.lat},${sourceCoords.lng}&destinations=${destinationCoords.lat},${destinationCoords.lng}&api_key=${accessToken}`
      );
      const distanceInMeters = response.data.rows[0].elements[0].distance;
      const durationInSeconds = response.data.rows[0].elements[0].duration;
      const baseFare = 40;
      const costPerKm = 15;
      const costPerMinute = 2;
      const distanceInKm = distanceInMeters / 1000;
      const durationInMinutes = durationInSeconds / 60;
      const estimatedFare = baseFare + costPerKm * distanceInKm + costPerMinute * durationInMinutes;
      setFare(estimatedFare);
    } catch (error) {
      console.error("Error calculating distance and fare:", error);
    }
  }, [selectedSource, selectedDestination]);

  useEffect(() => {
    fetchDistanceAndCalculateFare();
  }, [selectedSource, selectedDestination, fetchDistanceAndCalculateFare]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || !selectedDestination || fare === null) {
      alert("Please enter both valid source and destination, and ensure fare is calculated.");
      return;
    }
    try {
      if (!userId) {
        alert("User not authenticated!");
        return;
      }
      const sourceLocation = {
        longitude: selectedSource.geometry.location.lng,
        latitude: selectedSource.geometry.location.lat,
      };
      const destinationLocation = {
        longitude: selectedDestination.geometry.location.lng,
        latitude: selectedDestination.geometry.location.lat,
      };
      const response = await axios.post(`${bookingsAPIURL}/book`, {
        user_id: userId,
        source: sourceLocation,
        destination: destinationLocation,
        fare: fare,
      });
      console.log("Booking successful:", response.data);
    } catch (error) {
      console.error("Error booking:", error);
      alert("Error booking!");
    }
  };

  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (userId) {
      axios
        .get(`${bookingsAPIURL}/bookings?id=${userId}&type=customer`)
        .then((response) => setBookings(response.data))
        .catch((error) => console.error(error));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const socket = new WebSocket(bookingAPIWS + "/ws/notification?id=" + userId);
    socket.onopen = () => console.log("WebSocket connection established.");
    socket.onerror = (error) => console.error("WebSocket error:", error);
    socket.onmessage = (message) => {
      const msgJSON = JSON.parse(message.data);
      if (msgJSON.type === "update") {
        axios
          .get(`${bookingsAPIURL}/bookings?id=${userId}&type=customer`)
          .then((response) => setBookings(response.data))
          .catch((error) => console.error(error));
      }
    };
    return () => {
      socket.close();
    };
  }, [userId]);

  const handleClick = (id: string) => {
    router.push(`/book/${id}`);
  };

  return (
    <ProtectedRoute
      element={
        <>
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-4">Book</h3>
            <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded-lg shadow-md">
              <div className="mb-4">
                <label htmlFor="Source" className="block text-gray-700">Source</label>
                <input type="text" id="Source" value={source} onChange={handleSourceChange} className="w-full p-2 border rounded text-black" />
                {sourceSuggestions.length > 0 && (
                  <ul className="mt-2 bg-white border rounded shadow-md">
                    {sourceSuggestions.map((suggestion, index) => (
                      <li key={index} onClick={() => handleSourceClick(suggestion)} className="p-2 cursor-pointer hover:bg-gray-200 text-black">
                        {suggestion.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="Destination" className="block text-gray-700">Destination</label>
                <input type="text" id="Destination" value={destination} onChange={handleDestinationChange} className="w-full p-2 border rounded text-black" />
                {destinationSuggestions.length > 0 && (
                  <ul className="mt-2 bg-white border rounded shadow-md">
                    {destinationSuggestions.map((suggestion, index) => (
                      <li key={index} onClick={() => handleDestinationClick(suggestion)} className="p-2 cursor-pointer hover:bg-gray-200 text-black">
                        {suggestion.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mb-4">
                <p className="text-gray-700">Estimated Fare: {fare !== null ? `Rs.${fare.toFixed(2)}` : "Calculating..."}</p>
              </div>
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Book</button>
            </form>
          </div>
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-4">All Bookings</h3>
            {bookings && bookings.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {bookings.map((booking) => (
                  <li key={booking.id} onClick={() => handleClick(booking.id)} className="p-4 bg-white rounded-lg shadow-md cursor-pointer hover:bg-gray-100">
                    <p className="text-gray-700"><span className="font-semibold">Booking ID:</span> {booking.id}</p>
                    <p className="text-gray-700"><span className="font-semibold">User ID:</span> {booking.user_id}</p>
                    <p className="text-gray-700"><span className="font-semibold">Driver ID:</span> {booking.driver_id}</p>
                    <p className="text-gray-700"><span className="font-semibold">Status:</span> {booking.status}</p>
                    <p className="text-gray-700"><span className="font-semibold">Source:</span> {booking.source.coordinates.join(", ")}</p>
                    <p className="text-gray-700"><span className="font-semibold">Destination:</span> {booking.destination.coordinates.join(", ")}</p>
                    <p className="text-gray-800 font-bold">Rs.{booking.fare.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No bookings found.</p>
            )}
          </div>
        </>
      }
    />
  );
}