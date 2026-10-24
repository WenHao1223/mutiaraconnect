import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CheckCircle2, Map as MapIcon, MessageSquareWarning, Search, TrafficCone } from "lucide-react";
import ClosureCard from "@/components/road/ClosureCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readClosures } from "@/lib/admin/closures";
import { readSchedule } from "@/lib/admin/schedule";
import { CLOSURE_STATUS_LABEL, CLOSURE_STATUSES } from "@/lib/maps/mapConfig";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { ClosureStatus } from "@/types/road-closure";

type StatusFilter = ClosureStatus | "all";

/** Active closures first, then upcoming ones, then finished ones. */
const STATUS_ORDER: Record<ClosureStatus, number> = { active: 0, planned: 1, ended: 2 };

/** Public list of temporary road closures, with detour, pedestrian and emergency access for each. */
export default function RoadAccessPage() {
    // Access notices for businesses live on the map and the Local Businesses page, not here.
    const [closures] = useState(() =>
        readClosures()
            .filter((closure) => closure.kind === "closure")
            .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    );
    const [schedule] = useState(readSchedule);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [query, setQuery] = useState("");

    const counts = useMemo(() => {
        const byStatus: Record<ClosureStatus, number> = { planned: 0, active: 0, ended: 0 };
        for (const closure of closures) byStatus[closure.status] += 1;
        return byStatus;
    }, [closures]);

    const shown = useMemo(() => {
        const search = query.trim().toLowerCase();
        return closures.filter(
            (closure) =>
                (statusFilter === "all" || closure.status === statusFilter) &&
                (!search ||
                    [closure.title, closure.road, closure.area].some((field) => field.toLowerCase().includes(search))),
        );
    }, [closures, statusFilter, query]);

    const tabs: { value: StatusFilter; label: string }[] = [
        { value: "all", label: `All (${closures.length})` },
        ...CLOSURE_STATUSES.map((status) => ({
            value: status,
            label: `${CLOSURE_STATUS_LABEL[status]} (${counts[status]})`,
        })),
    ];

    const clearFilters = () => {
        setStatusFilter("all");
        setQuery("");
    };

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Temporary Road Closures &amp; Accessibility
                    </p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-primary">Road &amp; Access</h1>
                            <p className="mt-1 max-w-3xl text-muted-foreground">
                                Plan your journey around LRT construction. Each closure shows the detour for
                                drivers, how pedestrians can get past, and what stays open for emergency vehicles.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link to={PATHS.ticket}>
                                    <MessageSquareWarning className="size-4" />
                                    Report an access issue
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link to={PATHS.home}>
                                    <MapIcon className="size-4" />
                                    Closure map
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <SummaryTile
                            icon={<TrafficCone className="size-5" />}
                            tone="bg-destructive/10 text-destructive"
                            value={counts.active}
                            label="Active closures"
                        />
                        <SummaryTile
                            icon={<CalendarClock className="size-5" />}
                            tone="bg-info/10 text-sky-700"
                            value={counts.planned}
                            label="Planned closures"
                        />
                        <SummaryTile
                            icon={<CheckCircle2 className="size-5" />}
                            tone="bg-success/15 text-green-700"
                            value={counts.ended}
                            label="Recently ended"
                        />
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
                <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setStatusFilter(tab.value)}
                                aria-pressed={statusFilter === tab.value}
                                className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                                    statusFilter === tab.value
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full lg:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search road or area..."
                            className="pl-9"
                            aria-label="Search road closures"
                        />
                    </div>
                </div>

                <section aria-labelledby="closures-heading" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 id="closures-heading" className="text-lg font-semibold text-primary">
                            Road closures ({shown.length})
                        </h2>
                        {(statusFilter !== "all" || query) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-medium text-primary hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

                    {shown.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center">
                                <p className="text-sm font-medium">No road closures match your selection.</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Try another status or clear your search.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {shown.map((closure) => (
                                <ClosureCard
                                    key={closure.id}
                                    closure={closure}
                                    relatedWorks={schedule.filter(
                                        (work) => work.area.toLowerCase() === closure.area.toLowerCase(),
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

interface SummaryTileProps {
    icon: ReactNode;
    /** Background and text colour of the icon square. */
    tone: string;
    value: number;
    label: string;
}

function SummaryTile({ icon, tone, value, label }: SummaryTileProps) {
    return (
        <div className="flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-sm">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>{icon}</span>
            <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}
