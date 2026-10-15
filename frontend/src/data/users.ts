import type { AppUser } from "@/types/user";

// Mock users for the placeholder "Sign in" button. All values are fake.
// Change the one App.tsx picks (for example demoUsers.admin) to test other roles.
// Remove this file once real auth (Supabase + MyDigitalID) is connected.
export const demoUsers: Record<AppUser["role"], AppUser> = {
    resident: {
        name: "Demo Resident",
        email: "resident@example.com",
        role: "resident",
        myDigitalId: "MDID-0000001",
        ic: "900101-07-0001",
        gender: "female",
    },
    business_premise: {
        name: "Demo Business Owner",
        email: "business@example.com",
        role: "business_premise",
        myDigitalId: "MDID-0000002",
        ic: "850505-07-0002",
        gender: "male",
    },
    admin: {
        name: "Demo Admin",
        email: "admin@example.com",
        role: "admin",
        myDigitalId: "MDID-0000003",
        ic: "880808-07-0003",
        gender: "female",
    },
    super_admin: {
        name: "Demo Super Admin",
        email: "superadmin@example.com",
        role: "super_admin",
        myDigitalId: "MDID-0000004",
        ic: "800303-07-0004",
        gender: "male",
    },
};
