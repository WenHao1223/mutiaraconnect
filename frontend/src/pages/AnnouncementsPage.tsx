import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";
import {
    ArrowRight,
    ChevronDown,
    SlidersHorizontal,
    X,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Pause,
    Play,
    Bell,
    BellOff,
    Calendar,
    CheckCheck,
    CheckCircle2,
    CircleDot,
    Clock,
    MapPin,
    Pin,
    Search,
    Share2,
    ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    markAllAnnouncementsRead,
    markAnnouncementRead,
    markAnnouncementUnread,
    readAnnouncements,
    readReadAnnouncementIds,
    subscribeAnnouncements,
} from "@/lib/admin/announcements";
import { useAuth } from "@/lib/auth/auth";
import { getStationAreas } from "@/lib/lrt/stations";
import { useSettings } from "@/lib/settings/settings";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { Announcement } from "@/types/announcement";
import { tone } from "@/lib/tones";
import { matchesPublicationDate, publicationDateKey } from "@/lib/announcementDate";

const typeBadgeStyle: Record<
    Announcement["type"],
    { label: string; className: string }
> = {
    closure: {
        label: "Road Closure",
        className: tone.danger,
    },
    construction: {
        label: "Construction",
        className: tone.warning,
    },
    general: {
        label: "General Notice",
        className: tone.info,
    },
};

