import { recordAudit } from "@/lib/admin/audit";
import { updateUserRole } from "@/lib/admin/users";
import { addPremise, isAccountApplication, readApplications, saveDecision } from "@/lib/business/business";
import { createNotification } from "@/lib/notifications";
import type { BusinessApplication } from "@/types/business";

/**
 * MOCK APPLICATION REVIEW (frontend only, no backend). Admin decisions on business
 * applications. Approval upgrades the applicant's role (via the admin user directory) and
 * registers the applied-for shop as their premise. Replace with Supabase later.
 */
export class ReviewError extends Error {}

/** A stale review must not upgrade an account twice or send duplicate decision notices. */
function pendingApplication(id: string): BusinessApplication {
    const application = readApplications().find((item) => item.id === id);
    if (!application) throw new ReviewError("This application is no longer available. Refresh the review list.");
    if (application.status !== "pending") throw new ReviewError("This application has already been reviewed.");
    return application;
}

export function approveApplication(application: BusinessApplication, actor: string): BusinessApplication {
    application = pendingApplication(application.id);
    // A premise request comes from an existing business account, so only the shop is added.
    const isNewAccount = isAccountApplication(application);
    if (isNewAccount && !application.email) {
        throw new ReviewError("This applicant has no email on their account, so their role can't be upgraded.");
    }
    if (isNewAccount && application.email) updateUserRole(application.email, "business_premise", actor);
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
        detail: `Approved ${isNewAccount ? "" : "new premise "}${application.id} (“${application.businessName}”) for ${application.email ?? application.applicant}.`,
    });
    if (updated) createNotification({
        recipient: updated.email ?? updated.applicant,
        type: "application_approved",
        title: "Business account application approved",
        body: `Your application for ${updated.businessName} was approved. Sign in again to access your Business Dashboard.`,
        destination: "application",
        referenceId: updated.id,
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
    application = pendingApplication(application.id);
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
    if (updated) createNotification({
        recipient: updated.email ?? updated.applicant,
        type: "application_rejected",
        title: "Business account application rejected",
        body: `Your application for ${updated.businessName} was rejected. ${clean}`,
        destination: "application",
        referenceId: updated.id,
    });
    return updated ?? application;
}
