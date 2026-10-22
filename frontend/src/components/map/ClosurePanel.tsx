import { useEffect, useMemo, useRef } from "react";
import {
    ChevronRight,
    ExternalLink,
    Loader2,
    LocateFixed,
    Navigation,
    RefreshCw,
} from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LocationStatus } from "@/hooks/use-geolocation";
import { distanceInKm, formatDistance } from "@/lib/maps/geo";
import { KIND_STYLE } from "@/lib/maps/mapConfig";
import type { Coordinates } from "@/lib/maps/maps";
import { formatDate } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { RoadClosure } from "@/types/road-closure";

interface ClosurePanelProps {
    closures: RoadClosure[];
    selectedId?: string;
    onSelect: (id: string | undefined) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The visitor's position, when they have shared it. */
    location?: Coordinates;
    locationStatus: LocationStatus;
    locationError?: string;
    onRequestLocation: () => void;
}

/**
 * Collapsible side panel listing every closure / access notice on the map.
 * When the visitor shares their location the list is sorted by distance from them.
 */
export default function ClosurePanel({
    closures,
    selectedId,
    onSelect,
    open,
    onOpenChange,
    location,
    locationStatus,
    locationError,
    onRequestLocation,
}: ClosurePanelProps) {
    const selectedRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        selectedRef.current?.scrollIntoView({ block: "nearest" });
    }, [selectedId]);

    const items = useMemo(() => {
        if (!location) return closures.map((closure) => ({ closure, distance: undefined }));

        return closures
            .map((closure) => ({ closure, distance: distanceInKm(location, closure) }))
            .sort((a, b) => a.distance - b.distance);
    }, [closures, location]);

    const locating = locationStatus === "locating";

    return (
        <Collapsible open={open} onOpenChange={onOpenChange} asChild>
            <aside
                aria-label="Road closures and access notices"
                className={cn(
                    "pointer-events-auto absolute inset-x-3 bottom-3 z-10 flex max-h-[70%] flex-col overflow-hidden rounded-lg border bg-card/95 shadow-lg backdrop-blur",
                    "md:inset-x-auto md:right-3 md:top-3 md:bottom-3 md:max-h-none md:w-[21rem]",
                    !open && "max-h-none md:bottom-auto",
                )}
            >
                <div className="flex items-start justify-between gap-2 border-b p-3">
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold leading-tight">Closures &amp; access notices</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {closures.length} {closures.length === 1 ? "notice" : "notices"} shown
                        </p>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="-mr-1 -mt-1 shrink-0"
                            aria-label={open ? "Collapse panel" : "Expand panel"}
                        >
                            <ChevronRight
                                className={cn("transition-transform", open ? "rotate-0" : "rotate-180")}
                                aria-hidden
                            />
                        </Button>
                    </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="flex min-h-0 flex-1 flex-col">
                    <div className="border-b p-3 text-xs">
                        {location ? (
                            <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <LocateFixed className="size-3.5 text-primary" aria-hidden />
                                    Sorted by distance from you
                                </span>
                                <button
                                    type="button"
                                    onClick={onRequestLocation}
                                    disabled={locating}
                                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-50"
                                    aria-label="Refresh my location"
                                >
                                    <RefreshCw className={cn("size-3.5", locating && "animate-spin")} aria-hidden />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={onRequestLocation}
                                    disabled={locating}
                                >
                                    {locating ? (
                                        <Loader2 className="animate-spin" aria-hidden />
                                    ) : (
                                        <LocateFixed aria-hidden />
                                    )}
                                    {locating ? "Finding your location…" : "Use my location"}
                                </Button>
                                {locationError ? (
                                    <p className="text-destructive">{locationError}</p>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Share your location to see how far each notice is from you.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <ScrollArea className="min-h-0 flex-1">
                        {items.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">
                                No closures or access notices match the current filters.
                            </p>
                        ) : (
                            <ul className="divide-y">
                                {items.map(({ closure, distance }) => {
                                    const style = KIND_STYLE[closure.kind];
                                    const selected = closure.id === selectedId;

                                    return (
                                        <li key={closure.id} ref={selected ? selectedRef : undefined}>
                                            <button
                                                type="button"
                                                onClick={() => onSelect(selected ? undefined : closure.id)}
                                                aria-expanded={selected}
                                                className={cn(
                                                    "flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                                                    selected && "bg-muted/70",
                                                )}
                                            >
                                                <span className="flex items-start justify-between gap-2">
                                                    <span className="flex min-w-0 items-start gap-2">
                                                        <span
                                                            className="mt-1.5 size-2 shrink-0 rounded-full"
                                                            style={{ background: style.background }}
                                                            aria-hidden
                                                        />
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-medium">
                                                                {closure.title}
                                                            </span>
                                                            <span className="block truncate text-xs text-muted-foreground">
                                                                {[closure.road, closure.area]
                                                                    .filter(Boolean)
                                                                    .join(" · ")}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    {distance !== undefined && (
                                                        <span className="shrink-0 rounded bg-background/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                                                            {formatDistance(distance)}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-4 text-[11px] text-muted-foreground">
                                                    <span className="rounded border px-1.5 text-[10px] font-medium">
                                                        {style.label}
                                                    </span>
                                                    <span className="capitalize">{closure.status}</span>
                                                    <span aria-hidden>·</span>
                                                    <span>Until {formatDate(closure.endAt)}</span>
                                                </span>
                                            </button>

                                            {selected && (
                                                <div className="space-y-1.5 border-t bg-muted/30 px-3 py-2.5 text-sm">
                                                    {closure.reason && (
                                                        <p>
                                                            <span className="font-semibold">Reason:</span>{" "}
                                                            {closure.reason}
                                                        </p>
                                                    )}
                                                    {closure.alternative && (
                                                        <p>
                                                            <span className="font-semibold">Alternative:</span>{" "}
                                                            {closure.alternative}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(closure.startAt)} – {formatDate(closure.endAt)}
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5 text-xs">
                                                        <MapsLink location={closure}>
                                                            Open in Google Maps{" "}
                                                            <ExternalLink className="size-3" aria-hidden />
                                                        </MapsLink>
                                                        <MapsLink location={closure} mode="directions">
                                                            Directions{" "}
                                                            <Navigation className="size-3" aria-hidden />
                                                        </MapsLink>
                                                    </div>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </ScrollArea>
                </CollapsibleContent>
            </aside>
        </Collapsible>
    );
}
