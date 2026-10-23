import { ExternalLink } from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import { readClosures } from "@/lib/admin/closures";
import { noticeTypeStyles } from "@/lib/business/business";
import { AFFECTED_RADIUS_KM, distanceInKm, formatDistance, isWithinRadius } from "@/lib/maps/geo";
import type { Coordinates } from "@/lib/maps/maps";
import { formatDate } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { RoadClosure } from "@/types/road-closure";

/** A shop the closure distances are measured from. */
export interface PremiseOrigin extends Coordinates {
    name: string;
}

interface AccessNoticesProps {
    closures?: RoadClosure[];
    /** The owner's premises; closures within range of any of them are listed. */
    origins?: PremiseOrigin[];
    /** Heading above the list. Defaults to "Access notices". */
    title?: string;
}

/** Board of closures and access changes affecting businesses near their premises. */
export default function AccessNotices({ closures, origins = [], title = "Access notices" }: AccessNoticesProps) {
    const list = closures ?? readClosures();
    const hasOrigins = origins.length > 0;

    const nearestOrigin = (closure: RoadClosure) =>
        origins.reduce((best, origin) =>
            distanceInKm(origin, closure) < distanceInKm(best, closure) ? origin : best,
        );

    // Without premises to measure from, show everything; otherwise only nearby ones.
    const shown = hasOrigins
        ? list.filter((closure) => origins.some((origin) => isWithinRadius(origin, closure, AFFECTED_RADIUS_KM)))
        : list;

    return (
        <section className="space-y-4" aria-label={title}>
            <h2 className="text-2xl font-semibold">{title}</h2>
            {shown.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No closures or access changes within {Math.round(AFFECTED_RADIUS_KM * 1000)} m of your
                    premises.
                </p>
            )}
            {shown.map((closure) => {
                const nearest = hasOrigins ? nearestOrigin(closure) : undefined;
                return (
                    <article
                        key={closure.id}
                        className={cn("rounded-lg border border-l-4 bg-card p-5", noticeTypeStyles[closure.kind].edge)}
                    >
                        <div className="flex justify-between gap-3">
                            <div>
                                <span
                                    className={cn(
                                        "rounded px-1.5 py-0.5 text-[11px] font-medium",
                                        noticeTypeStyles[closure.kind].tag,
                                    )}
                                >
                                    {noticeTypeStyles[closure.kind].label}
                                </span>
                                <h3 className="mt-1.5 text-lg font-semibold">{closure.title}</h3>
                            </div>
                            <span className="text-xs text-muted-foreground">{closure.area}</span>
                        </div>
                        {closure.reason && (
                            <p className="mt-2 text-sm">
                                <span className="font-semibold">Reason:</span> {closure.reason}
                            </p>
                        )}
                        {closure.alternative && (
                            <p className="mt-1 text-sm">
                                <span className="font-semibold">Alternative:</span> {closure.alternative}
                            </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">Until {formatDate(closure.endAt)}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <MapsLink location={closure} className="shrink-0 whitespace-nowrap text-xs">
                                Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                            </MapsLink>
                            {nearest && (
                                <span className="text-xs text-muted-foreground">
                                    {formatDistance(distanceInKm(nearest, closure))} from{" "}
                                    {origins.length > 1 ? nearest.name : "your nearest premise"}
                                </span>
                            )}
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
