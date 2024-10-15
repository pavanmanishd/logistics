"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import axios from "axios";
import { useEffect, useState, useCallback, use } from "react";

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

export default function Book() {
    const [source, setSource] = useState<string>("");
    const [destination, setDestination] = useState<string>("");
    const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
    const [selectedSource, setSelectedSource] = useState<any | null>(null);
    const [selectedDestination, setSelectedDestination] = useState<any | null>(null);
    const [fare, setFare] = useState<number | null>(null);

    // Handle search functionality with debounce
    const search = async (text: string, type: "source" | "destination") => {
        if (!text) return;

        try {
            const response = await axios.get(`https://api.olamaps.io/places/v1/autocomplete?input=${text}&api_key=${accessToken}`);

            if (type === "source") {
                setSourceSuggestions(response.data.predictions);
            } else if (type === "destination") {
                setDestinationSuggestions(response.data.predictions);
            }
        } catch (error) {
            console.error("Error searching places:", error);
        }
    };

    useEffect(() => {
        console.log(sourceSuggestions);
    }, [sourceSuggestions]);

    // Debounced search function
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
        setSource(suggestion.description); // Set input value to selected suggestion
        setSelectedSource(suggestion); // Store the entire selected suggestion for further use
        setSourceSuggestions([]); // Clear suggestions after selection
    };

    // Handle suggestion click for destination
    const handleDestinationClick = (suggestion: any) => {
        setDestination(suggestion.description); // Set input value to selected suggestion
        setSelectedDestination(suggestion); // Store the entire selected suggestion for further use
        setDestinationSuggestions([]); // Clear suggestions after selection
    };

    // Fetch distance and calculate fare
    const fetchDistanceAndCalculateFare = async () => {
        if (!selectedSource || !selectedDestination) return;

        try {
            const sourceCoords = selectedSource.geometry.location; // Assuming geometry contains lat, lng
            const destinationCoords = selectedDestination.geometry.location;

            const response = await axios.get(
                `https://api.olamaps.io/routing/v1/distanceMatrix?origins=${sourceCoords.lat},${sourceCoords.lng}&destinations=${destinationCoords.lat},${destinationCoords.lng}&api_key=${accessToken}`
            );

            const distanceInMeters = response.data.rows[0].elements[0].distance;
            const distanceInKm = distanceInMeters / 1000;

            // Calculate fare
            const baseFare = 40;
            const costPerKm = 15;
            const estimatedFare = baseFare + costPerKm * distanceInKm;

            setFare(estimatedFare);
        } catch (error) {
            console.error("Error calculating distance and fare:", error);
        }
    };

    useEffect(() => {
        fetchDistanceAndCalculateFare();
    }, [selectedSource, selectedDestination]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!source || !destination) {
            alert("Please enter both source and destination.");
            return;
        }

    };

    return (
        <ProtectedRoute element={
            <div>
                <h1>Book</h1>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="Source">Source</label>
                        <input
                            type="text"
                            id="Source"
                            value={source}
                            onChange={handleSourceChange} // Trigger search while typing
                        />
                        {/* Source suggestions */}
                        {sourceSuggestions.length > 0 && (
                            <ul>
                                {sourceSuggestions.map((suggestion, index) => (
                                    <li 
                                        key={index}
                                        onClick={() => handleSourceClick(suggestion)} // Handle selection
                                        style={{ cursor: 'pointer' }}
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
                            onChange={handleDestinationChange} // Trigger search while typing
                        />
                        {/* Destination suggestions */}
                        {destinationSuggestions.length > 0 && (
                            <ul>
                                {destinationSuggestions.map((suggestion, index) => (
                                    <li 
                                        key={index}
                                        onClick={() => handleDestinationClick(suggestion)} // Handle selection
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {suggestion.description}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <p>Estimated Fare: {fare ? `Rs.${fare.toFixed(2)}` : "N/A"}</p>
                        <button type="submit">Book</button>
                    </div>
                </form>
            </div>
        } />
    );
}
