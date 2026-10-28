import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, HardHat, MapPin, Megaphone, Pin, Search, TrainFront } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scheduleStatusLabels as statusLabels, scheduleStatusTone as statusTone } from "@/lib/admin/schedule";
import ClosureNotice from "@/components/construction/ClosureNotice";
import { useConstructionData } from "@/hooks/use-construction-data";
import { announcementDestination, announcementUrl } from "@/lib/announcementLinks";
import { constructionAdvisories } from "@/lib/constructionRelations";
import type { RoadClosure } from "@/types/road-closure";
import { readLrtStations } from "@/lib/lrt/stations";
import { PATHS } from "@/routes";
import type { Announcement } from "@/types/announcement";
import type { LrtStation } from "@/types/lrt";
import type { ConstructionSchedule, ScheduleStatus } from "@/types/schedule";

const PAGE_SIZE = 4;
const statusOrder: Record<ScheduleStatus, number> = { ongoing: 0, upcoming: 1, completed: 2 };
const statuses = [
    { value: "ongoing", label: "Ongoing works", description: "Construction in progress", icon: HardHat, tone: "text-hazard-text bg-hazard/15" },
    { value: "upcoming", label: "Upcoming works", description: "Scheduled to start next", icon: Clock3, tone: "text-info-text bg-info/10" },
    { value: "completed", label: "Completed works", description: "Finished work packages", icon: CheckCircle2, tone: "text-success-text bg-success/10" },
] as const;

function formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });
}

