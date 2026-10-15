export type Gender = "male" | "female";

export interface AppUser {
    name: string;
    email?: string;
    /** Not logged in = no AppUser at all (null). Guests can browse and submit anonymously. */
    role: "resident" | "business_premise" | "admin" | "super_admin";
    /** Only set for users who signed in with MyDigitalID. */
    myDigitalId?: string;
    /** Malaysian IC (MyKad) number */
    ic?: string;
    gender?: Gender;
}
