import { useId, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { Arrow as PopoverArrow, Close as PopoverClose } from "@radix-ui/react-popover";
import { ArrowRight, Navigation, X } from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { scheduleStatusLabels, scheduleStatusTone } from "@/lib/admin/schedule";
import { useConstructionData } from "@/hooks/use-construction-data";
import { stationRelations } from "@/lib/constructionRelations";
import { timeStatus } from "@/lib/road/closureDisplay";
import { PATHS } from "@/routes";
import type { LrtStation } from "@/types/lrt";

interface StationDetailsDialogProps {
    station: LrtStation;
    children: ReactElement;
    side?: "top" | "bottom";
}

/** A small, non-modal summary anchored to its station node or mobile list row. */
export default function StationDetailsDialog({
    station,
    children,
    side = "bottom",
}: StationDetailsDialogProps) {
    const titleId = useId();
    const descriptionId = useId();
    const data = useConstructionData();
    const related = stationRelations(station, data.schedules, data.closures, data.announcements);
    const restrictions = related.closures.filter((item) => item.kind === "closure" && timeStatus(item).state !== "ended");

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent
                side={side}
                sideOffset={12}
                collisionPadding={16}
                sticky="always"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="w-80 max-w-[calc(100vw-2rem)] rounded-xl p-0 shadow-lg"
            >
                <div className="max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-4">
                    <PopoverClose
                        aria-label="Close station details"
                        className="absolute right-2 top-2 cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <X className="size-4" aria-hidden />
                    </PopoverClose>

                    <div className="space-y-1.5 pr-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Badge className="text-[10px]">{station.code}</Badge>
                            <Badge variant="outline" className={scheduleStatusTone[station.status]}>
                                {scheduleStatusLabels[station.status]}
                            </Badge>
                        </div>
                        <h3 id={titleId} className="text-base font-semibold leading-snug text-primary">
                            {station.name}
                        </h3>
                        <p id={descriptionId} className="text-xs text-muted-foreground">
                            {station.area} · {station.structureType}
                        </p>
                    </div>

                    <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                            <span className="text-muted-foreground">Construction progress</span>
                            <span className="font-semibold tabular-nums text-primary">{station.progress}%</span>
                        </div>
                        <Progress
                            value={station.progress}
                            aria-label="Station civil and structural construction progress"
                            className="h-1.5"
                        />
                    </div>
                    <dl className="mt-3 space-y-3 text-xs">
                        <div>
                            <dt className="text-muted-foreground">Current work</dt>
                            <dd className="mt-1 leading-relaxed">{station.currentPhase}</dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                            <dt className="text-muted-foreground">Target completion</dt>
                            <dd className="font-medium">{station.targetCompletion}</dd>
                        </div>
                    </dl>

                    {restrictions.length > 0 && <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs">
                        <p className="font-semibold">{restrictions.length} related road {restrictions.length === 1 ? "restriction" : "restrictions"}</p>
                        <p className="mt-1 text-muted-foreground">{restrictions[0].title}{restrictions.length > 1 ? ` and ${restrictions.length - 1} more` : ""}</p>
                        <Link to={`${PATHS.constructionInfo}?station=${encodeURIComponent(station.code)}`} className="mt-2 inline-block font-medium text-primary hover:underline">View related works &amp; access →</Link>
                    </div>}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
                        <MapsLink location={station} mode="search" className="py-1.5 text-xs">
                            <Navigation className="size-3" aria-hidden />
                            Google Maps
                        </MapsLink>
                        <Link
                            to={`${PATHS.constructionInfo}?station=${station.code}`}
                            className="inline-flex items-center gap-1 rounded-sm py-1.5 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Full details <ArrowRight className="size-3" aria-hidden />
                        </Link>
                    </div>
                </div>
                <PopoverArrow width={14} height={7} className="fill-popover" />
            </PopoverContent>
        </Popover>
    );
}
