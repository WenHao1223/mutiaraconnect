import { useEffect, useReducer, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, Navigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck, ChevronLeft, ChevronRight, Megaphone, Settings } from "lucide-react";
import NotificationItem from "@/components/navbar/NotificationItem";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/auth";
import { markAllNotificationsRead, notificationsFor, readNotificationIds, subscribeNotifications } from "@/lib/notifications";
import { useSettings } from "@/lib/settings/settings";
import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

const NOTIFICATIONS_PER_PAGE = 5;

export default function ProfileNotificationsPage() {
    const { user } = useAuth();
    if (!user) return <Navigate to={PATHS.login} state={{ from: PATHS.profileNotifications }} replace />;
    return <NotificationInbox key={user.email ?? user.ic ?? user.name} user={user} />;
}

function NotificationInbox({ user }: { user: AppUser }) {
    const [filter, setFilter] = useState("all");
    const [pagination, setPagination] = useState({ filter: "all", page: 0 });
    const listStartRef = useRef<HTMLDivElement>(null);
    const listSummaryRef = useRef<HTMLParagraphElement>(null);
    const [, refresh] = useReducer((version: number) => version + 1, 0);
    const { notificationsEnabled } = useSettings();
    useEffect(() => subscribeNotifications(refresh), []);

    const recipient = user.email ?? user.ic ?? user.name;
    const items = notificationsFor(recipient);
    const readIds = new Set(readNotificationIds(recipient));
    const unreadCount = items.filter((item) => !readIds.has(item.id)).length;
    const visible = filter === "unread" ? items.filter((item) => !readIds.has(item.id)) : items;
    const pageCount = Math.ceil(visible.length / NOTIFICATIONS_PER_PAGE);
    const currentPage = pagination.filter === filter
        ? Math.min(pagination.page, Math.max(0, pageCount - 1)) : 0;
    if (pagination.filter !== filter || pagination.page !== currentPage) {
        setPagination({ filter, page: currentPage });
    }
    const pageStart = currentPage * NOTIFICATIONS_PER_PAGE;
    const visibleItems = visible.slice(pageStart, pageStart + NOTIFICATIONS_PER_PAGE);

    function changePage(page: number) {
        flushSync(() => setPagination({ filter, page }));
        listSummaryRef.current?.focus({ preventScroll: true });
        listStartRef.current?.scrollIntoView({
            block: "start",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-4xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Bell className="size-3.5" aria-hidden />Your account</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">My Notifications</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Follow your tickets, business applications, premise notices and account updates.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="rounded-full border bg-card px-3 py-1 text-xs font-medium">{unreadCount} unread · {items.length} total</span>
                        <Button asChild variant="ghost" size="sm"><Link to={PATHS.profileSettings}><Settings aria-hidden />Notification preferences</Link></Button>
                    </div>
                </div>
            </section>
            <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:py-8">
                {!notificationsEnabled && <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground"><BellOff className="mt-0.5 size-4 shrink-0" aria-hidden /><p>Unread badges are paused. You can still read and manage your notifications here.</p></div>}
                <Tabs value={filter} onValueChange={setFilter}>
                    <div ref={listStartRef} className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3">
                        <TabsList aria-label="Filter notifications">
                            <TabsTrigger value="all">All ({items.length})</TabsTrigger>
                            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                        </TabsList>
                        <Button type="button" variant="outline" size="sm" disabled={unreadCount === 0} onClick={() => markAllNotificationsRead(recipient)}><CheckCheck aria-hidden />Mark all as read</Button>
                    </div>
                    <p ref={listSummaryRef} tabIndex={-1} className="mt-4 text-xs text-muted-foreground" role="status">
                        {visible.length > 0
                            ? `Showing ${pageStart + 1}–${pageStart + visibleItems.length} of ${visible.length} ${filter === "unread" ? "unread " : ""}${visible.length === 1 ? "notification" : "notifications"}`
                            : "No notifications to show"}
                    </p>
                    {["all", "unread"].map((value) => (
                        <TabsContent key={value} value={value} className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
                            {visible.length > 0 ? (
                                <ul className="divide-y" aria-label={value === "unread" ? "Unread account notifications" : "All account notifications"}>
                                    {visibleItems.map((item) => <li key={item.id}><NotificationItem notification={item} user={user} isUnread={!readIds.has(item.id)} /></li>)}
                                </ul>
                            ) : (
                                <div className="px-6 py-14 text-center">
                                    {items.length > 0 ? <CheckCheck className="mx-auto size-8 text-primary" aria-hidden /> : <Bell className="mx-auto size-8 text-muted-foreground" aria-hidden />}
                                    <h2 className="mt-3 text-base font-semibold">{items.length > 0 ? "You're all caught up" : "No notifications yet"}</h2>
                                    <p className="mt-2 text-sm text-muted-foreground">{items.length > 0 ? "You have read all your account updates." : "Updates about your tickets, applications and premises will appear here."}</p>
                                    {items.length > 0 && <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setFilter("all")}>View all notifications</Button>}
                                </div>
                            )}
                        </TabsContent>
                    ))}
                    {pageCount > 1 && (
                        <nav aria-label="Notification pages" className="mt-5 flex items-center justify-between gap-2 border-t pt-5">
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
                </Tabs>
                {items.some((item) => item.example) && <p className="text-xs leading-relaxed text-muted-foreground">Items labelled “Example scenario” demonstrate possible updates. They do not create matching applications, support requests or account changes.</p>}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-4 sm:px-6">
                    <div><h2 className="text-sm font-semibold">Looking for public announcements?</h2><p className="mt-1 text-xs text-muted-foreground">Authority advisories and construction notices are available to everyone.</p></div>
                    <Button asChild variant="outline" size="sm"><Link to={PATHS.announcements}><Megaphone aria-hidden />Announcements</Link></Button>
                </div>
            </div>
        </div>
    );
}
