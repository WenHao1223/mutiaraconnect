import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Calendar, ChevronDown, ChevronLeft, ChevronRight, MapPin, Pin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readAnnouncements, subscribeAnnouncements } from "@/lib/admin/announcements";
import {
    readSchedule,
    scheduleStatusLabels as statusLabels,
    scheduleStatusTone as statusTone,
} from "@/lib/admin/schedule";
import { PATHS } from "@/routes";
import type { ConstructionSchedule, ScheduleStatus } from "@/types/schedule";

const PAGE_SIZE = 4;
const statusOrder: Record<ScheduleStatus, number> = { ongoing: 0, upcoming: 1, completed: 2 };

function formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kuala_Lumpur",
    });
}

export default function ConstructionUpdatesPage() {
    const [scheduleItems, setScheduleItems] = useState(() => readSchedule());
    const [announcements, setAnnouncements] = useState(() => readAnnouncements());
    const [statusFilter, setStatusFilter] = useState<ScheduleStatus | "all">("all");
    const [areaFilter, setAreaFilter] = useState("all");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);

    useEffect(() => subscribeAnnouncements(() => {
        setAnnouncements(readAnnouncements());
        setScheduleItems(readSchedule());
    }), []);

    const allAreas = useMemo(() =>
        Array.from(new Set(scheduleItems.map((item) => item.area).filter(Boolean))).sort(),
    [scheduleItems]);

    const filteredSchedule = useMemo(() => {
        const search = query.trim().toLowerCase();
        return scheduleItems.filter((item) => {
            if (statusFilter !== "all" && item.status !== statusFilter) return false;
            if (areaFilter !== "all" && item.area !== areaFilter) return false;
            return !search || [item.title, item.description, item.area, item.id]
                .some((value) => value.toLowerCase().includes(search));
        }).sort((a, b) => statusOrder[a.status] - statusOrder[b.status] ||
            (a.status === "upcoming"
                ? a.startsAt.localeCompare(b.startsAt)
                : b.updatedAt.localeCompare(a.updatedAt)));
    }, [scheduleItems, statusFilter, areaFilter, query]);

    // Notices belong to the selected area; work status and search apply to the work list only.
    const advisories = announcements.filter((item) =>
        (item.type === "construction" || item.pinned) &&
        (areaFilter === "all" || item.area?.toLowerCase() === areaFilter.toLowerCase()),
    );
    const pageCount = Math.ceil(filteredSchedule.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(0, pageCount - 1));
    const shownItems = filteredSchedule.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    const hasFilters = Boolean(query || statusFilter !== "all" || areaFilter !== "all");

    function resetFilters() {
        setQuery("");
        setStatusFilter("all");
        setAreaFilter("all");
        setPage(0);
    }

    return (
        <div className="flex-1 bg-background">
            <header className="border-b bg-muted/40">
                <div className="mx-auto max-w-4xl px-4 py-7 sm:py-9">
                    <p className="text-xs font-medium text-muted-foreground">Mutiara Line</p>
                    <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">Construction updates</h1>
                            <p className="mt-2 text-sm text-muted-foreground">Find ongoing works, upcoming schedules, and notices for your area.</p>
                        </div>
                        <Link to={PATHS.constructionInfo} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                            Station construction <ArrowUpRight className="size-4" aria-hidden />
                        </Link>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:py-8">
                <section aria-labelledby="work-packages-heading" className="space-y-5">
                    <dl className="grid grid-cols-3 divide-x rounded-xl border bg-card py-4 text-center">
                        {([
                            { value: "ongoing", label: "Ongoing works" },
                            { value: "upcoming", label: "Upcoming" },
                            { value: "completed", label: "Completed" },
                        ] as const).map((status) => (
                            <div key={status.value} className="px-2">
                                <dd className="text-xl font-bold text-primary">{scheduleItems.filter((item) => item.status === status.value).length}</dd>
                                <dt className="mt-1 text-xs text-muted-foreground">{status.label}</dt>
                            </div>
                        ))}
                    </dl>

                    <div>
                        <h2 id="work-packages-heading" className="text-lg font-semibold text-primary">Find construction work</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Filter by status or area, then expand an update for details.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_10rem]">
                        <div className="relative col-span-2 sm:col-span-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                            <Input
                                value={query}
                                onChange={(event) => { setQuery(event.target.value); setPage(0); }}
                                placeholder="Work title, area, or reference"
                                aria-label="Search construction updates"
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as typeof statusFilter); setPage(0); }}>
                            <SelectTrigger aria-label="Filter by work status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="ongoing">Ongoing works</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={areaFilter} onValueChange={(value) => { setAreaFilter(value); setPage(0); }}>
                            <SelectTrigger aria-label="Filter by work area"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All areas</SelectItem>
                                {allAreas.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <p role="status">
                            {filteredSchedule.length > 0
                                ? `Showing ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, filteredSchedule.length)} of ${filteredSchedule.length} updates`
                                : "No matching updates"}
                        </p>
                        {hasFilters && <button type="button" onClick={resetFilters} className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear filters</button>}
                    </div>

                    {shownItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed px-4 py-10 text-center">
                            <p className="font-medium">No updates found</p>
                            <p className="mt-1 text-sm text-muted-foreground">Try another area, status, or search term.</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Reset filters</Button>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {shownItems.map((item) => <li key={item.id}><WorkUpdate item={item} /></li>)}
                        </ul>
                    )}

                    {pageCount > 1 && (
                        <nav aria-label="Construction update pages" className="flex items-center justify-between gap-2 border-t pt-4">
                            <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft aria-hidden /> Previous</Button>
                            <span className="text-xs text-muted-foreground">Page {currentPage + 1} of {pageCount}</span>
                            <Button variant="outline" size="sm" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Next <ChevronRight aria-hidden /></Button>
                        </nav>
                    )}
                </section>

                <section aria-labelledby="advisories-heading" className="space-y-4 border-t pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 id="advisories-heading" className="text-lg font-semibold text-primary">Area advisories</h2>
                        <Link to={PATHS.announcements} className="text-sm font-medium text-primary hover:underline">All announcements →</Link>
                    </div>
                    <p className="text-sm text-muted-foreground">{areaFilter === "all" ? "Recent construction notices and pinned announcements." : `Notices for ${areaFilter}.`}</p>
                    {advisories.length === 0 ? (
                        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">No advisories listed for this area.</p>
                    ) : (
                        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                            {advisories.slice(0, 3).map((item) => (
                                <li key={item.id}>
                                    <details className="group">
                                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                                            <span className="min-w-0 space-y-1">
                                                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    {item.pinned && <span className="inline-flex items-center gap-1 text-primary"><Pin className="size-3" aria-hidden />Pinned</span>}
                                                    {item.area && <span>{item.area}</span>}
                                                    <span>{item.publishedAt ? formatDate(item.publishedAt) : item.time}</span>
                                                </span>
                                                <span className="block text-sm font-medium">{item.title}</span>
                                            </span>
                                            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                                        </summary>
                                        <p className="border-t px-4 py-4 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                                    </details>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

/** The summary carries the essentials; the description and publishing details stay on demand. */
function WorkUpdate({ item }: { item: ConstructionSchedule }) {
    return (
        <details className="group overflow-hidden rounded-xl border bg-card transition-colors open:border-primary/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={statusTone[item.status]}>{statusLabels[item.status]}</Badge>
                        {item.area && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" aria-hidden />{item.area}</span>}
                    </span>
                    <span className="mt-2 block text-sm font-semibold leading-relaxed">{item.title}</span>
                    <span className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                        <Calendar className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        <span><time dateTime={item.startsAt}>{formatDate(item.startsAt)}</time> – <time dateTime={item.endsAt}>{formatDate(item.endsAt)}</time></span>
                    </span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-4 border-t p-4 sm:p-5">
                <p className="text-sm leading-relaxed">{item.description}</p>
                <dl className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                    <div><dt className="font-medium text-foreground">Last updated</dt><dd className="mt-1">{formatDate(item.updatedAt)} · {item.updatedBy}</dd></div>
                    <div><dt className="font-medium text-foreground">Work reference</dt><dd className="mt-1">{item.id}</dd></div>
                </dl>
                <Link
                    to={item.area ? `${PATHS.constructionInfo}?area=${encodeURIComponent(item.area)}` : PATHS.constructionInfo}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                    Station construction <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
            </div>
        </details>
    );
}
