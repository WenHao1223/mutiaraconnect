/** Everything the audit log can record. */
export type AuditAction =
    | "sign_in"
    | "sign_out"
    | "role_change"
    | "user_status"
    | "ticket_status"
    | "closure_create"
    | "closure_status"
    | "schedule_create"
    | "schedule_update"
    | "announcement"
    | "business_notice"
    | "business_application"
    | "business_support";

/** One audit entry: who did what and when. */
export interface AuditLogEntry {
    id: string;
    /** ISO 8601 timestamp. */
    at: string;
    /** Name or email of the account that performed the action. */
    actor: string;
    action: AuditAction;
    /** Human-readable description of what changed. */
    detail: string;
}
