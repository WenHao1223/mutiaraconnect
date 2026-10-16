import announcementData from "@/data/announcements.json";
import { recordAudit } from "@/lib/admin/audit";
import { newId, readJson, writeJson } from "@/lib/admin/store";
import type { Announcement } from "@/types/announcement";

/**
 * MOCK ANNOUNCEMENTS (frontend only, no backend). Seeded from data/announcements.json,
 * then kept in localStorage. Replace with Supabase later.
 */
const ANNOUNCEMENTS_KEY = "mutiaraconnect.announcements";
const seed = announcementData as Announcement[];

/** Newest first. */
export function readAnnouncements(): Announcement[] {
    return readJson<Announcement[]>(ANNOUNCEMENTS_KEY, seed);
}

export interface NewAnnouncementInput {
    title: string;
    body: string;
    type: Announcement["type"];
}

/** Human-friendly "time ago" label for the bell. */
function relativeTime(iso: string): string {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function publishAnnouncement(input: NewAnnouncementInput, actor: string): Announcement {
    const now = new Date().toISOString();
    const announcement: Announcement = {
        id: newId("ANN"),
        title: input.title,
        body: input.body,
        type: input.type,
        time: relativeTime(now),
        publishedAt: now,
        createdBy: actor,
    };
    writeJson(ANNOUNCEMENTS_KEY, [announcement, ...readJson<Announcement[]>(ANNOUNCEMENTS_KEY, seed)]);
    recordAudit({ actor, action: "announcement", detail: `Published “${input.title}”.` });
    return announcement;
}
