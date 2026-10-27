import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AnnouncementItem from "@/components/navbar/AnnoucementItem";
import {
    markAllAnnouncementsRead,
    markAnnouncementRead,
    readReadAnnouncementIds,
    subscribeAnnouncements,
} from "@/lib/admin/announcements";
import { useSettings } from "@/lib/settings/settings";
import { PATHS } from "@/routes";
import type { Announcement } from "@/types/announcement";

export default function AnnouncementsBell({ items }: { items: Announcement[] }) {
    const [open, setOpen] = useState(false);
    const [readIds, setReadIds] = useState<string[]>(() => readReadAnnouncementIds());
    const { notificationsEnabled } = useSettings();
    const navigate = useNavigate();

    useEffect(() => {
        return subscribeAnnouncements(() => {
            setReadIds(readReadAnnouncementIds());
        });
    }, []);

    const unreadCount = items.filter((item) => !readIds.includes(item.id)).length;
    // Paused notifications hide the badge; the list itself is still readable.
    const badgeCount = notificationsEnabled ? unreadCount : 0;

    const handleReadItem = (id: string) => {
        setReadIds(markAnnouncementRead(id));
        setOpen(false);
        navigate(PATHS.announcements);
    };

    const handleMarkAllRead = () => {
        setReadIds(markAllAnnouncementsRead(items.map((item) => item.id)));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    title="Public announcements"
                    aria-label={badgeCount > 0 ? `Announcements, ${badgeCount} unread` : "Announcements"}
                >
                    <Megaphone className="size-5" aria-hidden />
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
                            onClick={handleMarkAllRead}
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
                                onRead={() => handleReadItem(item.id)}
                            />
                        </li>
                    ))}
                </ul>

                <div className="border-t p-2">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-full text-primary"
                        onClick={() => setOpen(false)}
                    >
                        <Link to={PATHS.announcements}>View all announcements</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
