"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
// Debounce function to limit API calls
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
const bookingAPIURL = "http://localhost:8080";

type Location = {
  type: string;
  coordinates: [number, number]; // [longitude, latitude]
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
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>(
    []
  );
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<any | null>(
    null
  );
  const [fare, setFare] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("id");
    if (userId) {
      setUserId(userId);
    }
  }, []);

  // Debounced search function
  const search = async (text: string, type: "source" | "destination") => {
    if (!text) return;

    try {
      const response = await axios.get(
        `https://api.olamaps.io/places/v1/autocomplete?input=${text}&api_key=${accessToken}`
      );
      if (type === "source") {
        setSourceSuggestions(response.data.predictions);
      } else if (type === "destination") {
        setDestinationSuggestions(response.data.predictions);
      }
    } catch (error) {
      console.error("Error searching places:", error);
    }
  };

  // Memoized debounce function
  const debouncedSearch = useCallback(debounce(search, 500), [accessToken]);

  // Handle source input change
  const handleSourceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSource(text);
    debouncedSearch(text, "source");
  };

  // Handle destination input change
  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDestination(text);
    debouncedSearch(text, "destination");
  };

  // Handle suggestion click for source
  const handleSourceClick = (suggestion: any) => {
    setSource(suggestion.description);
    setSelectedSource(suggestion);
    setSourceSuggestions([]);
  };

  // Handle suggestion click for destination
  const handleDestinationClick = (suggestion: any) => {
    setDestination(suggestion.description);
    setSelectedDestination(suggestion);
    setDestinationSuggestions([]);
  };

  // Fetch distance and calculate fare
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

      const estimatedFare =
        baseFare + costPerKm * distanceInKm + costPerMinute * durationInMinutes;

      setFare(estimatedFare);
    } catch (error) {
      console.error("Error calculating distance and fare:", error);
    }
  }, [selectedSource, selectedDestination]);

  useEffect(() => {
    fetchDistanceAndCalculateFare();
  }, [selectedSource, selectedDestination, fetchDistanceAndCalculateFare]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSource || !selectedDestination || fare === null) {
      alert(
        "Please enter both valid source and destination, and ensure fare is calculated."
      );
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

      const response = await axios.post(`${bookingAPIURL}/book`, {
        user_id: userId,
        source: sourceLocation,
        destination: destinationLocation,
        fare: fare,
      });

      console.log("Booking successful:", response.data);
      // router.push("/book/all");
    } catch (error) {
      console.error("Error booking:", error);
      alert("Error booking!");
    }
  };

  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const id = localStorage.getItem("id");
    if (id) {
      setUserId(id);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      axios
        .get(`${bookingAPIURL}/bookings?id=${userId}&type=customer`)
        .then((response) => {
          setBookings(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const socket = new WebSocket(
      "ws://localhost:8080/ws/notification?id=" + userId
    );

    socket.onopen = () => {
      console.log("WebSocket connection established.");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onmessage = (message) => {
      console.log("WebSocket message:", message.data);
      const msgJSON = JSON.parse(message.data);
      if (msgJSON.type == "update") {
        axios
          .get(`${bookingAPIURL}/bookings?id=${userId}&type=customer`)
          .then((response) => {
            setBookings(response.data);
          })
          .catch((error) => {
            console.error(error);
          });
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
          <div>
            <h1>Book</h1>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="Source">Source</label>
                <input
                  type="text"
                  id="Source"
                  value={source}
                  onChange={handleSourceChange}
                />
                {sourceSuggestions.length > 0 && (
                  <ul>
                    {sourceSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSourceClick(suggestion)}
                        style={{ cursor: "pointer" }}
                      >
                        {suggestion.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label htmlFor="Destination">Destination</label>
                <input
                  type="text"
                  id="Destination"
                  value={destination}
                  onChange={handleDestinationChange}
                />
                {destinationSuggestions.length > 0 && (
                  <ul>
                    {destinationSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleDestinationClick(suggestion)}
                        style={{ cursor: "pointer" }}
                      >
                        {suggestion.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p>
                  Estimated Fare:{" "}
                  {fare !== null ? `Rs.${fare.toFixed(2)}` : "Calculating..."}
                </p>
                <button type="submit">Book</button>
              </div>
            </form>
          </div>
          <div>
            <h1>All Bookings</h1>
            {bookings && bookings.length > 0 ? (
              <ul>
                {bookings.map((booking) => (
                  <li key={booking.id} onClick={() => handleClick(booking.id)}>
                    <p>Booking ID: {booking.id}</p>
                    <p>User ID: {booking.user_id}</p>
                    <p>Driver ID: {booking.driver_id}</p>
                    <p>Status: {booking.status}</p>
                    <p>Source: {booking.source.coordinates.join(", ")}</p>
                    <p>
                      Destination: {booking.destination.coordinates.join(", ")}
                    </p>
                    <p>Fare: ${booking.fare.toFixed(2)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No bookings found.</p>
            )}
          </div>
        </>
      }
    />
  );
}
