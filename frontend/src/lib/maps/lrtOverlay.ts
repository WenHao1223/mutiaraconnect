import { LRT_LINES, readStationsByLine } from "@/lib/lrt/stations";
import type { Coordinates } from "@/lib/maps/maps";
import type { LrtLineSegment, StationConstructionStatus } from "@/types/lrt";

/** One LRT line to draw on the map: its colour and the stations it joins, in order. */
export interface LrtLinePath {
    id: LrtLineSegment;
    name: string;
    color: string;
    points: Coordinates[];
}

/** Build status of a station, with the same colours and wording as the Stations & Alignment diagram. */
export const STATION_STATUS: Record<StationConstructionStatus, { label: string; color: string }> = {
    completed: { label: "Structure Completed", color: "#16a34a" },
    ongoing: { label: "Active Construction", color: "#f59e0b" },
    upcoming: { label: "Upcoming / Preparatory", color: "#0284c7" },
};

/**
 * The LRT alignment drawn station to station, in station-code order. The data has no surveyed
 * track shape, so each line is straight between stops: close enough for an elevated line at map scale.
 * readStationsByLine() already starts the Cross-Channel line at its Macallum junction.
 */
export function lrtLinePaths(): LrtLinePath[] {
    return LRT_LINES.map((line) => ({
        id: line.id,
        name: line.name,
        color: line.color,
        points: readStationsByLine(line.id),
    }));
}
