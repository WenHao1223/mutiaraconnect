export interface AppUser {
    name: string;
    email?: string;
    /** Not logged in = no AppUser at all (null). Guests can browse and submit anonymously. */
    role: "resident" | "business_premise" | "admin" | "super_admin";
    myDigitalId: string;
    /** Malaysian IC (MyKad) number */
    ic: string;
    gender: "male" | "female";
}