export default function ConstructionUpdatesPage() {
    const { schedules: scheduleItems, announcements, closures } = useConstructionData();
    const stations = useMemo(() => readLrtStations(), []);
    const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "all">("all");
    const [areaFilter, setAreaFilter] = useState("all");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const resultsHeading = useRef<HTMLHeadingElement>(null);

    const allAreas = useMemo(() => Array.from(new Set([
        ...scheduleItems.map((item) => item.area),
        ...constructionAdvisories(announcements, scheduleItems).map((item) => item.area),
    ].filter((area): area is string => Boolean(area)))).sort(), [scheduleItems, announcements]);
    const areaSchedule = scheduleItems.filter((item) => areaFilter === "all" || item.area === areaFilter);
    const filteredSchedule = useMemo(() => {
        const search = query.trim().toLowerCase();
        return scheduleItems.filter((item) => {
            if (statusFilter !== "all" && item.status !== statusFilter) return false;
            if (areaFilter !== "all" && item.area !== areaFilter) return false;
            return !search || [item.title, item.description, item.area, item.id].some((value) => value.toLowerCase().includes(search));
        }).sort((a, b) => statusOrder[a.status] - statusOrder[b.status] ||
            (a.status === "upcoming" ? a.startsAt.localeCompare(b.startsAt) : b.updatedAt.localeCompare(a.updatedAt)));
    }, [scheduleItems, statusFilter, areaFilter, query]);
    // Area is shared; status and search only narrow the work list.
    const advisories = constructionAdvisories(announcements, scheduleItems, areaFilter);
    const latestUpdate = areaSchedule.map((item) => item.updatedAt).sort().at(-1);
    const pageCount = Math.ceil(filteredSchedule.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(0, pageCount - 1));
    const shownItems = filteredSchedule.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const hasFilters = Boolean(query || statusFilter !== "all" || areaFilter !== "all");

    function resetFilters() { setQuery(""); setStatusFilter("all"); setAreaFilter("all"); setPage(0); }
    function changePage(next: number) {
        setPage(next);
        resultsHeading.current?.focus({ preventScroll: true });
        resultsHeading.current?.scrollIntoView({ block: "start" });
    }

    return (
        <div className="flex-1 bg-background">
            <header className="border-b bg-card">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                        <span className="h-1.5 w-6 rounded-full bg-hazard" aria-hidden />Mutiara Line · Construction</p>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
                        <div className="max-w-2xl">
                            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">See what’s happening near you</h1>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">Follow construction updates, see what’s coming next, and check local notices before you travel.</p>
                        </div>
                        <Link to={PATHS.constructionInfo} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <TrainFront className="size-4" aria-hidden />Station progress<ArrowUpRight className="size-4" aria-hidden />
                        </Link>
                    </div>
                </div>
            </header>
            <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8">
                <section aria-labelledby="overview-heading" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 id="overview-heading" className="text-lg font-semibold">Construction at a glance</h2>
                            <p className="mt-1 text-xs text-muted-foreground">{areaFilter === "all" ? "Across all listed areas" : `In ${areaFilter}`} · Select a status to explore</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label htmlFor="construction-area" className="text-sm font-medium">Your area</label>
                            <Select value={areaFilter} onValueChange={(value) => { setAreaFilter(value); setPage(0); }}>
                                <SelectTrigger id="construction-area" className="w-40 bg-card sm:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All areas</SelectItem>{allAreas.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {statuses.map(({ value, label, description, icon: Icon, tone }) => (
                            <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => { setStatusFilter(statusFilter === value ? "all" : value); setPage(0); }} className={`flex cursor-pointer flex-wrap items-center gap-2 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4 lg:p-5 ${statusFilter === value ? "border-primary ring-1 ring-primary" : ""}`}>
                                <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-10 ${tone}`}>
                                    <Icon className="size-5" aria-hidden />
                                </span>
                                <span className="order-2 basis-full">
                                    <span className="block text-xs font-medium sm:text-sm">{label}</span>
                                    <span className="mt-1 hidden text-xs text-muted-foreground md:block">{description}</span>
                                </span>
                                <span className="order-1 ml-auto text-2xl font-bold tabular-nums text-primary sm:text-3xl">{areaSchedule.filter((item) => item.status === value).length}</span>
                            </button>
                        ))}
                    </div>
                </section>
                <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-lg border border-hazard/30 bg-hazard/10 px-4 py-3 text-sm">
                    <a href="#advisories-heading" className="inline-flex items-center gap-2 font-medium text-foreground hover:underline">
                        <Megaphone className="size-4 shrink-0 text-hazard-text" aria-hidden />{advisories.length} area {advisories.length === 1 ? "advisory" : "advisories"} · Check local notices<ChevronDown className="size-3.5" aria-hidden />
                    </a>
                    <Link to={PATHS.roadAccess} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Road &amp; access map<ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                </div>
                <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <section aria-labelledby="work-packages-heading" className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                                <h2 id="work-packages-heading" ref={resultsHeading} tabIndex={-1} className="scroll-mt-24 text-xl font-semibold text-primary outline-none">Construction updates</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Ongoing works first, followed by upcoming and completed works.</p>
                            </div>{latestUpdate && <p className="text-xs text-muted-foreground">Latest work update: {formatDate(latestUpdate)}</p>}</div>
                        <div className="space-y-3 rounded-xl border bg-card p-4">
                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                                    <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search work, area, or reference" aria-label="Search construction updates" className="pl-9" />
                                </div>
                                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as typeof statusFilter); setPage(0); }}>
                                    <SelectTrigger aria-label="Filter by work status" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="ongoing">Ongoing works</SelectItem>
                                        <SelectItem value="upcoming">Upcoming</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                <p role="status">{filteredSchedule.length > 0 ? `${filteredSchedule.length} update${filteredSchedule.length === 1 ? "" : "s"}${areaFilter === "all" ? " across all areas" : ` in ${areaFilter}`} · Showing ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filteredSchedule.length)}` : "No matching updates"}</p>{hasFilters && <button type="button" onClick={resetFilters} className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear filters</button>}</div>
                        </div>
                        {shownItems.length === 0 ? <div className="rounded-xl border border-dashed bg-card px-4 py-12 text-center">
                            <Search className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden />
                            <p className="font-medium">No updates found</p>
                            <p className="mt-1 text-sm text-muted-foreground">Try another area, status, or search term.</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Reset filters</Button>
                        </div> : <ul className="space-y-4">{shownItems.map((item) => <li key={item.id}>
                            <WorkUpdate item={item} stations={stations} announcements={announcements} closures={closures} />
                        </li>)}</ul>}
                        {pageCount > 1 && <nav aria-label="Construction update pages" className="flex items-center justify-between gap-2 pt-2">
                            <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => changePage(currentPage - 1)}>
                                <ChevronLeft aria-hidden />Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {currentPage + 1} of {pageCount}</span>
                            <Button variant="outline" size="sm" disabled={currentPage + 1 >= pageCount} onClick={() => changePage(currentPage + 1)}>Next<ChevronRight aria-hidden />
                            </Button>
                        </nav>}
                    </section>
                    <aside className="min-w-0 space-y-5">
                        <section aria-labelledby="advisories-heading" className="overflow-hidden rounded-xl border bg-card">
                            <div className="border-b bg-hazard/10 p-5">
                                <h2 id="advisories-heading" tabIndex={-1} className="scroll-mt-24 flex items-center gap-2 font-semibold">
                                    <Megaphone className="size-4 text-hazard-text" aria-hidden />Area advisories</h2>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Construction notices, related road restrictions and pinned announcements{areaFilter === "all" ? " across all areas" : ` for ${areaFilter}`}. Ended restrictions remain in the announcement archive. Search and work status do not filter these notices.</p>
                            </div>
                            {advisories.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No advisories listed for this area. Check the road &amp; access map before travelling.</p> : <ul className="divide-y">{advisories.slice(0, 3).map((item) => <li key={item.id}>
                                <Advisory item={item} />
                            </li>)}</ul>}
                            <Link to={PATHS.announcements} className="flex items-center justify-between gap-2 border-t p-4 text-sm font-medium text-primary hover:bg-accent">{advisories.length > 3 ? `View all announcements (${advisories.length} area advisories)` : "View all announcements"}<ArrowRight className="size-4 shrink-0" aria-hidden />
                            </Link>
                        </section>
                        <section aria-labelledby="travel-heading" className="rounded-xl border bg-primary/5 p-5">
                            <h2 id="travel-heading" className="font-semibold text-primary">Travelling through a work area?</h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Work schedules don’t show every road restriction. Check closures, pedestrian access, and local business entrances before setting off.</p>
                            <Link to={PATHS.roadAccess} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Open road &amp; access map<ArrowUpRight className="size-4" aria-hidden />
                            </Link>
                            <div className="mt-5 border-t pt-4">
                                <p className="text-xs text-muted-foreground">Noise, dust, or access concerns?</p>
                                <Link to={PATHS.ticket} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Report an issue<ArrowRight className="size-3.5" aria-hidden />
                                </Link>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}

/** Keep the what, where and when visible; expand for supporting records and provenance. */
function WorkUpdate({ item, stations, announcements, closures }: { item: ConstructionSchedule; stations: LrtStation[]; announcements: Announcement[]; closures: RoadClosure[] }) {
    const relatedStations = stations.filter((station) => item.stationIds?.includes(station.id));
    const relatedNotices = announcements.filter((notice) => item.announcementIds?.includes(notice.id));
    const relatedClosures = closures.filter((closure) => item.closureIds?.includes(closure.id));
    return (
        <article className={`overflow-hidden rounded-xl border border-l-4 bg-card ${item.status === "ongoing" ? "border-l-hazard" : item.status === "upcoming" ? "border-l-info" : "border-l-success"}`}>
            <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className={statusTone[item.status]}>{statusLabels[item.status]}</Badge>{item.area && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden />{item.area}</span>}</div>
                <h3 className="mt-3 text-base font-semibold leading-snug sm:text-lg">{item.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-muted/60 p-3 text-sm">
                    <div>
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="size-3.5" aria-hidden />{item.status === "upcoming" ? "Scheduled start" : "Start date"}</dt>
                        <dd className="mt-1 font-medium">
                            <time dateTime={item.startsAt}>{formatDate(item.startsAt)}</time>
                        </dd>
                    </div>
                    <div className="border-l pl-4">
                        <dt className="text-xs text-muted-foreground">{item.status === "completed" ? "End date" : "Expected completion"}</dt>
                        <dd className="mt-1 font-medium">
                            <time dateTime={item.endsAt}>{formatDate(item.endsAt)}</time>
                        </dd>
                    </div>
                </dl>
                {relatedClosures.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{relatedClosures.length} related road &amp; access {relatedClosures.length === 1 ? "notice" : "notices"} · View details below</p>}
            </div>
            <details className="group border-t">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-medium text-primary hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">
                    <span>
                        <span className="group-open:hidden">View stations &amp; update details</span>
                        <span className="hidden group-open:inline">Hide update details</span>
                    </span>
                    <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="space-y-5 border-t bg-muted/20 p-5 sm:px-6">
                    {relatedClosures.length > 0 && <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Road restrictions &amp; access history</h4>
                        {relatedClosures.map((closure) => <ClosureNotice key={closure.id} closure={closure} announcement={relatedNotices.find((notice) => notice.sourceClosureId === closure.id)} />)}
                    </div>}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related stations</h4>
                        <div className="mt-2 flex flex-wrap gap-2">{relatedStations.length ? relatedStations.map((station) => <Link key={station.id} to={`${PATHS.constructionInfo}?station=${encodeURIComponent(station.code)}`} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-primary hover:bg-accent">
                            <span className="text-xs text-muted-foreground">{station.code}</span>{station.name}<ArrowUpRight className="size-3.5" aria-hidden />
                        </Link>) : <Link to={item.area ? `${PATHS.constructionInfo}?area=${encodeURIComponent(item.area)}` : PATHS.constructionInfo} className="text-sm font-medium text-primary hover:underline">Explore station construction →</Link>}</div>
                    </div>
                    {relatedNotices.length > 0 && <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related notices</h4>{relatedNotices.map((notice) => <div key={notice.id} className="border-l-2 border-hazard pl-3">
                            <Link to={announcementUrl(notice.id)} className="text-sm font-medium text-primary hover:underline">{notice.title}</Link>
                            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{notice.body}</p>
                        </div>)}</div>}
                    <dl className="grid gap-3 border-t pt-4 text-xs sm:grid-cols-2">
                        <div>
                            <dt className="font-medium">Last updated</dt>
                            <dd className="mt-1 text-muted-foreground">{formatDate(item.updatedAt)}</dd>
                            <dd className="mt-1 text-muted-foreground">{item.updatedBy}</dd>
                        </div>
                        <div>
                            <dt className="font-medium">Work reference</dt>
                            <dd className="mt-1 text-muted-foreground">{item.id}</dd>
                        </div>
                    </dl>
                </div>
            </details>
        </article>
    );
}

function Advisory({ item }: { item: Announcement; }) {
    const destination = announcementDestination(item);
    return (
        <div className="p-5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">{item.pinned && <span className="inline-flex items-center gap-1 font-medium text-hazard-text">
                <Pin className="size-3" aria-hidden />Pinned</span>}{item.area && <span>{item.area}</span>}</div>
            <h3 className="mt-2 text-sm font-semibold leading-relaxed">{item.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Published {item.publishedAt ? formatDate(item.publishedAt) : item.time}</p>
            <details className="group mt-2">
                <summary className="cursor-pointer list-none rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                    <span className="line-clamp-2 leading-relaxed text-muted-foreground group-open:hidden">{item.body}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <span className="group-open:hidden">Read notice</span>
                        <span className="hidden group-open:inline">Close notice</span>
                        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
                    </span>
                </summary>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </details>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-primary">
                <Link to={announcementUrl(item.id)} className="hover:underline">View announcement →</Link>
                {item.sourceClosureId && <Link to={destination.to} className="hover:underline">{destination.label} →</Link>}
            </div>
        </div>
    );
}
