import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Activity,
    ArrowUpRight,
    BellRing,
    Building2,
    CalendarClock,
    CheckCircle2,
    Compass,
    HardHat,
    Layers,
    MapPin,
    Navigation,
    Search,
    TrainFront,
} from "lucide-react";
import LrtRouteMapSvg from "@/components/construction/LrtRouteMapSvg";
import MapsLink from "@/components/custom/MapsLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { readAnnouncements, subscribeAnnouncements } from "@/lib/admin/announcements";
import { readClosures } from "@/lib/admin/closures";
import { readSchedule } from "@/lib/admin/schedule";
import { LRT_LINES, readLrtStations } from "@/lib/lrt/stations";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { LrtLineSegment, LrtStation, StationConstructionStatus } from "@/types/lrt";
import { tone } from "@/lib/tones";

const statusBadgeTone: Record<StationConstructionStatus, string> = {
    completed: tone.success,
    ongoing: tone.warning,
    upcoming: tone.info,
};

const statusText: Record<StationConstructionStatus, string> = {
    completed: "Completed",
    ongoing: "Ongoing Works",
    upcoming: "Upcoming",
};

export default function ConstructionInfoPage() {
    const [searchParams] = useSearchParams();
    const stations = useMemo(() => readLrtStations(), []);
    const schedules = useMemo(() => readSchedule(), []);
    const [announcements, setAnnouncements] = useState(() => readAnnouncements());
    const closures = useMemo(() => readClosures(), []);

    const initialStationId = useMemo(() => {
        const stationParam = searchParams.get("station")?.trim().toLowerCase();
        const areaParam = searchParams.get("area")?.trim().toLowerCase();
        if (stationParam) {
            const byCodeOrId = stations.find(
                (s) => s.id.toLowerCase() === stationParam || s.code.toLowerCase() === stationParam,
            );
            if (byCodeOrId) return byCodeOrId.id;
        }
        if (areaParam) {
            const byArea = stations.find(
                (s) =>
                    s.area.toLowerCase().includes(areaParam) ||
                    areaParam.includes(s.area.toLowerCase()) ||
                    s.name.toLowerCase().includes(areaParam),
            );
            if (byArea) return byArea.id;
        }
        return stations[18]?.id ?? stations[0]?.id ?? "";
    }, [searchParams, stations]);

    const [selectedId, setSelectedId] = useState<string>(initialStationId);
    const [lineFilter, setLineFilter] = useState<LrtLineSegment | "all">("all");
    const [statusFilter, setStatusFilter] = useState<StationConstructionStatus | "all">("all");
    const [query, setQuery] = useState<string>("");

    useEffect(() => {
        return subscribeAnnouncements(() => {
            setAnnouncements(readAnnouncements());
        });
    }, []);

    const detailPanelRef = useRef<HTMLDivElement>(null);

    const selectedStation: LrtStation =
        stations.find((item) => item.id === selectedId) ?? stations[0];

    const filteredStations = useMemo(() => {
        return stations.filter((station) => {
            if (lineFilter === "cross_channel") {
                if (station.line !== "cross_channel" && station.code !== "S17") return false;
            } else if (lineFilter !== "all" && station.line !== lineFilter) {
                return false;
            }

            if (statusFilter !== "all" && station.status !== statusFilter) {
                return false;
            }

            if (query.trim()) {
                const q = query.trim().toLowerCase();
                return (
                    station.name.toLowerCase().includes(q) ||
                    station.code.toLowerCase().includes(q) ||
                    station.area.toLowerCase().includes(q) ||
                    station.zone.toLowerCase().includes(q) ||
                    station.landmark.toLowerCase().includes(q)
                );
            }

            return true;
        });
    }, [stations, lineFilter, statusFilter, query]);

    const stationSchedules = useMemo(() => {
        if (!selectedStation) return [];
        const area = selectedStation.area.toLowerCase();
        const name = selectedStation.name.toLowerCase();
        return schedules.filter(
            (item) =>
                item.area.toLowerCase().includes(area) ||
                area.includes(item.area.toLowerCase()) ||
                item.title.toLowerCase().includes(name),
        );
    }, [schedules, selectedStation]);

    const stationAnnouncements = useMemo(() => {
        if (!selectedStation) return [];
        const area = selectedStation.area.toLowerCase();
        const name = selectedStation.name.toLowerCase();
        return announcements.filter(
            (item) =>
                (item.area && item.area.toLowerCase().includes(area)) ||
                item.title.toLowerCase().includes(area) ||
                item.title.toLowerCase().includes(name) ||
                item.body.toLowerCase().includes(area),
        );
    }, [announcements, selectedStation]);

    const stationClosures = useMemo(() => {
        if (!selectedStation) return [];
        const area = selectedStation.area.toLowerCase();
        return closures.filter(
            (item) =>
                item.status !== "ended" &&
                (item.area.toLowerCase().includes(area) || area.includes(item.area.toLowerCase())),
        );
    }, [closures, selectedStation]);

    const overallProgress = Math.round(
        stations.reduce((sum, station) => sum + station.progress, 0) / stations.length,
    );
    const ongoingStationsCount = stations.filter((station) => station.status === "ongoing").length;
    const interchangeCount = stations.filter(
        (station) => station.structureType === "Elevated Interchange",
    ).length;

    function handleSelectStation(station: LrtStation) {
        setSelectedId(station.id);
        if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
            detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    return (
        <div className="flex-1 bg-background">
            {/* Hero Header */}
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Penang LRT Mutiara Line Corridor
                    </p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-primary">
                                Construction Information &amp; Route Alignment
                            </h1>
                            <p className="mt-1 max-w-3xl text-muted-foreground">
                                Explore all 20 stations across the 29.5 km Penang LRT Mutiara Line,
                                inspect the interactive SVG transit schematic, and check station-level
                                civil works and commuter facilities.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link to={PATHS.constructionUpdates}>
                                    <CalendarClock className="size-4" />
                                    View Construction Schedule
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link to={PATHS.announcements}>
                                    <BellRing className="size-4" />
                                    Public Announcements
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Top KPI Strip */}
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                <span>Total Route Length</span>
                                <Compass className="size-4 text-primary" />
                            </div>
                            <p className="mt-1.5 text-2xl font-bold text-foreground">29.5 km</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                25.0 km Island Mainline + 4.5 km Marine Bridge
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                <span>Stations &amp; Interchanges</span>
                                <TrainFront className="size-4 text-primary" />
                            </div>
                            <p className="mt-1.5 text-2xl font-bold text-foreground">
                                {stations.length} Stations
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Includes {interchangeCount} major multimodal interchange hubs
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                <span>Active Station Sites</span>
                                <HardHat className="size-4 text-hazard-text" />
                            </div>
                            <p className="mt-1.5 text-2xl font-bold text-foreground">
                                {ongoingStationsCount} Active Sites
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Civil piling, viaduct &amp; concourse works underway
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                <span>Average Corridor Progress</span>
                                <Activity className="size-4 text-success-text" />
                            </div>
                            <div className="mt-1.5 flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-foreground">{overallProgress}%</p>
                                <span className="text-xs text-muted-foreground">Target 2029–2030</span>
                            </div>
                            <Progress value={overallProgress} className="mt-2 h-1.5" />
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
                {/* LRT Lines Overview Cards */}
                <section aria-labelledby="lines-heading" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 id="lines-heading" className="text-xl font-semibold text-primary">
                                LRT Lines &amp; Corridor Segments
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Click a corridor segment to highlight its alignment on the SVG map and station list.
                            </p>
                        </div>
                        {lineFilter !== "all" && (
                            <Button variant="ghost" size="sm" onClick={() => setLineFilter("all")}>
                                Show all segments
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {LRT_LINES.map((line) => {
                            const isSelected = lineFilter === line.id;
                            return (
                                <button
                                    key={line.id}
                                    type="button"
                                    onClick={() =>
                                        setLineFilter((current) => (current === line.id ? "all" : line.id))
                                    }
                                    className={cn(
                                        "flex flex-col justify-between rounded-xl border bg-card p-5 text-left shadow-sm transition hover:border-primary/60",
                                        isSelected && "border-primary ring-2 ring-primary/20",
                                    )}
                                >
                                    <div>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span
                                                className="inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                                                style={{ backgroundColor: line.color }}
                                            >
                                                <Layers className="size-3.5" />
                                                {line.badge}
                                            </span>
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {line.lengthKm} km · {line.stationCount} stations · {line.AlignmentType}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 text-base font-semibold text-foreground">
                                            {line.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{line.summary}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs font-medium text-primary">
                                        <span>
                                            {isSelected
                                                ? "Filtering map & stations by this line (click to reset)"
                                                : "Click to isolate this corridor segment"}
                                        </span>
                                        <ArrowUpRight className="size-4" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Interactive SVG Route Map + Selected Station Inspector */}
                <section aria-labelledby="route-map-heading" className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
                    <div className="space-y-3">
                        <LrtRouteMapSvg
                            stations={stations}
                            selectedStationId={selectedStation.id}
                            onSelectStation={handleSelectStation}
                            activeLineFilter={lineFilter}
                        />
                        <p className="text-xs text-muted-foreground">
                            Tip: Click any station node (<span className="font-medium">S01</span> to{" "}
                            <span className="font-medium">S20</span>) on the SVG diagram to inspect its construction
                            phase, facilities, and active area alerts.
                        </p>
                    </div>

                    {/* Station Detail Inspector Card */}
                    <div ref={detailPanelRef} className="scroll-mt-20 lg:sticky lg:top-20">
                        <Card className="border-primary/20 shadow-sm">
                            <CardHeader className="border-b bg-muted/30 pb-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-bold text-primary-foreground">
                                            {selectedStation.code}
                                        </span>
                                        <Badge variant="outline" className={statusBadgeTone[selectedStation.status]}>
                                            {statusText[selectedStation.status]}
                                        </Badge>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {selectedStation.zone}
                                    </span>
                                </div>
                                <CardTitle className="mt-2 text-xl text-primary">
                                    {selectedStation.name} Station
                                </CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                        <Building2 className="size-3.5 text-primary" />
                                        {selectedStation.structureType}
                                    </span>
                                    <span>·</span>
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="size-3.5" />
                                        {selectedStation.landmark}
                                    </span>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-5 pt-5">
                                <p className="text-sm text-foreground">{selectedStation.description}</p>

                                {/* Progress Bar & Current Work Phase */}
                                <div className="rounded-lg border bg-muted/40 p-3.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span>Station Civil &amp; Structural Progress</span>
                                        <span className="text-primary">{selectedStation.progress}%</span>
                                    </div>
                                    <Progress value={selectedStation.progress} className="mt-2 h-2" />
                                    <div className="mt-2.5 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                                        <p>
                                            <span className="font-medium text-foreground">Current Phase: </span>
                                            {selectedStation.currentPhase}
                                        </p>
                                        <p className="sm:text-right">
                                            <span className="font-medium text-foreground">Est. Completion: </span>
                                            {selectedStation.targetCompletion}
                                        </p>
                                    </div>
                                </div>

                                {/* Commuter Facilities */}
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Planned Station Facilities
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {selectedStation.facilities.map((facility) => (
                                            <Badge key={facility} variant="secondary" className="text-xs">
                                                <CheckCircle2 className="mr-1 size-3 text-primary" />
                                                {facility}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Related Work Packages & Area Advisories */}
                                <div className="space-y-2 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Active Corridor Works ({selectedStation.area})
                                        </p>
                                        <Link
                                            to={PATHS.constructionUpdates}
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            All updates →
                                        </Link>
                                    </div>

                                    {stationSchedules.length === 0 && stationClosures.length === 0 ? (
                                        <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                                            No major road closures or special work packages logged for{" "}
                                            {selectedStation.area} right now.
                                        </p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {stationSchedules.slice(0, 2).map((item) => (
                                                <li
                                                    key={item.id}
                                                    className="rounded-md border bg-background p-2.5 text-xs"
                                                >
                                                    <div className="flex items-center justify-between gap-2 font-medium">
                                                        <span>{item.title}</span>
                                                        <span className="capitalize text-muted-foreground">
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-muted-foreground">{item.description}</p>
                                                </li>
                                            ))}
                                            {stationClosures.slice(0, 2).map((closure) => (
                                                <li
                                                    key={closure.id}
                                                    className="rounded-md border border-destructive/25 bg-destructive/5 p-2.5 text-xs"
                                                >
                                                    <div className="flex items-center justify-between gap-2 font-medium text-destructive">
                                                        <span>{closure.title}</span>
                                                        <span className="uppercase">{closure.status}</span>
                                                    </div>
                                                    {closure.alternative && (
                                                        <p className="mt-0.5 text-muted-foreground">
                                                            Alt route: {closure.alternative}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {stationAnnouncements.length > 0 && (
                                        <div className="pt-1">
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Latest notice:{" "}
                                                <Link
                                                    to={PATHS.announcements}
                                                    className="font-semibold text-foreground hover:text-primary hover:underline"
                                                >
                                                    {stationAnnouncements[0].title}
                                                </Link>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Map link & Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
                                    <MapsLink
                                        location={{
                                            latitude: selectedStation.latitude,
                                            longitude: selectedStation.longitude,
                                        }}
                                        mode="search"
                                    >
                                        <Navigation className="size-3.5" />
                                        Open {selectedStation.name} in Google Maps
                                    </MapsLink>

                                    <Link
                                        to={PATHS.ticket}
                                        className="font-medium text-muted-foreground hover:text-primary hover:underline"
                                    >
                                        Report an issue near {selectedStation.code} →
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Complete Directory of LRT Stations */}
                <section aria-labelledby="station-directory-heading" className="space-y-4 pt-2">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h2 id="station-directory-heading" className="text-xl font-semibold text-primary">
                                Directory of LRT Stations ({filteredStations.length} of {stations.length})
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Search by station code, name, township area, or nearby landmark.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search station or area..."
                                    className="pl-9"
                                    aria-label="Search LRT stations"
                                />
                            </div>

                            <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
                                {(
                                    [
                                        { value: "all", label: "All" },
                                        { value: "ongoing", label: "Ongoing" },
                                        { value: "upcoming", label: "Upcoming" },
                                        { value: "completed", label: "Completed" },
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => setStatusFilter(tab.value)}
                                        className={cn(
                                            "rounded-md px-2.5 py-1 text-xs font-medium transition",
                                            statusFilter === tab.value
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {filteredStations.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center">
                                <p className="text-sm font-medium">No stations match your filter criteria.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={() => {
                                        setQuery("");
                                        setLineFilter("all");
                                        setStatusFilter("all");
                                    }}
                                >
                                    Reset filters
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredStations.map((station) => {
                                const isSelected = station.id === selectedStation.id;
                                return (
                                    <button
                                        key={station.id}
                                        type="button"
                                        onClick={() => handleSelectStation(station)}
                                        className={cn(
                                            "flex flex-col justify-between rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/60",
                                            isSelected && "border-primary ring-2 ring-primary/20",
                                        )}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                                                        {station.code}
                                                    </span>
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {station.area}
                                                    </span>
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[11px]", statusBadgeTone[station.status])}
                                                >
                                                    {statusText[station.status]}
                                                </Badge>
                                            </div>

                                            <h3 className="mt-2.5 text-base font-semibold text-foreground">
                                                {station.name}
                                            </h3>
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                {station.currentPhase}
                                            </p>
                                        </div>

                                        <div className="mt-4 space-y-2 border-t pt-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    {station.structureType}
                                                </span>
                                                <span className="font-semibold text-primary">
                                                    {station.progress}%
                                                </span>
                                            </div>
                                            <Progress value={station.progress} className="h-1.5" />
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {station.facilities.slice(0, 3).map((facility) => (
                                                    <span
                                                        key={facility}
                                                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                                                    >
                                                        {facility}
                                                    </span>
                                                ))}
                                                {station.facilities.length > 3 && (
                                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        +{station.facilities.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
