import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, MapPin, Navigation, Search } from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scheduleStatusLabels, scheduleStatusTone } from "@/lib/admin/schedule";
import ClosureNotice from "@/components/construction/ClosureNotice";
import { useConstructionData } from "@/hooks/use-construction-data";
import { announcementUrl } from "@/lib/announcementLinks";
import { stationRelations } from "@/lib/constructionRelations";
import { readLrtStations } from "@/lib/lrt/stations";
import { PATHS } from "@/routes";
import type { LrtLineSegment, LrtStation, StationConstructionStatus } from "@/types/lrt";

const PAGE_SIZE = 4;

export default function ConstructionInfoPage() {
    const stations = useMemo(() => readLrtStations(), []);
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState<StationConstructionStatus | "all">("all");
    const [line, setLine] = useState<LrtLineSegment | "all">("all");
    const [page, setPage] = useState(0);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const wasViewingStation = useRef(false);

    // Selection lives in the URL so homepage links and browser Back/Forward work naturally.
    const stationParam = searchParams.get("station")?.trim().toLowerCase();
    const areaParam = searchParams.get("area")?.trim().toLowerCase();
    const selectedStation = stations.find((station) =>
        stationParam
            ? station.code.toLowerCase() === stationParam || station.id.toLowerCase() === stationParam
            : areaParam && (station.area.toLowerCase().includes(areaParam) ||
                areaParam.includes(station.area.toLowerCase()) || station.name.toLowerCase().includes(areaParam)),
    );

    useEffect(() => {
        if (!selectedStation && !wasViewingStation.current) return;
        wasViewingStation.current = Boolean(selectedStation);
        headingRef.current?.focus({ preventScroll: true });
        headingRef.current?.scrollIntoView({
            block: "nearest",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }, [selectedStation]);

    const filteredStations = stations.filter((station) => {
        if (status !== "all" && station.status !== status) return false;
        if (line === "island_mainline" && station.line !== line) return false;
        if (line === "cross_channel" && station.line !== line && station.code !== "S18") return false;
        const search = query.trim().toLowerCase();
        return !search || [station.code, station.name, station.area, station.zone, station.landmark]
            .some((value) => value.toLowerCase().includes(search));
    });
    const pageCount = Math.ceil(filteredStations.length / PAGE_SIZE);
    const shownStations = filteredStations.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const activeCount = stations.filter((station) => station.status === "ongoing").length;
    const averageProgress = stations.length
        ? Math.round(stations.reduce((sum, station) => sum + station.progress, 0) / stations.length)
        : 0;

    function selectStation(station?: LrtStation) {
        setSearchParams((previous) => {
            const next = new URLSearchParams(previous);
            next.delete("area");
            if (station) next.set("station", station.code);
            else next.delete("station");
            return next;
        }, { preventScrollReset: true });
    }

    function resetFilters() {
        setQuery("");
        setStatus("all");
        setLine("all");
        setPage(0);
    }

    return (
        <div className="flex-1 bg-background">
            <header className="border-b bg-muted/40">
                <div className="mx-auto max-w-4xl px-4 py-7 sm:py-9">
                    <p className="text-xs font-medium text-muted-foreground">Mutiara Line</p>
                    <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">Station construction</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Check progress, planned facilities, and works near your station.</p>
                        </div>
                        <Link to={PATHS.home} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                            View route map <ArrowUpRight className="size-4" aria-hidden />
                        </Link>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
                {selectedStation ? (
                    <section aria-labelledby="station-details-heading">
                        <Button variant="ghost" size="sm" onClick={() => selectStation()} className="mb-4 -ml-2">
                            <ArrowLeft aria-hidden /> Back to stations
                        </Button>
                        <StationDetails key={selectedStation.id} station={selectedStation} headingRef={headingRef} />
                    </section>
                ) : (
                    <section aria-labelledby="station-finder-heading" className="space-y-5">
                        <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card py-4 text-center">
                            <div className="px-2"><dd className="text-xl font-bold text-primary">{stations.length}</dd><dt className="mt-1 text-xs text-muted-foreground">Stations</dt></div>
                            <div className="px-2"><dd className="text-xl font-bold text-primary">{activeCount}</dd><dt className="mt-1 text-xs text-muted-foreground">Ongoing works</dt></div>
                            <div className="px-2"><dd className="text-xl font-bold text-primary">{averageProgress}%</dd><dt className="mt-1 text-xs text-muted-foreground">Average progress</dt></div>
                        </dl>

                        <div>
                            <h2 id="station-finder-heading" ref={headingRef} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold text-primary outline-none">Find your station</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Search or browse, then select a station for details.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_10rem]">
                            <div className="relative col-span-2 sm:col-span-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                                <Input
                                    value={query}
                                    onChange={(event) => { setQuery(event.target.value); setPage(0); }}
                                    placeholder="Station name, code, or area"
                                    aria-label="Search stations"
                                    className="pl-9"
                                />
                            </div>
                            <Select value={status} onValueChange={(value) => { setStatus(value as typeof status); setPage(0); }}>
                                <SelectTrigger aria-label="Filter by construction status"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="ongoing">Ongoing works</SelectItem>
                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={line} onValueChange={(value) => { setLine(value as typeof line); setPage(0); }}>
                                <SelectTrigger aria-label="Filter by corridor"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All corridors</SelectItem>
                                    <SelectItem value="island_mainline">Island mainline</SelectItem>
                                    <SelectItem value="cross_channel">Cross-channel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <p role="status">
                                {filteredStations.length > 0
                                    ? `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filteredStations.length)} of ${filteredStations.length} stations`
                                    : "No matching stations"}
                            </p>
                            {(query || status !== "all" || line !== "all") && (
                                <button type="button" onClick={resetFilters} className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear filters</button>
                            )}
                        </div>

                        {shownStations.length === 0 ? (
                            <div className="rounded-xl border border-dashed px-4 py-10 text-center">
                                <p className="font-medium">No stations found</p>
                                <p className="mt-1 text-sm text-muted-foreground">Try another name, station code, or area.</p>
                                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">Reset filters</Button>
                            </div>
                        ) : (
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {shownStations.map((station) => (
                                    <li key={station.id}>
                                        <button
                                            type="button"
                                            onClick={() => selectStation(station)}
                                            aria-label={`View ${station.code} ${station.name} station details`}
                                            className="group flex h-28 w-full cursor-pointer items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{station.code}</span>
                                                    <span className="truncate text-sm font-semibold" title={station.name}>{station.name}</span>
                                                </span>
                                                <span className="mt-3 flex items-center justify-between gap-2 whitespace-nowrap">
                                                    <Badge variant="outline" className={scheduleStatusTone[station.status]}>{scheduleStatusLabels[station.status]}</Badge>
                                                    <span className="text-xs text-muted-foreground">{station.progress}%</span>
                                                </span>
                                                <span className="mt-4 block h-1 overflow-hidden rounded-full bg-primary/10" aria-hidden>
                                                    <span className="block h-full rounded-full bg-primary" style={{ width: `${station.progress}%` }} />
                                                </span>
                                            </span>
                                            <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {pageCount > 1 && (
                            <nav aria-label="Station pages" className="flex items-center justify-between gap-2 border-t pt-4">
                                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft aria-hidden /> Previous</Button>
                                <span className="text-xs text-muted-foreground">Page {page + 1} of {pageCount}</span>
                                <Button variant="outline" size="sm" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Next <ChevronRight aria-hidden /></Button>
                            </nav>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}

/** Full information is loaded only after a station is chosen. */
function StationDetails({ station, headingRef }: { station: LrtStation; headingRef: RefObject<HTMLHeadingElement | null> }) {
    const data = useConstructionData();
    const related = stationRelations(station, data.schedules, data.closures, data.announcements);
    const updateCount = related.schedules.length + related.closures.length + related.announcements.length;

    return (
        <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <header className="space-y-3 border-b p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge>{station.code}</Badge>
                    <Badge variant="outline" className={scheduleStatusTone[station.status]}>{scheduleStatusLabels[station.status]}</Badge>
                    <span className="text-xs text-muted-foreground">{station.zone}</span>
                </div>
                <h2 id="station-details-heading" ref={headingRef} tabIndex={-1} className="scroll-mt-24 text-xl font-bold text-primary outline-none sm:text-2xl">{station.name} Station</h2>
                <p className="text-sm text-muted-foreground">Area: {station.area} · {station.structureType}</p>
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{station.landmark}</p>
                <p className="text-sm leading-relaxed">{station.description}</p>
            </header>
            <div className="space-y-6 p-5 sm:p-6">
                <section aria-label="Construction progress" className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <h3 className="font-semibold">Civil &amp; structural progress</h3>
                        <span className="text-lg font-bold text-primary">{station.progress}%</span>
                    </div>
                    <Progress value={station.progress} aria-label="Station civil and structural construction progress" className="mt-2 h-2" />
                    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
                        <div><dt className="text-xs text-muted-foreground">Current work</dt><dd className="mt-1 leading-relaxed">{station.currentPhase}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Target completion</dt><dd className="mt-1 font-medium">{station.targetCompletion}</dd></div>
                    </dl>
                </section>
                <section aria-label="Planned facilities">
                    <h3 className="text-sm font-semibold">Planned facilities</h3>
                    <div className="mt-3 flex flex-wrap gap-2">{station.facilities.map((facility) => <Badge variant="secondary" key={facility}>{facility}</Badge>)}</div>
                </section>
                <details className="group rounded-lg border">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                        <span>Related works &amp; access <span className="ml-1 text-xs font-normal text-muted-foreground">({updateCount})</span></span>
                        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                    </summary>
                    <div className="space-y-4 border-t p-4 text-sm">
                        <p className="text-xs text-muted-foreground">Construction works and road restrictions associated with this station. Ended restrictions are kept for reference.</p>
                        {updateCount === 0 && <p className="text-muted-foreground">No works or notices are listed for this station.</p>}
                        {related.closures.map((closure) => <ClosureNotice key={closure.id} closure={closure} announcement={related.announcements.find((notice) => notice.sourceClosureId === closure.id)} />)}
                        {related.schedules.map((item) => (
                            <div key={item.id} className="space-y-1 border-l-2 border-primary/20 pl-3">
                                <Badge variant="outline" className={scheduleStatusTone[item.status]}>{scheduleStatusLabels[item.status]}</Badge>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                        {related.announcements.length > 0 && <div className="space-y-2">
                            <h3 className="text-xs font-semibold">Related announcements</h3>
                            {related.announcements.map((notice) => <p key={notice.id}><Link to={announcementUrl(notice.id)} className="text-sm font-medium text-primary hover:underline">{notice.title}</Link></p>)}
                        </div>}
                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-primary">
                            <Link to={PATHS.constructionUpdates} className="hover:underline">Construction updates →</Link>
                            <Link to={PATHS.roadAccess} className="hover:underline">Road &amp; access map →</Link>
                        </div>
                    </div>
                </details>
                {(related.nearbyClosures.length > 0 || related.nearbyAnnouncements.length > 0) && <details className="group rounded-lg border">
                    <summary className="cursor-pointer rounded-lg p-4 text-sm font-medium">Nearby advisories in {station.area}</summary>
                    <div className="space-y-3 border-t p-4">
                        <p className="text-xs text-muted-foreground">Other notices around {station.area}. These may relate to work at nearby locations.</p>
                        {related.nearbyClosures.map((closure) => <ClosureNotice key={closure.id} closure={closure} announcement={data.announcements.find((notice) => notice.sourceClosureId === closure.id)} />)}
                        {related.nearbyAnnouncements.map((notice) => <p key={notice.id}><Link to={announcementUrl(notice.id)} className="text-sm font-medium text-primary hover:underline">{notice.title}</Link></p>)}
                    </div>
                </details>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                    <MapsLink location={station} mode="search"><Navigation className="size-4" aria-hidden /> Google Maps</MapsLink>
                    <Link to={PATHS.ticket} className="font-medium text-primary hover:underline">Report an issue →</Link>
                </div>
            </div>
        </article>
    );
}