const ANNOUNCEMENTS_PER_PAGE = 5;

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type TypeFilter = "all" | Announcement["type"] | "unread" | "pinned";

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const { notificationsEnabled, setNotificationsEnabled } = useSettings();

    const [items, setItems] = useState<Announcement[]>(() => readAnnouncements());
    const [readIds, setReadIds] = useState<string[]>(() => readReadAnnouncementIds());
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [areaFilter, setAreaFilter] = useState<string>("all");
    const [query, setQuery] = useState<string>("");
    const [yearFilter, setYearFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");
    const [dayFilter, setDayFilter] = useState("all");
    const [pagination, setPagination] = useState({ filterKey: "", page: 0 });
    const listHeadingRef = useRef<HTMLHeadingElement>(null);
    const filterKey = JSON.stringify([typeFilter, areaFilter, query, yearFilter, monthFilter, dayFilter]);
    // Reset with the filters before committing a render, without an extra effect.
    if (pagination.filterKey !== filterKey) {
        setPagination({ filterKey, page: 0 });
    }
    const filtersRef = useRef<HTMLDetailsElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const datePrefix = yearFilter === "all" ? "" : monthFilter === "all" ? yearFilter
        : dayFilter === "all" ? `${yearFilter}-${monthFilter}` : `${yearFilter}-${monthFilter}-${dayFilter}`;
    const publicationYears = useMemo(() => Array.from(new Set(items
        .map((item) => publicationDateKey(item.publishedAt)?.slice(0, 4))
        .filter((year): year is string => Boolean(year))))
        .sort((a, b) => Number(b) - Number(a)), [items]);
    const daysInMonth = yearFilter !== "all" && monthFilter !== "all"
        ? new Date(Number(yearFilter), Number(monthFilter), 0).getDate() : 0;
    const hasFilters = typeFilter !== "all" || areaFilter !== "all" || Boolean(query) || Boolean(datePrefix);

    function clearDateFilter() {
        setYearFilter("all");
        setMonthFilter("all");
        setDayFilter("all");
    }

    function resetFilters() {
        setTypeFilter("all");
        setAreaFilter("all");
        setQuery("");
        clearDateFilter();
    }

    const activeFilters = [
        ...(typeFilter !== "all" ? [{
            id: "category",
            label: typeFilter === "unread" ? "Unread" : typeFilter === "pinned" ? "Pinned" : typeBadgeStyle[typeFilter].label,
            clear: () => setTypeFilter("all"),
        }] : []),
        ...(areaFilter !== "all" ? [{ id: "area", label: areaFilter, clear: () => setAreaFilter("all") }] : []),
        ...(datePrefix ? [{
            id: "date",
            label: monthFilter === "all" ? yearFilter : `${dayFilter === "all" ? "" : `${Number(dayFilter)} `}${months[Number(monthFilter) - 1]} ${yearFilter}`,
            clear: clearDateFilter,
        }] : []),
    ];

    useEffect(() => {
        return subscribeAnnouncements(() => {
            setItems(readAnnouncements());
            setReadIds(readReadAnnouncementIds());
        });
    }, []);

    const areas = useMemo(() => {
        const stationAreas = getStationAreas();
        const announcementAreas = items.map((item) => item.area).filter((a): a is string => Boolean(a));
        return Array.from(new Set([...stationAreas, ...announcementAreas])).sort();
    }, [items]);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            if (Boolean(a.pinned) !== Boolean(b.pinned)) {
                return a.pinned ? -1 : 1;
            }
            if (a.publishedAt && b.publishedAt) {
                return b.publishedAt.localeCompare(a.publishedAt);
            }
            return 0;
        });
    }, [items]);

    const filteredItems = useMemo(() => {
        return sortedItems.filter((item) => {
            if (!matchesPublicationDate(item.publishedAt, datePrefix)) return false;
            const isUnread = !readIds.includes(item.id);
            if (typeFilter === "unread" && !isUnread) return false;
            if (typeFilter === "pinned" && !item.pinned) return false;
            if (
                (typeFilter === "closure" ||
                    typeFilter === "construction" ||
                    typeFilter === "general") &&
                item.type !== typeFilter
            ) {
                return false;
            }

            if (areaFilter !== "all" && item.area?.toLowerCase() !== areaFilter.toLowerCase()) {
                return false;
            }

            if (query.trim()) {
                const q = query.trim().toLowerCase();
                return (
                    item.title.toLowerCase().includes(q) ||
                    item.body.toLowerCase().includes(q) ||
                    Boolean(item.area && item.area.toLowerCase().includes(q)) ||
                    Boolean(item.createdBy && item.createdBy.toLowerCase().includes(q))
                );
            }

            return true;
        });
    }, [sortedItems, readIds, typeFilter, areaFilter, query, datePrefix]);

    const pageCount = Math.ceil(filteredItems.length / ANNOUNCEMENTS_PER_PAGE);
    const currentPage = pagination.filterKey === filterKey
        ? Math.min(pagination.page, Math.max(0, pageCount - 1)) : 0;
    const pageStart = currentPage * ANNOUNCEMENTS_PER_PAGE;
    const visibleItems = filteredItems.slice(pageStart, pageStart + ANNOUNCEMENTS_PER_PAGE);

    function changePage(page: number) {
        flushSync(() => setPagination({ filterKey, page }));
        listHeadingRef.current?.focus({ preventScroll: true });
        listHeadingRef.current?.scrollIntoView({
            block: "start",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }

    // Highlights remain independent of the list filters, with pinned notices first.
    const featuredItems = sortedItems.slice(0, 5);

    function openAnnouncement(id: string) {
        flushSync(() => {
            resetFilters();
            const index = sortedItems.findIndex((item) => item.id === id);
            setPagination({
                filterKey: JSON.stringify(["all", "all", "", "all", "all", "all"]),
                page: Math.floor(Math.max(0, index) / ANNOUNCEMENTS_PER_PAGE),
            });
            setReadIds(markAnnouncementRead(id));
        });
        const bulletin = document.getElementById(`announcement-${id}`);
        bulletin?.focus({ preventScroll: true });
        bulletin?.scrollIntoView({
            block: "start",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }

    const unreadCount = items.filter((item) => !readIds.includes(item.id)).length;
    const isAdmin = user?.role === "admin" || user?.role === "super_admin";

    function toggleReadStatus(id: string) {
        if (readIds.includes(id)) {
            setReadIds(markAnnouncementUnread(id));
        } else {
            setReadIds(markAnnouncementRead(id));
        }
    }

    function handleMarkAllRead() {
        setReadIds(markAllAnnouncementsRead(items.map((item) => item.id)));
        toast.success("All announcements marked as read.");
    }

    async function shareAnnouncement(item: Announcement) {
        const shareText = `[MutiaraConnect ${typeBadgeStyle[item.type].label}] ${item.title}${
            item.area ? ` (${item.area})` : ""
        } — ${item.body}`;
        const shareUrl = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: item.title,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
            toast.success("Announcement copied to clipboard for sharing.");
        } catch {
            toast.info("Announcement ready to share.");
        }
    }

    return (
        <div className="flex-1 bg-background">
            {/* Hero Header */}
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        MutiaraConnect Public Bulletins
                    </p>
                    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-primary">
                                Announcements &amp; Notifications
                            </h1>
                            <p className="mt-1 max-w-2xl text-muted-foreground">
                                Stay updated with official construction alerts, temporary traffic
                                diversions, and community notices along the Penang LRT Mutiara Line.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const next = !notificationsEnabled;
                                    setNotificationsEnabled(next);
                                    toast.success(
                                        next
                                            ? "Notification badge alerts enabled."
                                            : "Notification badge alerts paused.",
                                    );
                                }}
                            >
                                {notificationsEnabled ? (
                                    <>
                                        <Bell className="size-4 text-primary" />
                                        Alerts On
                                    </>
                                ) : (
                                    <>
                                        <BellOff className="size-4 text-muted-foreground" />
                                        Alerts Paused
                                    </>
                                )}
                            </Button>

                            {unreadCount > 0 && (
                                <Button type="button" size="sm" onClick={handleMarkAllRead}>
                                    <CheckCheck className="size-4" />
                                    Mark all read ({unreadCount})
                                </Button>
                            )}

                            {isAdmin && (
                                <Button asChild variant="secondary" size="sm">
                                    <Link to={`${PATHS.admin}#notifications`}>Manage in Admin</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Area */}
            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                {featuredItems.length > 0 && (
                    <AnnouncementHighlights
                        key={featuredItems.map((item) => item.id).join("|")}
                        items={featuredItems}
                        onOpen={openAnnouncement}
                    />
                )}

                <div>
                    <h2 ref={listHeadingRef} tabIndex={-1} className="scroll-mt-24 text-xl font-semibold text-primary outline-none">All announcements</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Browse every bulletin, or filter by topic, area, publication date, and read status.</p>
                </div>
                {/* Search stays visible; secondary controls open on demand. */}
                <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                        <Input
                            ref={searchRef}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search announcements..."
                            className="pl-9 pr-10"
                            aria-label="Search announcements"
                        />
                        {query && (
                            <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); searchRef.current?.focus(); }} className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <X className="size-4" aria-hidden />
                            </button>
                        )}
                    </div>
                    <details ref={filtersRef} className="group border-t pt-3">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg p-2 text-primary hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                            <span className="flex items-center gap-2">
                                <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
                                <span className="text-sm font-medium">Filters</span>
                                {activeFilters.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold">{activeFilters.length} active</span>}
                            </span>
                            <span className="flex items-center gap-2 text-xs">
                                <span className="group-open:hidden">Expand</span>
                                <span className="hidden group-open:inline">Collapse</span>
                                <ChevronDown className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                            </span>
                        </summary>
                        <div className="mt-3 space-y-5 rounded-lg border bg-muted/20 p-4">
                            <fieldset>
                                <legend className="mb-2 text-sm font-medium">Category &amp; read status</legend>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {(
                                        [
                                            { value: "all", label: `All (${items.length})` },
                                            { value: "unread", label: `Unread (${unreadCount})` },
                                            { value: "pinned", label: "Pinned" },
                                            { value: "construction", label: "Construction" },
                                            { value: "closure", label: "Road Closures" },
                                            { value: "general", label: "General" },
                                        ] as const
                                    ).map((tab) => (
                                        <button
                                            key={tab.value}
                                            type="button"
                                            onClick={() => setTypeFilter(tab.value)}
                                            aria-pressed={typeFilter === tab.value}
                                            className={cn(
                                                "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                                                typeFilter === tab.value
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted/60 text-muted-foreground hover:text-foreground",
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                            </fieldset>
                            <div className="space-y-2">
                                <label htmlFor="announcement-area" className="text-sm font-medium">Station area</label>
                                <Select value={areaFilter} onValueChange={setAreaFilter}>
                                    <SelectTrigger id="announcement-area" className="bg-card"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All station areas</SelectItem>
                                        {areas.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <fieldset className="border-t pt-4">
                                <legend className="sr-only">Filter announcements by publication date</legend>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="inline-flex items-center gap-2 text-sm font-medium"><Calendar className="size-4 text-primary" aria-hidden />Publication date</p>
                                    {datePrefix && <button type="button" onClick={clearDateFilter} className="rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear date</button>}
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <label htmlFor="announcement-year" className="text-xs text-muted-foreground">Year</label>
                                        <Select value={yearFilter} onValueChange={(value) => { setYearFilter(value); setMonthFilter("all"); setDayFilter("all"); }}>
                                            <SelectTrigger id="announcement-year"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All years</SelectItem>
                                                {publicationYears.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="announcement-month" className="text-xs text-muted-foreground">Month</label>
                                        <Select value={monthFilter} disabled={yearFilter === "all"} onValueChange={(value) => { setMonthFilter(value); setDayFilter("all"); }}>
                                            <SelectTrigger id="announcement-month"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All months</SelectItem>
                                                {months.map((month, index) => <SelectItem key={month} value={String(index + 1).padStart(2, "0")}>{month}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="announcement-day" className="text-xs text-muted-foreground">Day</label>
                                        <Select value={dayFilter} disabled={monthFilter === "all"} onValueChange={setDayFilter}>
                                            <SelectTrigger id="announcement-day"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All days</SelectItem>
                                                {Array.from({ length: daysInMonth }, (_, index) => {
                                                    const day = String(index + 1).padStart(2, "0");
                                                    return <SelectItem key={day} value={day}>{day}</SelectItem>;
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Choose a year, then optionally a month and day. Dates use Malaysian time. Filters apply to the list below.</p>
                            </fieldset>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                                <p className="text-xs text-muted-foreground">Results update as you choose.</p>
                                <Button type="button" size="sm" onClick={() => {
                                    if (filtersRef.current) filtersRef.current.open = false;
                                    filtersRef.current?.querySelector("summary")?.focus();
                                }}>View results<ArrowRight className="size-3.5" aria-hidden /></Button>
                            </div>
                        </div>
                    </details>
                    {activeFilters.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
                            {activeFilters.map((filter) => (
                                <button key={filter.id} type="button" aria-label={`Remove ${filter.label} filter`} onClick={() => {
                                    filter.clear();
                                    filtersRef.current?.querySelector("summary")?.focus({ preventScroll: true });
                                }} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                    <span className="break-words">{filter.label}</span><X className="size-3 shrink-0" aria-hidden />
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                        <p role="status">{filteredItems.length > 0
                            ? `Showing ${pageStart + 1}–${pageStart + visibleItems.length} of ${filteredItems.length}${hasFilters ? " matching" : ""} ${filteredItems.length === 1 ? "announcement" : "announcements"}`
                            : "No matching announcements"}</p>
                        {hasFilters && <button type="button" onClick={resetFilters} className="rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear all filters</button>}
                    </div>
                </div>

                {/* Announcements List */}
                {filteredItems.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
                            <p className="mt-2 text-sm font-semibold">No matching announcements</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Try adjusting your category, area, publication date, or search keywords.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={resetFilters}
                            >
                                Reset filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {visibleItems.map((item, index) => {
                            const isUnread = !readIds.includes(item.id);
                            const badge = typeBadgeStyle[item.type];

                            return (
                                <Card
                                    key={`${item.id}-${pageStart + index}`}
                                    id={`announcement-${item.id}`}
                                    tabIndex={-1}
                                    className={cn(
                                        "scroll-mt-24 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        isUnread && "border-primary/40 bg-primary/[0.02]",
                                        item.pinned && "ring-1 ring-hazard/40",
                                    )}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline" className={badge.className}>
                                                    {badge.label}
                                                </Badge>
                                                {item.area && (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                                        <MapPin className="size-3 text-primary" />
                                                        {item.area}
                                                    </span>
                                                )}
                                                {item.pinned && (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-hazard/20 px-2 py-0.5 text-xs font-semibold text-hazard-text">
                                                        <Pin className="size-3" />
                                                        Pinned Advisory
                                                    </span>
                                                )}
                                                {isUnread && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                                        <span className="size-2 rounded-full bg-hazard" />
                                                        Unread
                                                    </span>
                                                )}
                                            </div>

                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="size-3.5" />
                                                {item.time}
                                            </span>
                                        </div>

                                        <CardTitle className="mt-2 text-lg font-semibold text-foreground">
                                            {item.title}
                                        </CardTitle>
                                        {item.createdBy && (
                                            <CardDescription className="text-xs">
                                                Published by {item.createdBy}
                                                {item.publishedAt
                                                    ? ` · ${new Date(item.publishedAt).toLocaleString("en-MY", {
                                                          dateStyle: "medium",
                                                          timeStyle: "short",
                                                          timeZone: "Asia/Kuala_Lumpur",
                                                      })}`
                                                    : ""}
                                            </CardDescription>
                                        )}
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <p className="text-sm leading-relaxed text-foreground">{item.body}</p>

                                        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleReadStatus(item.id)}
                                                    className="h-8 text-xs"
                                                >
                                                    {isUnread ? (
                                                        <>
                                                            <CheckCircle2 className="size-3.5 text-primary" />
                                                            Mark as read
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CircleDot className="size-3.5 text-muted-foreground" />
                                                            Mark as unread
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => shareAnnouncement(item)}
                                                    className="h-8 text-xs"
                                                >
                                                    <Share2 className="size-3.5" />
                                                    Share bulletin
                                                </Button>
                                            </div>

                                            <Link
                                                to={
                                                    item.type === "closure"
                                                        ? PATHS.roadAccess
                                                        : item.area
                                                          ? `${PATHS.constructionInfo}?area=${encodeURIComponent(item.area)}`
                                                          : PATHS.constructionInfo
                                                }
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                {item.type === "closure"
                                                    ? "View road closures →"
                                                    : "View station route map →"}
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
                {pageCount > 1 && (
                    <nav aria-label="Announcement pages" className="flex items-center justify-between gap-2 border-t pt-5">
                        <Button
                            type="button" variant="outline" size="sm"
                            disabled={currentPage === 0}
                            onClick={() => changePage(currentPage - 1)}
                        ><ChevronLeft className="size-4" aria-hidden />Previous</Button>
                        <span className="text-xs tabular-nums text-muted-foreground" aria-current="page">Page {currentPage + 1} of {pageCount}</span>
                        <Button
                            type="button" variant="outline" size="sm"
                            disabled={currentPage === pageCount - 1}
                            onClick={() => changePage(currentPage + 1)}
                        >Next<ChevronRight className="size-4" aria-hidden /></Button>
                    </nav>
                )}
            </div>
        </div>
    );
}

const ROTATION_INTERVAL = 8_000;

function subscribeReducedMotion(onChange: () => void) {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    preference.addEventListener("change", onChange);
    return () => preference.removeEventListener("change", onChange);
}

function subscribeVisibility(onChange: () => void) {
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
}

function AnnouncementHighlights({ items, onOpen }: { items: Announcement[]; onOpen: (id: string) => void }) {
    const reducedMotion = useSyncExternalStore(
        subscribeReducedMotion,
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        () => true,
    );
    const hidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);
    const [playing, setPlaying] = useState(true);
    const [hovered, setHovered] = useState(false);
    const [viewportRef, api] = useEmblaCarousel({ loop: true, duration: reducedMotion ? 0 : 25 });
    const subscribeSelection = useCallback((onChange: () => void) => {
        if (!api) return () => {};
        api.on("select", onChange);
        api.on("reInit", onChange);
        return () => {
            api.off("select", onChange);
            api.off("reInit", onChange);
        };
    }, [api]);
    const current = useSyncExternalStore(subscribeSelection, () => api?.selectedScrollSnap() ?? 0, () => 0);
    const multiple = items.length > 1;
    const autoPlaying = multiple && playing && !hovered && !hidden && !reducedMotion;

    useEffect(() => {
        if (!api || !autoPlaying) return;
        const timer = window.setInterval(() => api.scrollNext(), ROTATION_INTERVAL);
        return () => window.clearInterval(timer);
    }, [api, autoPlaying]);

    function navigate(index: number) {
        setPlaying(false);
        api?.scrollTo(index, reducedMotion);
    }

    return (
        <section
            aria-labelledby="announcement-highlights-heading"
            aria-roledescription="carousel"
            className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocusCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget) &&
                    !(event.target instanceof Element && event.target.closest("[data-carousel-rotation]"))) {
                    setPlaying(false);
                }
            }}
            onKeyDown={(event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                    event.preventDefault();
                    navigate((current + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length);
                }
            }}
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary/5 px-5 py-4 sm:px-7">
                <div>
                    <h2 id="announcement-highlights-heading" className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Megaphone className="size-4" aria-hidden />Announcement highlights
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">Pinned notices first, followed by the latest updates across all areas.</p>
                </div>
                {multiple && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={reducedMotion}
                        data-carousel-rotation
                        aria-label={reducedMotion ? "Auto-play disabled for reduced motion" : playing ? "Pause announcement auto-play" : "Start announcement auto-play"}
                        onClick={() => setPlaying((value) => !value)}
                    >
                        {playing && !reducedMotion ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
                        {reducedMotion ? "Auto-play off" : playing ? "Pause" : "Play"}
                    </Button>
                )}
            </div>
            <div ref={viewportRef} className="overflow-hidden" onPointerDown={() => setPlaying(false)}>
                <div className="flex touch-pan-y">
                    {items.map((item, index) => {
                        const badge = typeBadgeStyle[item.type];
                        return (
                            <article
                                key={item.id}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`${index + 1} of ${items.length}: ${item.title}`}
                                aria-hidden={index !== current}
                                inert={index !== current}
                                className="relative flex min-w-0 flex-[0_0_100%] flex-col border-l-4 border-l-hazard p-5 sm:p-7"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                                    {item.pinned && <span className="inline-flex items-center gap-1 text-xs font-semibold text-hazard-text"><Pin className="size-3" aria-hidden />Pinned advisory</span>}
                                    {item.area && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3.5" aria-hidden />{item.area}</span>}
                                </div>
                                <h3 className="mt-4 max-w-3xl text-xl font-bold leading-snug text-primary sm:text-2xl">{item.title}</h3>
                                <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{item.body}</p>
                                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                                    <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="size-3.5" aria-hidden />
                                        {item.publishedAt ? `Published ${new Date(item.publishedAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kuala_Lumpur" })}` : item.time}
                                    </p>
                                    <Button type="button" size="sm" onClick={() => onOpen(item.id)}>
                                        Read full announcement<ArrowRight className="size-3.5" aria-hidden />
                                    </Button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
            {multiple && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-5 py-3 sm:px-7">
                    <div className="flex items-center gap-1" role="group" aria-label="Choose a featured announcement">
                        {items.map((item, index) => (
                            <button
                                key={item.id}
                                type="button"
                                aria-label={`Show announcement ${index + 1}: ${item.title}`}
                                aria-current={index === current ? "true" : undefined}
                                onClick={() => navigate(index)}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <span className={cn("h-2 rounded-full transition-all motion-reduce:transition-none", index === current ? "w-6 bg-primary" : "w-2 bg-primary/25")} aria-hidden />
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="mr-1 text-xs tabular-nums text-muted-foreground" aria-live={autoPlaying ? "off" : "polite"} aria-atomic="true">{current + 1} / {items.length}</span>
                        <Button type="button" variant="outline" size="icon" aria-label="Previous featured announcement" onClick={() => navigate((current - 1 + items.length) % items.length)}><ChevronLeft aria-hidden /></Button>
                        <Button type="button" variant="outline" size="icon" aria-label="Next featured announcement" onClick={() => navigate((current + 1) % items.length)}><ChevronRight aria-hidden /></Button>
                    </div>
                </div>
            )}
        </section>
    );
}
