import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    BellRing,
    Calendar,
    CalendarClock,
    CheckCircle2,
    Clock,
    HardHat,
    MapPin,
    Megaphone,
    Pin,
    Search,
    TrainFront,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readAnnouncements, subscribeAnnouncements } from "@/lib/admin/announcements";
import {
    readSchedule,
    scheduleStatusLabels as statusLabels,
    scheduleStatusTone as statusTone,
} from "@/lib/admin/schedule";
import { readLrtStations } from "@/lib/lrt/stations";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { ConstructionSchedule, ScheduleStatus } from "@/types/schedule";

function computeTimelineProgress(item: ConstructionSchedule): number {
    if (item.status === "completed") return 100;
    if (item.status === "upcoming") return 0;
    const start = new Date(item.startsAt).getTime();
    const end = new Date(item.endsAt).getTime();
    const now = Date.now();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 50;
    if (now <= start) return 10;
    if (now >= end) return 95;
    return Math.min(95, Math.max(10, Math.round(((now - start) / (end - start)) * 100)));
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function ConstructionUpdatesPage() {
    const [scheduleItems, setScheduleItems] = useState<ConstructionSchedule[]>(() => readSchedule());
    const [announcements, setAnnouncements] = useState(() => readAnnouncements());
    const stations = useMemo(() => readLrtStations(), []);

    const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "all">("all");
    const [areaFilter, setAreaFilter] = useState<string>("all");
    const [query, setQuery] = useState<string>("");

    useEffect(() => {
        return subscribeAnnouncements(() => {
            setAnnouncements(readAnnouncements());
            setScheduleItems(readSchedule());
        });
    }, []);

    const allAreas = useMemo(() => {
        const fromSchedule = scheduleItems.map((item) => item.area).filter(Boolean);
        const fromStations = stations.map((station) => station.area).filter(Boolean);
        return Array.from(new Set([...fromSchedule, ...fromStations])).sort();
    }, [scheduleItems, stations]);

    const filteredSchedule = useMemo(() => {
        return scheduleItems.filter((item) => {
            if (statusFilter !== "all" && item.status !== statusFilter) return false;
            if (areaFilter !== "all" && item.area.toLowerCase() !== areaFilter.toLowerCase()) return false;
            if (query.trim()) {
                const q = query.trim().toLowerCase();
                return (
                    item.title.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q) ||
                    item.area.toLowerCase().includes(q) ||
                    item.id.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [scheduleItems, statusFilter, areaFilter, query]);

    const constructionAnnouncements = useMemo(() => {
        return announcements.filter((item) => {
            if (areaFilter !== "all" && item.area?.toLowerCase() !== areaFilter.toLowerCase()) {
                return false;
            }
            return item.type === "construction" || item.pinned;
        });
    }, [announcements, areaFilter]);

    const ongoingCount = scheduleItems.filter((item) => item.status === "ongoing").length;
    const upcomingCount = scheduleItems.filter((item) => item.status === "upcoming").length;
    const completedCount = scheduleItems.filter((item) => item.status === "completed").length;

    return (
        <div className="flex-1 bg-background">
            {/* Header Banner */}
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Live Work Packages &amp; Site Advisories
                    </p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-primary">
                                Construction Updates &amp; Schedule
                            </h1>
                            <p className="mt-1 max-w-3xl text-muted-foreground">
                                Track ongoing civil engineering work packages, upcoming station milestones,
                                and site-specific construction advisories published by the project team.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link to={PATHS.constructionInfo}>
                                    <TrainFront className="size-4" />
                                    Route Map &amp; Stations
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link to={PATHS.announcements}>
                                    <BellRing className="size-4" />
                                    All Announcements
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Summary Metrics */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-sm">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-hazard/15 text-hazard-text">
                                <HardHat className="size-5" />
                            </span>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{ongoingCount}</p>
                                <p className="text-xs text-muted-foreground">Ongoing Work Packages</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-sm">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info-text">
                                <CalendarClock className="size-5" />
                            </span>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
                                <p className="text-xs text-muted-foreground">Upcoming Scheduled Works</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3.5 rounded-xl border bg-card p-4 shadow-sm">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success-text">
                                <CheckCircle2 className="size-5" />
                            </span>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                                <p className="text-xs text-muted-foreground">Completed Packages</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Body */}
            <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
                {/* Filter Bar */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {(
                            [
                                { value: "all", label: `All (${scheduleItems.length})` },
                                { value: "ongoing", label: `Ongoing (${ongoingCount})` },
                                { value: "upcoming", label: `Upcoming (${upcomingCount})` },
                                { value: "completed", label: `Completed (${completedCount})` },
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setStatusFilter(tab.value)}
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

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-full sm:w-48">
                            <Select value={areaFilter} onValueChange={setAreaFilter}>
                                <SelectTrigger aria-label="Filter by corridor area">
                                    <SelectValue placeholder="All corridor areas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All corridor areas</SelectItem>
                                    {allAreas.map((area) => (
                                        <SelectItem key={area} value={area}>
                                            {area}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search work package..."
                                className="pl-9"
                                aria-label="Search construction schedule"
                            />
                        </div>
                    </div>
                </div>

                {/* Two-Column Layout: Work Packages Timeline + Construction Advisories */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
                    {/* Left Column: Construction Schedule List */}
                    <section aria-labelledby="work-packages-heading" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 id="work-packages-heading" className="text-lg font-semibold text-primary">
                                Construction Work Packages ({filteredSchedule.length})
                            </h2>
                            {(statusFilter !== "all" || areaFilter !== "all" || query) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter("all");
                                        setAreaFilter("all");
                                        setQuery("");
                                    }}
                                    className="text-xs font-medium text-primary hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        {filteredSchedule.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center">
                                    <p className="text-sm font-medium">
                                        No construction work packages match your selection.
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Try selecting another station area or clearing your search query.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredSchedule.map((item) => {
                                    const pct = computeTimelineProgress(item);
                                    const matchingStation = stations.find(
                                        (st) => st.area.toLowerCase() === item.area.toLowerCase(),
                                    );

                                    return (
                                        <Card key={item.id} className="overflow-hidden shadow-sm">
                                            <CardHeader className="pb-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                                                            {item.id}
                                                        </span>
                                                        {item.area && (
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                                                <MapPin className="size-3" />
                                                                {item.area}
                                                                {matchingStation ? ` (${matchingStation.code})` : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className={statusTone[item.status]}>
                                                        {statusLabels[item.status]}
                                                    </Badge>
                                                </div>

                                                <CardTitle className="mt-2 text-base font-semibold text-foreground">
                                                    {item.title}
                                                </CardTitle>
                                                {item.description && (
                                                    <CardDescription className="text-sm text-muted-foreground">
                                                        {item.description}
                                                    </CardDescription>
                                                )}
                                            </CardHeader>

                                            <CardContent className="space-y-3 border-t bg-muted/20 pt-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Calendar className="size-3.5 text-primary" />
                                                        <span className="font-medium text-foreground">
                                                            {formatDate(item.startsAt)}
                                                        </span>
                                                        <span>→</span>
                                                        <span className="font-medium text-foreground">
                                                            {formatDate(item.endsAt)}
                                                        </span>
                                                    </span>

                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="size-3" />
                                                        Timeline progress:{" "}
                                                        <strong className="text-foreground">{pct}%</strong>
                                                    </span>
                                                </div>

                                                <Progress value={pct} className="h-1.5" />

                                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                                                    <span>
                                                        Last updated by {item.updatedBy} on{" "}
                                                        {formatDate(item.updatedAt)}
                                                    </span>
                                                    <Link
                                                        to={
                                                            item.area
                                                                ? `${PATHS.constructionInfo}?area=${encodeURIComponent(item.area)}`
                                                                : PATHS.constructionInfo
                                                        }
                                                        className="font-medium text-primary hover:underline"
                                                    >
                                                        View station alignment →
                                                    </Link>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Right Column: Construction Notices & Station Progress Snapshot */}
                    <aside className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base text-primary">
                                        <Megaphone className="size-4" />
                                        Construction Advisories
                                    </CardTitle>
                                    <Link
                                        to={PATHS.announcements}
                                        className="text-xs font-medium text-primary hover:underline"
                                    >
                                        View all →
                                    </Link>
                                </div>
                                <CardDescription>
                                    Recent construction and pinned notifications shared by Admin.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="divide-y p-0">
                                {constructionAnnouncements.length === 0 ? (
                                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                                        No construction advisories for this area.
                                    </p>
                                ) : (
                                    constructionAnnouncements.slice(0, 5).map((item) => (
                                        <div key={item.id} className="space-y-1.5 px-4 py-3.5">
                                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                {item.pinned && (
                                                    <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                                                        <Pin className="size-3" />
                                                        Pinned
                                                    </span>
                                                )}
                                                {item.area && (
                                                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
                                                        {item.area}
                                                    </span>
                                                )}
                                                <span className="ml-auto text-muted-foreground">
                                                    {item.time}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {item.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{item.body}</p>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Corridor Progress by Zone */}
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-primary">
                                    Station Progress by Corridor Zone
                                </CardTitle>
                                <CardDescription>
                                    Average civil works completion across the 5 alignment zones.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3.5">
                                {(
                                    [
                                        "George Town Core",
                                        "Gelugor & Jelutong",
                                        "Bayan Lepas & Airport",
                                        "Seberang Perai Cross-Channel",
                                        "South Island & Reclamation",
                                    ] as const
                                ).map((zone) => {
                                    const zoneStations = stations.filter((s) => s.zone === zone);
                                    const avg =
                                        zoneStations.length > 0
                                            ? Math.round(
                                                  zoneStations.reduce((acc, s) => acc + s.progress, 0) /
                                                      zoneStations.length,
                                              )
                                            : 0;
                                    return (
                                        <div key={zone} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-foreground">{zone}</span>
                                                <span className="text-muted-foreground">
                                                    {zoneStations.length} stn ·{" "}
                                                    <strong className="text-primary">{avg}%</strong>
                                                </span>
                                            </div>
                                            <Progress value={avg} className="h-1.5" />
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </div>
    );
}
