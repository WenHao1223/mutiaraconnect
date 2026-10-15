import type { AppUser } from "@/types/user";

/** An account the mock login can check. `password` is a FAKE plain-text value, demo data only. */
export type MockAccount = AppUser & { password: string };

/** Password for every demo account below. */
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "";

// Mock accounts the login pages check against. All values are fake.
// Email login: any email below + DEMO_PASSWORD. MyDigitalID login: any IC below.
// Remove this file once real auth (Supabase + MyDigitalID) is connected.
export const demoUsers: Record<AppUser["role"], MockAccount> = {
    resident: {
        name: "Demo Resident",
        email: "resident@example.com",
        role: "resident",
        myDigitalId: "MDID-0000001",
        ic: "900101-07-0001",
        gender: "female",
        password: DEMO_PASSWORD,
    },
    business_premise: {
        name: "Demo Business Owner",
        email: "business@example.com",
        role: "business_premise",
        myDigitalId: "MDID-0000002",
        ic: "850505-07-0002",
        gender: "male",
        password: DEMO_PASSWORD,
    },
    admin: {
        name: "Demo Admin",
        email: "admin@example.com",
        role: "admin",
        myDigitalId: "MDID-0000003",
        ic: "880808-07-0003",
        gender: "female",
        password: DEMO_PASSWORD,
    },
    super_admin: {
        name: "Demo Super Admin",
        email: "superadmin@example.com",
        role: "super_admin",
        myDigitalId: "MDID-0000004",
        ic: "800303-07-0004",
        gender: "male",
        password: DEMO_PASSWORD,
    },
};
