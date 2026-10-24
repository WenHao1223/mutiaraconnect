import { recordAudit } from "@/lib/admin/audit";
import { readJson, writeJson } from "@/lib/admin/store";
import type { SupportRequest, SupportRequestStatus, SupportRequestType } from "@/types/business";
import { tone } from "@/lib/tones";

/**
 * MOCK SUPPORT REQUESTS (frontend only, no backend). Business owners ask the support desk for
 * signage, delivery-window coordination or alternative parking; admins arrange or decline them.
 * Kept in localStorage. Replace with Supabase later.
 */
const SUPPORT_KEY = "mutiaraconnect.support-requests";
const normalizeKey = (key: string) => key.trim().toLowerCase();

export const supportTypeLabels: Record<SupportRequestType, string> = {
    signage: "Temporary signage",
    delivery: "Delivery window",
    parking: "Alternative parking",
};

export const supportStatusMeta: Record<SupportRequestStatus, { label: string; badge: string }> = {
    pending: { label: "Pending", badge: tone.warning },
    arranged: { label: "Arranged", badge: tone.success },
    declined: { label: "Declined", badge: tone.danger },
};

/** Newest first. */
export function readSupportRequests(): SupportRequest[] {
    return readJson<SupportRequest[]>(SUPPORT_KEY, []).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/** One owner's requests, newest first. */
export function supportRequestsFor(owner?: string): SupportRequest[] {
    if (!owner) return [];
    return readSupportRequests().filter((request) => normalizeKey(request.owner) === normalizeKey(owner));
}

export type NewSupportRequestInput = Pick<
    SupportRequest,
    "owner" | "ownerName" | "premiseId" | "premiseName" | "type" | "note"
>;

export function submitSupportRequest(input: NewSupportRequestInput): SupportRequest {
    const all = readJson<SupportRequest[]>(SUPPORT_KEY, []);
    const request: SupportRequest = {
        ...input,
        // Numbered like ticket IDs (FB-3001, …): SR-1001, SR-1002, …
        id: `SR-${1001 + all.length}`,
        status: "pending",
        submittedAt: new Date().toISOString(),
    };
    writeJson(SUPPORT_KEY, [request, ...all]);
    return request;
}

/** An admin arranges or declines a request, with a reply the owner sees. */
export function respondToSupportRequest(
    id: string,
    status: Exclude<SupportRequestStatus, "pending">,
    reply: string,
    actor: string,
): void {
    const next = readJson<SupportRequest[]>(SUPPORT_KEY, []).map((request) =>
        request.id === id
            ? { ...request, status, reply: reply.trim(), repliedBy: actor, repliedAt: new Date().toISOString() }
            : request,
    );
    writeJson(SUPPORT_KEY, next);
    recordAudit({ actor, action: "business_support", detail: `Support request ${id} ${status}.` });
}
