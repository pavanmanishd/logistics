"use client";
import ProtectedRoute from "@/validation/ProtectedRoute";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";

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

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!source || !destination) {
            alert("Please enter both source and destination.");
            return;
        }

        // Further usage of the selected suggestions
        console.log("Selected Source:", selectedSource);
        console.log("Selected Destination:", selectedDestination);
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
                        <p>Estimated Fare: $10</p>
                        <button type="submit">Book</button>
                    </div>
                </form>
            </div>
        } />
    );
}
