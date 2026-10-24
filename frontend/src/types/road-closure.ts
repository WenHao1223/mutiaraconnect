/** Lifecycle of a temporary road closure set by an admin. */
export type ClosureStatus = "planned" | "active" | "ended";

/** "closure" is a temporary road closure; "access" is info shared with nearby businesses. */
export type ClosureKind = "closure" | "access";

/** Whether the whole road is shut or only some lanes. */
export type ClosureExtent = "full" | "partial";

/** Daily hours the closure applies, as "HH:mm" (24h). `to` earlier than `from` means overnight, e.g. 23:00–05:00. */
export interface ClosureHours {
    from: string;
    to: string;
}

export interface RoadPoint {
    latitude: number;
    longitude: number;
}

/**
 * A temporary road closure or a piece of access information pinned to a location.
 * Businesses within range of the pin are "affected"; that is worked out by distance,
 * not stored on the record.
 */
export interface RoadClosure {
    id: string;
    kind: ClosureKind;
    /** Short headline, e.g. "Jalan Macallum lane closure". */
    title: string;
    road: string;
    area: string;
    reason: string;
    /** How to get in for an access notice, e.g. "Enter via back lane". Empty for road closures. */
    alternative: string;
    /** How people on foot get past, e.g. "Covered walkway on the north side". Closures only. */
    pedestrian?: string;
    /** Closures only; missing means fully closed. */
    extent?: ClosureExtent;
    /** Missing means closed all day, every day, between startAt and endAt. */
    hours?: ClosureHours;
    /**
     * Points along the closed stretch: drawn as a line on the map and avoided when routing to a shop.
     * latitude/longitude sits on it.
     */
    path?: RoadPoint[];
    latitude: number;
    longitude: number;
    /** ISO 8601 timestamp the restriction starts. */
    startAt: string;
    /** ISO 8601 timestamp the restriction is expected to end. */
    endAt: string;
    status: ClosureStatus;
    createdBy: string;
    createdAt: string;
}
