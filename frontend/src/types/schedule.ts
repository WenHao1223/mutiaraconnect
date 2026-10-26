/** Progress of a construction work package. */
export type ScheduleStatus = "upcoming" | "ongoing" | "completed";

/** One work package on the public construction schedule. */
export interface ConstructionSchedule {
    id: string;
    title: string;
    description: string;
    area: string;
    /** ISO 8601 timestamp the work starts. */
    startsAt: string;
    /** ISO 8601 timestamp the work is expected to finish. */
    endsAt: string;
    status: ScheduleStatus;
    /** Related station IDs; older schedules may omit this list. */
    stationIds?: string[];
    /** Related road closure or access notice IDs. */
    closureIds?: string[];
    /** Related announcement IDs. */
    announcementIds?: string[];
    updatedBy: string;
    updatedAt: string;
}
