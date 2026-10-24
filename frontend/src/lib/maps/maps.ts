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

/** Opens Google Maps navigation to the pin (or a place name). */
export const googleMapsDirectionsUrl = (location: Coordinates | string) =>
    `${DIRECTIONS_BASE}&destination=${toQuery(location)}`;

/**
 * Opens a driving route in Google Maps from `origin` to `destination`, forced through `via`
 * (e.g. points beside closed roads so Google takes the same way round). Google allows up to 9 stops.
 */
export function googleMapsRouteUrl(origin: Coordinates, destination: Coordinates, via: Coordinates[] = []): string {
    const waypoints = via.slice(0, 9);
    return (
        `${DIRECTIONS_BASE}&origin=${toQuery(origin)}&destination=${toQuery(destination)}` +
        `${waypoints.length ? `&waypoints=${waypoints.map(toQuery).join("%7C")}` : ""}&travelmode=driving`
    );
}

/**
 * Shows a stretch of road in Google Maps as a route from its first point to its last. Walking mode
 * keeps the line on the road itself; driving mode would loop around one-way streets.
 */
export const googleMapsStretchUrl = (path: Coordinates[]) =>
    `${DIRECTIONS_BASE}&origin=${toQuery(path[0])}&destination=${toQuery(path[path.length - 1])}&travelmode=walking`;
