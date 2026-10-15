/** Order here is the order of the progress bar. */
export type TicketStatus = "received" | "under_review" | "in_progress" | "resolved";

export type TicketCategory =
    | "noise"
    | "dust"
    | "traffic"
    | "pedestrian_access"
    | "business_access"
    | "safety"
    | "other";

/** One entry in a ticket's history. The last entry always matches `ticket.status`. */
export interface TicketUpdate {
    status: TicketStatus;
    /** What the responsible team told the reporter. */
    message: string;
    /** Team or person who made the update, e.g. "System" or "Community Liaison". */
    by: string;
    /** ISO 8601 timestamp. */
    at: string;
}

export interface Ticket {
    /** Public tracking ID, e.g. "FB-2041". */
    id: string;
    category: TicketCategory;
    /** Station or area the report is about. */
    location: string;
    description: string;
    status: TicketStatus;
    /** ISO 8601 timestamp. */
    submittedAt: string;
    /** ISO 8601 timestamp of the latest update. */
    updatedAt: string;
    /** Who raised it. Guests who submit anonymously have no email. */
    submittedByEmail?: string;
    /** Business premise the report is about (business users only). */
    premise?: string;
    hasPhoto?: boolean;
    /** Oldest first. */
    updates: TicketUpdate[];
}
