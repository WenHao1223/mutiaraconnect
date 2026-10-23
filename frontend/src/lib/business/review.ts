import { recordAudit } from "@/lib/admin/audit";
import { updateUserRole } from "@/lib/admin/users";
import { addPremise, saveDecision } from "@/lib/business/business";
import type { BusinessApplication } from "@/types/business";

/**
 * MOCK APPLICATION REVIEW (frontend only, no backend). Admin decisions on business
 * applications. Approval upgrades the applicant's role (via the admin user directory) and
 * registers the applied-for shop as their premise. Replace with Supabase later.
 */
export class ReviewError extends Error {}

export function approveApplication(application: BusinessApplication, actor: string): BusinessApplication {
    if (!application.email) {
        throw new ReviewError("This applicant has no email on their account, so their role can't be upgraded.");
    }
    updateUserRole(application.email, "business_premise", actor);
    addPremise(application.applicant, {
        name: application.businessName,
        registrationNumber: application.registrationNumber,
        address: application.premiseAddress,
        latitude: application.latitude,
        longitude: application.longitude,
    });
    const updated = saveDecision(application.id, { status: "approved", reviewedBy: actor });
    recordAudit({
        actor,
        action: "business_application",
        detail: `Approved ${application.id} (“${application.businessName}”) for ${application.email}.`,
    });
    return updated ?? application;
}

export function rejectApplication(
    application: BusinessApplication,
    reason: string,
    actor: string,
): BusinessApplication {
    const clean = reason.trim();
    if (clean.length < 5) throw new ReviewError("Tell the applicant why, in a sentence or two.");
    const updated = saveDecision(application.id, {
        status: "rejected",
        rejectionReason: clean,
        reviewedBy: actor,
    });
    recordAudit({
        actor,
        action: "business_application",
        detail: `Rejected ${application.id} (“${application.businessName}”): ${clean}`,
    });
    return updated ?? application;
}
