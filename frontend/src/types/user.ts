export type Gender = "male" | "female";

/** Details of a verified business premise account (shop name, SSM number and pinned location). */
export interface BusinessProfile {
    /** Stable id so owners can add/remove premises. */
    id: string;
    name: string;
    registrationNumber: string;
    address: string;
    latitude: number;
    longitude: number;
}

export interface AppUser {
    name: string;
    email?: string;
    /** Not logged in = no AppUser at all (null). Guests can browse and submit anonymously. */
    role: "resident" | "business_premise" | "admin" | "super_admin";
    /** Super admins can deactivate accounts. Undefined counts as active. */
    active?: boolean;
    /** Only set for users who signed in with MyDigitalID. */
    myDigitalId?: string;
    /** Malaysian IC (MyKad) number */
    ic?: string;
    gender?: Gender;
    /** Only set for business premise accounts. Owners can register several premises. */
    businesses?: BusinessProfile[];
}

// @TODO: Replace with real data from Supabase
/** A mock account the login can check. `passwordHash` is a bcrypt hash (demo data only). */
export type MockAccount = AppUser & { passwordHash: string };
