import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

/** Role landing pages. Residents use My Tickets because they have no dedicated dashboard. */
export function dashboardPathFor(role: AppUser["role"]): string {
    switch (role) {
        case "business_premise":
            return PATHS.businessDashboard;
        case "admin":
        case "super_admin":
            return PATHS.admin;
        default:
            return PATHS.profileTickets;
    }
}

/** Label for the current role's dashboard, shown in the profile menu. */
export const dashboardLabels: Record<Exclude<AppUser["role"], "resident">, string> = {
    business_premise: "Business Dashboard",
    admin: "Admin Dashboard",
    super_admin: "Admin Dashboard",
};
