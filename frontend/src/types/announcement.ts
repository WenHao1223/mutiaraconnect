export interface Announcement {
    id: string;
    title: string;
    body: string;
    /** Relative label shown in the bell, e.g. "2 hours ago". */
    time: string;
    type: "closure" | "construction" | "general";
    /** Optional station / corridor area tag (e.g. "Komtar", "Bayan Lepas"). */
    area?: string;
    /** Whether the announcement is pinned as a priority advisory. */
    pinned?: boolean;
    /** ISO 8601 timestamp it was published. Absent on the bundled sample data. */
    publishedAt?: string;
    /** Name of the admin who published it. */
    createdBy?: string;
}
