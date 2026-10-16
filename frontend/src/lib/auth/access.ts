import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

/** The dashboard each role owns. Used to route users away from dashboards that aren't theirs. */
export function dashboardPathFor(role: AppUser["role"]): string {
    switch (role) {
        case "business_premise":
            return PATHS.businessDashboard;
        case "admin":
        case "super_admin":
            return PATHS.admin;
        default:
            return PATHS.profile;
    }
}

/** Label for the current role's dashboard, shown in the profile menu. */
export const dashboardLabels: Record<AppUser["role"], string> = {
    resident: "My Dashboard",
    business_premise: "Business Dashboard",
    admin: "Admin Dashboard",
    super_admin: "Admin Dashboard",
};
