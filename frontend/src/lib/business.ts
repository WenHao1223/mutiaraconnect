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
    premiseAddress: string;
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
