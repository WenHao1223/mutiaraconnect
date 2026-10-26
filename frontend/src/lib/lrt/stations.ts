import linesData from "@/data/lrt-lines.json";
import stationsData from "@/data/lrt-stations.json";
import { distanceInKm } from "@/lib/maps/geo";
import type { Coordinates } from "@/lib/maps/maps";
import type { LrtLineInfo, LrtLineSegment, LrtStation } from "@/types/lrt";

const stations = stationsData as LrtStation[];

export const LRT_LINES = linesData as LrtLineInfo[];

/** Returns all LRT stations ordered by station code (S01 -> S20). */
export function readLrtStations(): LrtStation[] {
    return [...stations].sort((a, b) => a.code.localeCompare(b.code));
}

/** Returns stations filtered by line segment. */
export function readStationsByLine(line?: LrtLineSegment | "all"): LrtStation[] {
    const all = readLrtStations();
    if (!line || line === "all") return all;
    if (line === "cross_channel") {
        // Include Macallum (S18) as the interchange origin plus Penang Sentral (S20)
        return all.filter((station) => station.line === "cross_channel" || station.code === "S18");
    }
    return all.filter((station) => station.line === line);
}

/** Unique corridor area names for dropdowns in Admin and filter bars. */
export function getStationAreas(): string[] {
    return Array.from(new Set(stations.map((station) => station.area)));
}

/** The station closest to a pin, and how far away it is. */
export function nearestStation(point: Coordinates): { station: LrtStation; km: number } {
    return stations
        .map((station) => ({ station, km: distanceInKm(point, station) }))
        .reduce((closest, next) => (next.km < closest.km ? next : closest));
}

/** The station closest to a ticket's pin; undefined when the ticket was never pinned. */
export function stationNear(point: Partial<Coordinates>): LrtStation | undefined {
    if (typeof point.latitude !== "number" || typeof point.longitude !== "number") return undefined;
    return nearestStation({ latitude: point.latitude, longitude: point.longitude }).station;
}
