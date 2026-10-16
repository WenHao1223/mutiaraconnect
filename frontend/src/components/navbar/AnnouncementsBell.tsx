import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AnnouncementItem from "@/components/navbar/AnnoucementItem";
import { useSettings } from "@/lib/settings/settings";
import { PATHS } from "@/routes";
import type { Announcement } from "@/types/announcement";

export default function AnnouncementsBell({ items }: { items: Announcement[] }) {
    const [readIds, setReadIds] = useState<string[]>([]);
    const { notificationsEnabled } = useSettings();
    const unreadCount = items.filter((item) => !readIds.includes(item.id)).length;
    // Paused notifications hide the badge; the list itself is still readable.
    const badgeCount = notificationsEnabled ? unreadCount : 0;

    const markRead = (id: string) =>
        setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={badgeCount > 0 ? `Announcements, ${badgeCount} unread` : "Announcements"}
                >
                    <Bell className="size-5" />
                    {badgeCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-hazard text-[10px] font-bold text-hazard-foreground">
                            {badgeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">Announcements</h2>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={() => setReadIds(items.map((item) => item.id))}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <ul className="max-h-80 divide-y overflow-y-auto">
                    {items.length === 0 && (
                        <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No announcements yet.
                        </li>
                    )}
                    {items.map((item) => (
                        <li key={item.id}>
                            <AnnouncementItem
                                announcement={item}
                                isUnread={!readIds.includes(item.id)}
                                onRead={() => markRead(item.id)}
                            />
                        </li>
                    ))}
                </ul>

                <div className="border-t p-2">
                    <Button asChild variant="ghost" size="sm" className="w-full text-primary">
                        <Link to={PATHS.announcements}>View all announcements</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}