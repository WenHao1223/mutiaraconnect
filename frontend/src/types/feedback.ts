export type FeedbackCategory = "compliment" | "complaint" | "suggestion";

/** A general comment about the project, separate from a tracked ticket. */
export interface Feedback {
    /** Internal reference, e.g. "FBK-1001". */
    id: string;
    category: FeedbackCategory;
    message: string;
    /** Reporter's email when signed in; omitted for anonymous feedback. */
    submittedByEmail?: string;
    /** ISO 8601 timestamp. */
    submittedAt: string;
}
