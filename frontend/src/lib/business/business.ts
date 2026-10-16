import type { BusinessProfile } from "@/types/user";

/**
 * MOCK BUSINESS APPLICATIONS (frontend only, no backend).
 * A resident can apply to upgrade to a business premise account; the application
 * is kept in localStorage while "pending". Replace with Supabase later.
 */
export interface BusinessApplication {
    /** Identifies the applicant (email, falling back to IC or name). */
    applicant: string;
    email?: string;
    businessName: string;
    registrationNumber: string;
    /** Human-readable address resolved from the pinned map location. */
    premiseAddress: string;
    /** Shop coordinates picked on the map. */
    latitude: number;
    longitude: number;
    status: "pending" | "approved" | "rejected";
    submittedAt: string;
}

const APPLICATIONS_KEY = "mutiaraconnect.business-applications";
const normalizeKey = (key: string) => key.trim().toLowerCase();

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

export function submitApplication(
    input: Omit<BusinessApplication, "status" | "submittedAt">,
): BusinessApplication {
    const application: BusinessApplication = {
        ...input,
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
