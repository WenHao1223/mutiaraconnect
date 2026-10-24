/**
 * Solid badge colours by meaning, shared by every badge in the app so the same meaning always
 * looks the same: green done/approved, gold ongoing/pending, blue info/upcoming, red closures and
 * refusals, slate for neutral (nothing has happened yet). Each pairs a theme fill with its readable text colour (see index.css). Ticket statuses
 * use the same fills through statusMeta.
 */
export const tone = {
    success: "border-transparent bg-success text-success-foreground",
    warning: "border-transparent bg-hazard text-hazard-foreground",
    info: "border-transparent bg-info text-info-foreground",
    danger: "border-transparent bg-destructive text-destructive-foreground",
    neutral: "border-transparent bg-neutral text-neutral-foreground",
} as const;
