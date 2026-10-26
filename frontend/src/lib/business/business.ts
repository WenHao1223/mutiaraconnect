import { activeClosures } from "@/lib/admin/closures";
import { readSchedule } from "@/lib/admin/schedule";
import { newId } from "@/lib/admin/store";
import { createNotification } from "@/lib/notifications";
import type { ApplicationStatus, BusinessApplication, BusinessType } from "@/types/business";
import type { ClosureKind, RoadClosure } from "@/types/road-closure";
import type { ConstructionSchedule } from "@/types/schedule";
import type { BusinessProfile } from "@/types/user";
import { tone } from "@/lib/tones";

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
    pending: { label: "Pending review", badge: tone.warning },
    approved: { label: "Approved", badge: tone.success },
    rejected: { label: "Rejected", badge: tone.danger },
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
        id: newId("BA"),
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
    createNotification({
        recipient: application.email ?? application.applicant,
        type: "application_submitted",
        title: "Business account application received",
        body: `Your application for ${application.businessName} is pending review.`,
        destination: "application",
        referenceId: application.id,
    });
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
    const premise: BusinessProfile = { ...input, id: newId("BP") };
    const store = readPremiseStore();
    const key = normalizeKey(owner);
    store[key] = [...(store[key] ?? []), premise];
    try {
        localStorage.setItem(PREMISES_KEY, JSON.stringify(store));
    } catch {
        /* storage unavailable: the premise just won't survive a refresh */
    }
    createNotification({
        recipient: owner,
        type: "premise_added",
        title: "Business premise registered",
        body: `${premise.name} has been added to your account.`,
        destination: "business",
        referenceId: premise.id,
        premiseId: premise.id,
    });
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

/**
 * Closures and access notices businesses should still see: not ended (activeClosures) and not
 * past their "until" date. Access notices are never marked ended, so the date is what retires them.
 */
export function currentNotices(): RoadClosure[] {
    const now = Date.now();
    return activeClosures().filter((closure) => new Date(closure.endAt).getTime() >= now);
}

/**
 * Construction works near a premise that aren't finished yet. Schedule items have an area name
 * but no pin, so they match when the premise's address mentions that area (e.g. "Jelutong").
 */
export function worksNear(premise: BusinessProfile): ConstructionSchedule[] {
    const now = Date.now();
    const address = premise.address.toLowerCase();
    return readSchedule().filter(
        (item) =>
            item.status !== "completed" &&
            new Date(item.endsAt).getTime() >= now &&
            address.includes(item.area.toLowerCase()),
    );
}

/** Colours per notice type, matching the announcement bell's closure / construction / general tags. */
export const noticeTypeStyles: Record<ClosureKind | "construction", { label: string; tag: string; edge: string }> = {
    closure: { label: "Road closure", tag: tone.danger, edge: "border-l-destructive" },
    construction: { label: "Construction", tag: tone.warning, edge: "border-l-hazard" },
    access: { label: "Access info", tag: tone.info, edge: "border-l-info" },
};
