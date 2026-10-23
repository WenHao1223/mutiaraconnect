import stationsData from "@/data/lrt-stations.json";
import type { LrtLineInfo, LrtLineSegment, LrtStation } from "@/types/lrt";

const stations = stationsData as LrtStation[];

export const LRT_LINES: LrtLineInfo[] = [
    {
        id: "island_mainline",
        name: "Mutiara Line (Island Corridor)",
        badge: "Mutiara Mainline",
        color: "#0055b8",
        lengthKm: 25.0,
        stationCount: 19,
        AlignmentType: "Elevated Viaduct",
        summary:
            "Runs north–south along the eastern corridor of Penang Island from Silicon Island through Penang International Airport, Bayan Lepas FIZ, USM/Sungai Dua, and Jelutong to Komtar in George Town.",
    },
    {
        id: "cross_channel",
        name: "Cross-Channel Alignment (Komtar / Bandar Sri Pinang – Penang Sentral)",
        badge: "Cross-Channel Link",
        color: "#f59e0b",
        lengthKm: 4.5,
        stationCount: 2,
        AlignmentType: "Elevated Marine Cable-Stayed Bridge",
        summary:
            "Branches east from Bandar Sri Pinang across the Penang Strait (with 62m navigational clearance) to Penang Sentral in Butterworth for direct interchange with KTMB ETS, Komuter Utara, and Rapid Ferry.",
    },
];

/** Returns all LRT stations ordered by station code (S01 -> S20). */
export function readLrtStations(): LrtStation[] {
    return [...stations].sort((a, b) => a.code.localeCompare(b.code));
}

/** Returns stations filtered by line segment. */
export function readStationsByLine(line?: LrtLineSegment | "all"): LrtStation[] {
    const all = readLrtStations();
    if (!line || line === "all") return all;
    if (line === "cross_channel") {
        // Include Bandar Sri Pinang (S17) as the interchange origin plus Penang Sentral (S20)
        return all.filter((station) => station.line === "cross_channel" || station.code === "S17");
    }
    return all.filter((station) => station.line === line);
}

/** Unique corridor area names for dropdowns in Admin and filter bars. */
export function getStationAreas(): string[] {
    return Array.from(new Set(stations.map((station) => station.area)));
}
