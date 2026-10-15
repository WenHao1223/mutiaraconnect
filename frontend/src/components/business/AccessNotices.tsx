import { ExternalLink } from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import accessNotices from "@/data/access-notices.json";
import { distanceInKm, formatDistance, HIGHLIGHT_RADIUS_KM, isWithinRadius, VISIBLE_RADIUS_KM } from "@/lib/geo";
import type { Coordinates } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { AccessNotice } from "@/types/notice";

/** A shop the notice distances are measured from. */
export interface PremiseOrigin extends Coordinates {
    name: string;
}

/** Board of access changes affecting businesses in the area. */
export default function AccessNotices({
    notices = accessNotices as AccessNotice[],
    origins = [],
}: {
    notices?: AccessNotice[];
    /** The owner's premises; notices near any of them are listed, closest ones highlighted. */
    origins?: PremiseOrigin[];
}) {
    const hasOrigins = origins.length > 0;

    const nearestOrigin = (notice: AccessNotice) =>
        origins.reduce((best, origin) =>
            distanceInKm(origin, notice) < distanceInKm(best, notice) ? origin : best,
        );

    const shown = hasOrigins
        ? notices.filter((notice) => origins.some((origin) => isWithinRadius(origin, notice, VISIBLE_RADIUS_KM)))
        : notices;

    return (
        <section className="space-y-4" aria-label="Access notices">
            <h2 className="text-2xl font-semibold">Access notices</h2>
            {shown.map((notice) => {
                const highlighted = hasOrigins
                    ? origins.some((origin) => isWithinRadius(origin, notice, HIGHLIGHT_RADIUS_KM))
                    : false;
                const nearest = hasOrigins ? nearestOrigin(notice) : undefined;
                return (
                    <article
                        key={notice.id}
                        className={cn(
                            "rounded-lg border border-l-4 bg-card p-5",
                            highlighted ? "border-l-hazard" : "border-l-border",
                        )}
                    >
                        <div className="flex justify-between gap-3">
                            <h3 className="text-lg font-semibold">{notice.business}</h3>
                            <span className="text-xs text-muted-foreground">{notice.area}</span>
                        </div>
                        <p className="mt-2 text-sm">
                            <span className="font-semibold">Affected:</span> {notice.affected}
                        </p>
                        <p className="mt-1 text-sm">
                            <span className="font-semibold">Alternative:</span> {notice.alternative}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">Until {notice.until}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <MapsLink location={notice} className="shrink-0 whitespace-nowrap text-xs">
                                Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                            </MapsLink>
                            {nearest && (
                                <span className="text-xs text-muted-foreground">
                                    {formatDistance(distanceInKm(nearest, notice))} from{" "}
                                    {origins.length > 1 ? nearest.name : "your nearest premise"}
                                </span>
                            )}
                        </div>
                    </article>
                );
            })}
            {hasOrigins && (
                <div className="space-y-1.5 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Legend</p>
                    <p className="flex items-center gap-2">
                        <span className="h-3 w-1 shrink-0 rounded-full bg-hazard" aria-hidden />
                        Within {HIGHLIGHT_RADIUS_KM} km of a premise — highlighted
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="h-3 w-1 shrink-0 rounded-full bg-border" aria-hidden />
                        Notices beyond {VISIBLE_RADIUS_KM} km of every premise are hidden
                    </p>
                </div>
            )}
        </section>
    );
}
