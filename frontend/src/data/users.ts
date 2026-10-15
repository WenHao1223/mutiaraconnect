import type { AppUser } from "@/types/user";

/** An account the mock login can check. `passwordHash` is a bcrypt hash, demo data only. */
export type MockAccount = AppUser & { passwordHash: string };

/** bcrypt hash (cost 10) of the demo password "Demo@1234". Shared by every demo account. */
export const DEMO_PASSWORD_HASH = "$2b$10$li41XRLiaC/MkxOEXvOMb.tMP3mgktezSWXs.lKyFDQLZ7jcJTlYa";

// Mock accounts the login pages check against. All values are fake.
// Email login: any email below + the demo password. MyDigitalID login: any IC below.
// Remove this file once real auth (Supabase + MyDigitalID) is connected.
export const demoUsers: Record<AppUser["role"], MockAccount> = {
    resident: {
        name: "Demo Resident",
        email: "resident@example.com",
        role: "resident",
        myDigitalId: "MDID-0000001",
        ic: "900101-07-0001",
        gender: "female",
        passwordHash: DEMO_PASSWORD_HASH,
    },
    business_premise: {
        name: "Demo Business Owner",
        email: "business@example.com",
        role: "business_premise",
        myDigitalId: "MDID-0000002",
        ic: "850505-07-0002",
        gender: "male",
        passwordHash: DEMO_PASSWORD_HASH,
    },
    admin: {
        name: "Demo Admin",
        email: "admin@example.com",
        role: "admin",
        myDigitalId: "MDID-0000003",
        ic: "880808-07-0003",
        gender: "female",
        passwordHash: DEMO_PASSWORD_HASH,
    },
    super_admin: {
        name: "Demo Super Admin",
        email: "superadmin@example.com",
        role: "super_admin",
        myDigitalId: "MDID-0000004",
        ic: "800303-07-0004",
        gender: "male",
        passwordHash: DEMO_PASSWORD_HASH,
    },
};
