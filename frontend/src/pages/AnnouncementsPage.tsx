import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Bell,
    BellOff,
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

type TypeFilter = "all" | Announcement["type"] | "unread" | "pinned";

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const { notificationsEnabled, setNotificationsEnabled } = useSettings();

    const [items, setItems] = useState<Announcement[]>(() => readAnnouncements());
    const [readIds, setReadIds] = useState<string[]>(() => readReadAnnouncementIds());
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [areaFilter, setAreaFilter] = useState<string>("all");
    const [query, setQuery] = useState<string>("");

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
    }, [sortedItems, readIds, typeFilter, areaFilter, query]);

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
                {/* Filter & Search Bar */}
                <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center">
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

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="w-full sm:w-44">
                            <Select value={areaFilter} onValueChange={setAreaFilter}>
                                <SelectTrigger aria-label="Filter by station area">
                                    <SelectValue placeholder="All station areas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All station areas</SelectItem>
                                    {areas.map((area) => (
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
                                placeholder="Search announcements..."
                                className="pl-9"
                                aria-label="Search announcements"
                            />
                        </div>
                    </div>
                </div>

                {/* Announcements List */}
                {filteredItems.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
                            <p className="mt-2 text-sm font-semibold">No matching announcements</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Try adjusting your category tab, station area filter, or search keywords.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => {
                                    setTypeFilter("all");
                                    setAreaFilter("all");
                                    setQuery("");
                                }}
                            >
                                Reset filters
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredItems.map((item) => {
                            const isUnread = !readIds.includes(item.id);
                            const badge = typeBadgeStyle[item.type];

                            return (
                                <Card
                                    key={item.id}
                                    className={cn(
                                        "transition",
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
            </div>
        </div>
    );
}
