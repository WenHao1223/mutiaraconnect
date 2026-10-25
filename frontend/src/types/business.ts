/** What kind of trade a premise runs. Shown on access notices and used to filter them. */
export type BusinessType = "food_beverage" | "retail" | "services" | "health" | "lodging" | "other";

export type ApplicationStatus = "pending" | "approved" | "rejected";

/**
 * A request an admin approves: a resident upgrading to a business account ("account"), or a
 * business account registering another shop ("premise").
 */
export interface BusinessApplication {
    /** Public reference, e.g. "BA-lq2x9k". */
    id: string;
    /** Missing on older applications, which were all "account". */
    kind?: "account" | "premise";
    /** Identifies the applicant (email, falling back to IC or name). */
    applicant: string;
    /** Needed to upgrade the account's role on approval. */
    email?: string;
    /** Applicant's name, shown in the admin review queue. */
    applicantName: string;
    businessName: string;
    registrationNumber: string;
    businessType: BusinessType;
    /** Phone number the site team can reach the premise on. */
    contactPhone: string;
    /** Names of the supporting documents (mock upload: the files themselves are not kept). */
    documents: string[];
    /** Human-readable address resolved from the pinned map location. */
    premiseAddress: string;
    /** Shop coordinates picked on the map. */
    latitude: number;
    longitude: number;
    status: ApplicationStatus;
    /** ISO 8601 timestamp. */
    submittedAt: string;
    /** Why the application was turned down. Only set when rejected. */
    rejectionReason?: string;
    /** Admin who approved or rejected it. */
    reviewedBy?: string;
    /** ISO 8601 timestamp of the decision. */
    reviewedAt?: string;
}

/** Help a business can ask the support desk for. */
export type SupportRequestType = "signage" | "delivery" | "parking";

export type SupportRequestStatus = "pending" | "arranged" | "declined";

/** A business owner's request to the support desk, answered by an admin. */
export interface SupportRequest {
    /** Public reference, e.g. "SR-1001". */
    id: string;
    /** Key the owner's premises are stored under (email, falling back to IC or name). */
    owner: string;
    ownerName: string;
    premiseId: string;
    premiseName: string;
    type: SupportRequestType;
    /** What the owner needs, e.g. "A sign at the back lane entrance". */
    note: string;
    status: SupportRequestStatus;
    /** ISO 8601 timestamp. */
    submittedAt: string;
    /** The admin's answer, shown to the owner. */
    reply?: string;
    repliedBy?: string;
    /** ISO 8601 timestamp. */
    repliedAt?: string;
}
