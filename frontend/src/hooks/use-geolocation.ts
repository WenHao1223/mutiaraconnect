import { useCallback, useState } from "react";
import type { Coordinates } from "@/lib/maps/maps";

export type LocationStatus = "idle" | "locating" | "ready" | "denied" | "unavailable";

interface UseGeolocationResult {
    /** The last known position, once the browser has reported one. */
    location?: Coordinates;
    status: LocationStatus;
    /** Human-friendly reason shown when the position cannot be read. */
    error?: string;
    requestLocation: () => void;
}

const ERROR_MESSAGES: Record<number, string> = {
    1: "Location permission was denied. Enable it in your browser settings to see distances.",
    2: "Your location is unavailable right now. Try again in a moment.",
    3: "Finding your location timed out. Try again.",
};

/** Reads the visitor's position on demand; nothing is requested until `requestLocation` is called. */
export function useGeolocation(): UseGeolocationResult {
    const [location, setLocation] = useState<Coordinates>();
    const [status, setStatus] = useState<LocationStatus>("idle");
    const [error, setError] = useState<string>();

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus("unavailable");
            setError("This browser does not support location sharing.");
            return;
        }

        setStatus("locating");
        setError(undefined);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setStatus("ready");
            },
            (positionError) => {
                setStatus(positionError.code === 1 ? "denied" : "unavailable");
                setError(ERROR_MESSAGES[positionError.code] ?? positionError.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
    }, []);

    return { location, status, error, requestLocation };
}
