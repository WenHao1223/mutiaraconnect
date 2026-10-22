import { ExternalLink, Navigation, X } from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import { Badge } from "@/components/ui/badge";
import { KIND_STYLE } from "@/lib/maps/mapConfig";
import { formatDate } from "@/lib/tickets/tickets";
import type { RoadClosure } from "@/types/road-closure";

interface ClosureInfoCardProps {
    closure: RoadClosure;
    onClose: () => void;
}

/** Details of the selected pin, floated over the map. */
export default function ClosureInfoCard({ closure, onClose }: ClosureInfoCardProps) {
    const style = KIND_STYLE[closure.kind];

    return (
        <article className="w-full max-w-sm rounded-lg border bg-card p-4 shadow-lg" aria-label={closure.title}>
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                    <Badge variant="outline" className="gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: style.background }} aria-hidden />
                        {style.label}
                    </Badge>
                    <h3 className="text-base font-semibold leading-tight">{closure.title}</h3>
                    <p className="text-xs text-muted-foreground">
                        {[closure.road, closure.area].filter(Boolean).join(" · ")}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                    aria-label="Close details"
                >
                    <X className="size-4" />
                </button>
            </div>

            {closure.reason && (
                <p className="mt-3 text-sm">
                    <span className="font-semibold">Reason:</span> {closure.reason}
                </p>
            )}
            {closure.alternative && (
                <p className="mt-1 text-sm">
                    <span className="font-semibold">Alternative:</span> {closure.alternative}
                </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(closure.startAt)} – {formatDate(closure.endAt)} ·{" "}
                <span className="capitalize">{closure.status}</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <MapsLink location={closure}>
                    Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                </MapsLink>
                <MapsLink location={closure} mode="directions">
                    Directions <Navigation className="size-3" aria-hidden />
                </MapsLink>
            </div>
        </article>
    );
}