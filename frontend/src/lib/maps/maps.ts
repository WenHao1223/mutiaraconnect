/** Builds Google Maps links so the URL shapes live in one place. */
export interface Coordinates {
    latitude: number;
    longitude: number;
}

const SEARCH_BASE = "https://www.google.com/maps/search/?api=1";
const DIRECTIONS_BASE = "https://www.google.com/maps/dir/?api=1";

/** A pin becomes "lat,lng"; a plain string becomes a search term. */
const toQuery = (location: Coordinates | string) =>
    typeof location === "string"
        ? encodeURIComponent(location)
        : `${location.latitude},${location.longitude}`;

/** Opens Google Maps centred on the pin (or searching for a place name). */
export const googleMapsSearchUrl = (location: Coordinates | string) =>
    `${SEARCH_BASE}&query=${toQuery(location)}`;

/** How the visitor is travelling. Left out, Google Maps picks the mode itself. */
export type TravelMode = "driving" | "walking";

/** Opens Google Maps navigation to the pin (or a place name). */
export const googleMapsDirectionsUrl = (location: Coordinates | string, travelMode?: TravelMode) =>
    `${DIRECTIONS_BASE}&destination=${toQuery(location)}${travelMode ? `&travelmode=${travelMode}` : ""}`;
