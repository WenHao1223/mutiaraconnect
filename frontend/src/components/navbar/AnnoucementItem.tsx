import { MapPin, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Announcement } from "@/types/announcement";

const typeStyles: Record<Announcement["type"], { label: string; className: string }> = {
    closure: { label: "Road closure", className: "bg-destructive/10 text-destructive" },
    construction: { label: "Construction", className: "bg-hazard/20 text-amber-900" },
    general: { label: "General", className: "bg-info/10 text-info" },
};

interface AnnouncementItemProps {
    announcement: Announcement;
    isUnread: boolean;
    onRead: () => void;
}

export default function AnnouncementItem({ announcement, isUnread, onRead }: AnnouncementItemProps) {
    const style = typeStyles[announcement.type];

    return (
        <button
            type="button"
            className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-accent"
            onClick={onRead}
        >
            <span className="flex flex-wrap items-center gap-1.5">
                {announcement.pinned && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-hazard/25 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                        <Pin className="size-2.5" aria-hidden /> Pinned
                    </span>
                )}
                <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", style.className)}>
                    {style.label}
                </span>
                {announcement.area && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <MapPin className="size-2.5" aria-hidden />
                        {announcement.area}
                    </span>
                )}
                <span className="text-xs text-muted-foreground">{announcement.time}</span>
                {isUnread && <span className="ml-auto size-2 shrink-0 rounded-full bg-hazard" aria-label="Unread" />}
            </span>
            <span className={cn("text-sm", isUnread ? "font-semibold" : "font-medium")}>
                {announcement.title}
            </span>
            <span className="line-clamp-2 text-xs text-muted-foreground">{announcement.body}</span>
        </button>
    );
}
