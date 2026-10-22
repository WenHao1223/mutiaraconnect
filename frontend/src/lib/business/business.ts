import type { ApplicationStatus, BusinessApplication, BusinessType } from "@/types/business";
import type { BusinessProfile } from "@/types/user";

/**
 * MOCK BUSINESS APPLICATIONS (frontend only, no backend).
 * A resident can apply to upgrade to a business premise account; an admin then approves
 * or rejects it. Kept in localStorage, one per applicant. Replace with Supabase later.
 */
const APPLICATIONS_KEY = "mutiaraconnect.business-applications";
const normalizeKey = (key: string) => key.trim().toLowerCase();

export const businessTypeLabels: Record<BusinessType, string> = {
    food_beverage: "Food & beverage",
    retail: "Retail",
    services: "Services",
    health: "Health & wellness",
    lodging: "Lodging",
    other: "Other",
};

export const applicationStatusMeta: Record<ApplicationStatus, { label: string; badge: string }> = {
    pending: { label: "Pending review", badge: "border-hazard/40 bg-hazard/15 text-amber-800" },
    approved: { label: "Approved", badge: "border-success/30 bg-success/10 text-green-800" },
    rejected: { label: "Rejected", badge: "border-destructive/30 bg-destructive/10 text-destructive" },
};

function readStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

export const readApplications = () => readStorage<BusinessApplication[]>(APPLICATIONS_KEY, []);

export function findApplication(applicant?: string): BusinessApplication | undefined {
    if (!applicant) return undefined;
    const target = normalizeKey(applicant);
    return readApplications().find((application) => normalizeKey(application.applicant) === target);
}

export type NewApplicationInput = Omit<
    BusinessApplication,
    "id" | "status" | "submittedAt" | "rejectionReason" | "reviewedBy" | "reviewedAt"
>;

/** Files a new application, replacing any earlier (e.g. rejected) one from the same applicant. */
export function submitApplication(input: NewApplicationInput): BusinessApplication {
    const application: BusinessApplication = {
        ...input,
        id: `BA-${Date.now().toString(36)}`,
        status: "pending",
        submittedAt: new Date().toISOString(),
    };
    const rest = readApplications().filter(
        (a) => normalizeKey(a.applicant) !== normalizeKey(application.applicant),
    );
    try {
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify([...rest, application]));
    } catch {
        /* storage unavailable: the application just won't survive a refresh */
    }
    return application;
}

/** Records an admin's decision. Use approveApplication / rejectApplication in review.ts. */
export function saveDecision(
    id: string,
    decision: Pick<BusinessApplication, "status" | "rejectionReason" | "reviewedBy">,
): BusinessApplication | undefined {
    let updated: BusinessApplication | undefined;
    const next = readApplications().map((application) => {
        if (application.id !== id) return application;
        updated = { ...application, ...decision, reviewedAt: new Date().toISOString() };
        return updated;
    });
    try {
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(next));
    } catch {
        /* storage unavailable: the decision just won't survive a refresh */
    }
    return updated;
}

const PREMISES_KEY = "mutiaraconnect.business-premises";

/** Extra premises owners added, keyed by owner (email/IC/name). */
type PremiseStore = Record<string, BusinessProfile[]>;

const readPremiseStore = () => readStorage<PremiseStore>(PREMISES_KEY, {});

/** Premises an owner added on top of the account's seeded premises. */
export function readPremises(owner?: string): BusinessProfile[] {
    if (!owner) return [];
    return readPremiseStore()[normalizeKey(owner)] ?? [];
}

export function addPremise(owner: string, input: Omit<BusinessProfile, "id">): BusinessProfile {
    const premise: BusinessProfile = { ...input, id: `BP-${Date.now().toString(36)}` };
    const store = readPremiseStore();
    const key = normalizeKey(owner);
    store[key] = [...(store[key] ?? []), premise];
    try {
        localStorage.setItem(PREMISES_KEY, JSON.stringify(store));
    } catch {
        /* storage unavailable: the premise just won't survive a refresh */
    }
    return premise;
}

const REMOVED_PREMISES_KEY = "mutiaraconnect.business-removed-premises";

const readRemovedStore = () => readStorage<Record<string, string[]>>(REMOVED_PREMISES_KEY, {});

/** Ids of premises the owner removed (seeded or added), so they stay gone after a refresh. */
export function readRemovedPremiseIds(owner?: string): string[] {
    if (!owner) return [];
    return readRemovedStore()[normalizeKey(owner)] ?? [];
}

export function removePremise(owner: string, id: string): void {
    const key = normalizeKey(owner);

    const removed = readRemovedStore();
    if (!removed[key]?.includes(id)) {
        removed[key] = [...(removed[key] ?? []), id];
        try {
            localStorage.setItem(REMOVED_PREMISES_KEY, JSON.stringify(removed));
        } catch {
            /* storage unavailable: the removal just won't survive a refresh */
        }
    }

    // Drop it from the added-premises list too, when present.
    const premises = readPremiseStore();
    if (premises[key]?.some((premise) => premise.id === id)) {
        premises[key] = premises[key].filter((premise) => premise.id !== id);
        try {
            localStorage.setItem(PREMISES_KEY, JSON.stringify(premises));
        } catch {
            /* storage unavailable: the removal just won't survive a refresh */
        }
    }
}

/**
 * An owner's current premises: the account's seeded ones plus any added in this browser
 * (including the one from an approved application), minus any the owner removed.
 */
export function premisesFor(owner: string | undefined, seeded: BusinessProfile[] = []): BusinessProfile[] {
    const removed = new Set(readRemovedPremiseIds(owner));
    return [...seeded, ...readPremises(owner)].filter((premise) => !removed.has(premise.id));
}
