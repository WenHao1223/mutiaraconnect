import type { Coordinates } from "@/lib/maps";

/** Only access notices within this many km of the shop are listed. */
export const VISIBLE_RADIUS_KM = 3;
/** Notices within this many km of the shop get the amber highlight. */
export const HIGHLIGHT_RADIUS_KM = 1;

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle (haversine) distance between two pins, in kilometres. */
export function distanceInKm(a: Coordinates, b: Coordinates): number {
    const dLat = toRadians(b.latitude - a.latitude);
    const dLng = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** True when `b` sits no further than `radiusKm` from `a`. */
export function isWithinRadius(a: Coordinates, b: Coordinates, radiusKm: number): boolean {
    return distanceInKm(a, b) <= radiusKm;
}

/** Human-friendly distance, e.g. "620 m" or "2.7 km". */
export function formatDistance(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
