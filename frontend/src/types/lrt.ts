/** Line segment on the Penang LRT Mutiara Line network. */
export type LrtLineSegment = "island_mainline" | "cross_channel";

/** Construction status of an individual LRT station. */
export type StationConstructionStatus = "upcoming" | "ongoing" | "completed";

/** Key commuter facility offered at a station. */
export type StationFacility =
    | "Park & Ride"
    | "Bus Hub"
    | "Interchange"
    | "Barrier-Free"
    | "Airport Link"
    | "Ferry / KTMB Link"
    | "Bicycle Parking";

/** Metadata for a station along the Penang LRT Mutiara Line. */
export interface LrtStation {
    id: string;
    code: string;
    name: string;
    line: LrtLineSegment;
    zone: "South Island & Reclamation" | "Bayan Lepas & Airport" | "Gelugor & Jelutong" | "George Town Core" | "Seberang Perai Cross-Channel";
    area: string;
    structureType: "Elevated" | "Elevated Interchange";
    status: StationConstructionStatus;
    progress: number;
    currentPhase: string;
    targetCompletion: string;
    description: string;
    landmark: string;
    facilities: StationFacility[];
    latitude: number;
    longitude: number;
    /** SVG coordinates (viewBox 0 0 1000 540) for the interactive route map. */
    svgX: number;
    svgY: number;
    labelPosition?: "top" | "bottom" | "left" | "right";
}

/** High-level metadata for an LRT line/corridor segment. */
export interface LrtLineInfo {
    id: LrtLineSegment;
    name: string;
    badge: string;
    color: string;
    lengthKm: number;
    stationCount: number;
    AlignmentType: string;
    summary: string;
}
