/** Private account events; public advisories remain Announcement records. */
export type NotificationType =
    | "application_submitted" | "application_approved" | "application_rejected"
    | "premise_access" | "premise_added"
    | "support_submitted" | "support_arranged" | "support_declined"
    | "ticket_submitted" | "ticket_updated" | "ticket_resolved"
    | "password_changed";

export interface AccountNotification {
    id: string;
    /** Same normalized account identity used by the existing business/ticket modules. */
    recipient: string;
    type: NotificationType;
    title: string;
    body: string;
    createdAt: string;
    destination: "tickets" | "application" | "business" | "settings";
    referenceId?: string;
    premiseId?: string;
    /** Illustrative scenario whose application/support record is not seeded. */
    example?: boolean;
}
