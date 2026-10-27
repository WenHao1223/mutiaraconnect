import { useEffect, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import NotificationItem from "@/components/navbar/NotificationItem";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markAllNotificationsRead, notificationsFor, readNotificationIds, subscribeNotifications } from "@/lib/notifications";
import { useSettings } from "@/lib/settings/settings";
import { PATHS } from "@/routes";
import type { AppUser } from "@/types/user";

const PREVIEW_LIMIT = 5;

export default function NotificationsBell({ user }: { user: AppUser }) {
    const [open, setOpen] = useState(false);
    const [, refresh] = useReducer((version: number) => version + 1, 0);
    const { notificationsEnabled } = useSettings();
    useEffect(() => subscribeNotifications(refresh), []);

    // Read using the current identity on every render so switching accounts cannot reuse a feed.
    const recipient = user.email ?? user.ic ?? user.name;
    const items = notificationsFor(recipient);
    const readIds = new Set(readNotificationIds(recipient));
    const unreadCount = items.filter((item) => !readIds.has(item.id)).length;
    const badgeCount = notificationsEnabled ? unreadCount : 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" title="My notifications"
                    aria-label={badgeCount ? `My notifications, ${badgeCount} unread` : "My notifications"}>
                    <Bell className="size-5" aria-hidden />
                    {badgeCount > 0 && <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hazard px-1 text-[10px] font-bold text-hazard-foreground">{badgeCount > 99 ? "99+" : badgeCount}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] overflow-hidden p-0">
                <div className="border-b px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold">My notifications</h2>
                        <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Personal updates for your account.</p>
                    {!notificationsEnabled && <p className="mt-1 text-xs text-muted-foreground">Unread badge paused. Updates are still saved here.</p>}
                    {unreadCount > 0 && <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-0 text-primary" onClick={() => markAllNotificationsRead(recipient)}><CheckCheck aria-hidden />Mark all as read</Button>}
                </div>
                <ul className="max-h-[min(60dvh,28rem)] divide-y overflow-y-auto overscroll-contain" aria-label="Recent account notifications">
                    {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet. Your account updates will appear here.</li>}
                    {items.slice(0, PREVIEW_LIMIT).map((item) => (
                        <li key={item.id}><NotificationItem notification={item} user={user} isUnread={!readIds.has(item.id)} compact onOpen={() => setOpen(false)} /></li>
                    ))}
                </ul>
                <div className="border-t p-2">
                    <Button asChild variant="ghost" size="sm" className="w-full text-primary">
                        <Link to={PATHS.profileNotifications} onClick={() => setOpen(false)}>View all notifications</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
