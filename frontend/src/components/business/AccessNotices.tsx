import { ExternalLink } from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import accessNotices from "@/data/access-notices.json";
import { distanceInKm, formatDistance, HIGHLIGHT_RADIUS_KM, isWithinRadius, VISIBLE_RADIUS_KM } from "@/lib/geo";
import type { Coordinates } from "@/lib/maps";
import { cn } from "@/lib/utils";
import type { AccessNotice } from "@/types/notice";

/** Board of access changes affecting businesses in the area. */
export default function AccessNotices({
    notices = accessNotices as AccessNotice[],
    origin,
}: {
    notices?: AccessNotice[];
    /** The viewer's shop; only notices near it are listed, closest ones highlighted. */
    origin?: Coordinates;
}) {
    const shown = origin
        ? notices.filter((notice) => isWithinRadius(origin, notice, VISIBLE_RADIUS_KM))
        : notices;

    return (
        <section className="space-y-4" aria-label="Access notices">
            <h2 className="text-2xl font-semibold">Access notices</h2>
            {shown.map((notice) => {
                const highlighted = origin ? isWithinRadius(origin, notice, HIGHLIGHT_RADIUS_KM) : false;
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
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <MapsLink location={notice} className="text-xs">
                                Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                            </MapsLink>
                            {origin && (
                                <span className="text-xs text-muted-foreground">
                                    {formatDistance(distanceInKm(origin, notice))} from your shop
                                </span>
                            )}
                        </div>
                    </article>
                );
            })}
            {origin && (
                <div className="space-y-1.5 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">Legend</p>
                    <p className="flex items-center gap-2">
                        <span className="h-3 w-1 shrink-0 rounded-full bg-hazard" aria-hidden />
                        Within {HIGHLIGHT_RADIUS_KM} km of your shop — highlighted
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="h-3 w-1 shrink-0 rounded-full bg-border" aria-hidden />
                        Notices beyond {VISIBLE_RADIUS_KM} km are hidden
                    </p>
                </div>
            )}
        </section>
    );
}
