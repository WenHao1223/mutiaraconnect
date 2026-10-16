import type { AppUser } from "@/types/user";

export const roleLabels: Record<AppUser["role"], string> = {
    resident: "Resident",
    business_premise: "Business Premise",
    admin: "Admin",
    super_admin: "Super Admin",
};

/** "Demo Resident" -> "DR". */
export function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}
