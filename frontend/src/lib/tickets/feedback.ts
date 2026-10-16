import type { Feedback, FeedbackCategory } from "@/types/feedback";

/**
 * General feedback submitted through the app (frontend only, no backend). Kept in
 * localStorage. Replace with Supabase later.
 */
const FEEDBACK_KEY = "mutiaraconnect.feedback";

export const feedbackLabels: Record<FeedbackCategory, string> = {
    compliment: "Compliment",
    complaint: "Complaint",
    suggestion: "Suggestion",
};

export function readFeedback(): Feedback[] {
    try {
        const raw = localStorage.getItem(FEEDBACK_KEY);
        return raw ? (JSON.parse(raw) as Feedback[]) : [];
    } catch {
        return [];
    }
}

function writeFeedback(list: Feedback[]) {
    try {
        localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
    } catch {
        /* storage unavailable: the feedback just won't survive a refresh */
    }
}

export interface NewFeedbackInput {
    email?: string;
    category: FeedbackCategory;
    message: string;
}

/** Stores a piece of feedback, tied to the account when signed in. */
export function submitFeedback(input: NewFeedbackInput): Feedback {
    const list = readFeedback();
    const feedback: Feedback = {
        id: `FBK-${1001 + list.length}`,
        category: input.category,
        message: input.message,
        submittedByEmail: input.email,
        submittedAt: new Date().toISOString(),
    };
    writeFeedback([...list, feedback]);
    return feedback;
}
