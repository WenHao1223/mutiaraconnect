/** Lifecycle of a temporary road closure set by an admin. */
export type ClosureStatus = "planned" | "active" | "ended";

/** "closure" is a temporary road closure; "access" is info shared with nearby businesses. */
export type ClosureKind = "closure" | "access";

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
    /** Suggested way around the closure or restriction. */
    alternative: string;
    /** How people on foot get past, e.g. "Covered walkway on the north side". Closures only. */
    pedestrian?: string;
    /** What emergency vehicles can still use, e.g. "One lane kept open". Closures only. */
    emergency?: string;
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
