import announcementsData from "@/data/announcements.json";
import { recordAudit } from "@/lib/admin/audit";
import { readClosureRecords } from "@/lib/admin/closureRecords";
import { readScheduleRecords, writeScheduleRecords } from "@/lib/admin/scheduleRecords";
import { newId, readJson, writeJson } from "@/lib/admin/store";
import { closureAnnouncementFields } from "@/lib/road/closureAnnouncement";
import type { Announcement } from "@/types/announcement";

/**
 * MOCK ANNOUNCEMENTS (frontend only, no backend). Seeded from data/announcements.json,
 * then kept in localStorage so admin-published items show up in the navbar bell
 * and public announcements page in real time. Replace with Supabase later.
 */
const ANNOUNCEMENTS_KEY =
    (import.meta.env.VITE_ANNOUNCEMENTS_STORAGE_KEY as string | undefined) ?? "mutiaraconnect.announcements.v2";
const READ_ANNOUNCEMENTS_KEY =
    (import.meta.env.VITE_ANNOUNCEMENTS_READ_STORAGE_KEY as string | undefined) ??
    "mutiaraconnect.announcements.read";
const ANNOUNCEMENTS_EVENT =
    (import.meta.env.VITE_ANNOUNCEMENTS_EVENT as string | undefined) ?? "mutiaraconnect:announcements-changed";

const seed = announcementsData as Announcement[];

/** Formal letters by announcement ID, matched by filename (letter-AN-101.pdf -> AN-101). */
const letterUrls: Record<string, string> = Object.fromEntries(
    Object.entries(import.meta.glob<string>("@/data/letter-*.pdf", { query: "?url", import: "default", eager: true }))
        .map(([path, url]) => [path.slice(path.lastIndexOf("/letter-") + "/letter-".length, -".pdf".length), url]),
);

/**
 * Saved lists can predate the seed cleanup and can hold URLs from an older build,
 * so repeated IDs are dropped and letter URLs are always resolved afresh.
 */
function readStoredAnnouncements(): Announcement[] {
    const seen = new Set<string>();
    return readJson<Announcement[]>(ANNOUNCEMENTS_KEY, seed)
        .filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        })
        .map((item) => ({ ...item, letterUrl: letterUrls[item.id] }));
}

export function notifyAnnouncementsChanged(): void {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_EVENT));
    }
}

/** Newest first. */
export function readAnnouncements(): Announcement[] {
    const closures = new Map(readClosureRecords().filter((item) => item.kind === "closure").map((item) => [item.id, item]));
    return readStoredAnnouncements().map((item) => {
        const closure = item.sourceClosureId ? closures.get(item.sourceClosureId) : undefined;
        return closure ? { ...item, ...closureAnnouncementFields(closure) } : item;
    });
}

/** Update existing advisories only; an explicitly deleted notice must not be recreated. */
export function syncClosureAnnouncement(closureId: string, actor: string): void {
    const closure = readClosureRecords().find((item) => item.id === closureId && item.kind === "closure");
    if (!closure) return;
    const current = readStoredAnnouncements();
    if (!current.some((item) => item.sourceClosureId === closureId)) return;
    const fields = closureAnnouncementFields(closure);
    writeJson(ANNOUNCEMENTS_KEY, current.map((item) => item.sourceClosureId === closureId
        ? { ...item, ...fields, updatedAt: new Date().toISOString() } : item));
    recordAudit({ actor, action: "announcement", detail: `Updated road closure advisory for ${closureId}.` });
}

export interface NewAnnouncementInput {
    title: string;
    body: string;
    type: Announcement["type"];
    area?: string;
    pinned?: boolean;
    sourceClosureId?: string;
}

function relativeTime(iso?: string): string {
    if (!iso) return "";
    const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const hours = Math.round(diffMinutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function publishAnnouncement(
    input: NewAnnouncementInput,
    actor: string,
    options: { notify?: boolean } = {},
): Announcement {
    // One generated notice per closure; ordinary manual bulletins are never deduplicated.
    if (input.sourceClosureId) {
        if (input.type !== "closure") throw new Error("A closure advisory must use the road closure category.");
        const existing = readAnnouncements().find((item) => item.sourceClosureId === input.sourceClosureId);
        if (existing) return existing;
    }
    const publishedAt = new Date().toISOString();
    const cleanedArea = input.area?.trim();
    const item: Announcement = {
        id: newId("AN"),
        title: input.title,
        body: input.body,
        type: input.type,
        ...(cleanedArea ? { area: cleanedArea } : {}),
        ...(input.pinned ? { pinned: true } : {}),
        publishedAt,
        time: relativeTime(publishedAt),
        createdBy: actor,
        ...(input.sourceClosureId ? { sourceClosureId: input.sourceClosureId } : {}),
    };
    const next = [item, ...readAnnouncements()];
    writeJson(ANNOUNCEMENTS_KEY, next);
    recordAudit({ actor, action: "announcement", detail: `Published “${input.title}”.` });
    if (options.notify !== false) notifyAnnouncementsChanged();
    return item;
}

export function toggleAnnouncementPin(id: string, actor: string): void {
    const current = readAnnouncements();
    const target = current.find((item) => item.id === id);
    if (!target) return;
    const nextPinned = !target.pinned;
    const next = current.map((item) => (item.id === id ? { ...item, pinned: nextPinned } : item));
    writeJson(ANNOUNCEMENTS_KEY, next);
    recordAudit({
        actor,
        action: "announcement",
        detail: `${nextPinned ? "Pinned" : "Unpinned"} announcement “${target.title}”.`,
    });
    notifyAnnouncementsChanged();
}

export function deleteAnnouncement(id: string, actor: string): void {
    const current = readAnnouncements();
    const target = current.find((item) => item.id === id);
    if (!target) return;
    const next = current.filter((item) => item.id !== id);
    writeJson(ANNOUNCEMENTS_KEY, next);
    const updatedAt = new Date().toISOString();
    const schedules = readScheduleRecords();
    if (schedules.some((item) => item.announcementIds?.includes(id))) {
        writeScheduleRecords(schedules.map((item) => item.announcementIds?.includes(id)
            ? { ...item, announcementIds: item.announcementIds.filter((linkedId) => linkedId !== id), updatedAt, updatedBy: actor }
            : item));
    }
    writeJson(READ_ANNOUNCEMENTS_KEY, readReadAnnouncementIds().filter((readId) => readId !== id));
    recordAudit({ actor, action: "announcement", detail: `Removed announcement “${target.title}”.` });
    notifyAnnouncementsChanged();
}

/** Read IDs of announcements marked as read on this device. */
export function readReadAnnouncementIds(): string[] {
    return readJson<string[]>(READ_ANNOUNCEMENTS_KEY, []);
}

export function markAnnouncementRead(id: string): string[] {
    const current = readReadAnnouncementIds();
    if (current.includes(id)) return current;
    const next = [...current, id];
    writeJson(READ_ANNOUNCEMENTS_KEY, next);
    notifyAnnouncementsChanged();
    return next;
}

export function markAnnouncementUnread(id: string): string[] {
    const current = readReadAnnouncementIds();
    const next = current.filter((item) => item !== id);
    writeJson(READ_ANNOUNCEMENTS_KEY, next);
    notifyAnnouncementsChanged();
    return next;
}

export function markAllAnnouncementsRead(ids?: string[]): string[] {
    const targetIds = ids ?? readAnnouncements().map((item) => item.id);
    const merged = Array.from(new Set([...readReadAnnouncementIds(), ...targetIds]));
    writeJson(READ_ANNOUNCEMENTS_KEY, merged);
    notifyAnnouncementsChanged();
    return merged;
}

/** Subscribe to any announcement list or read-state updates across components and tabs. */
export function subscribeAnnouncements(listener: () => void): () => void {
    if (typeof window === "undefined") {
        return () => {};
    }
    const handleStorage = (event: StorageEvent) => {
        if (!event.key || event.key === ANNOUNCEMENTS_KEY || event.key === READ_ANNOUNCEMENTS_KEY) {
            listener();
        }
    };
    window.addEventListener(ANNOUNCEMENTS_EVENT, listener);
    window.addEventListener("storage", handleStorage);
    return () => {
        window.removeEventListener(ANNOUNCEMENTS_EVENT, listener);
        window.removeEventListener("storage", handleStorage);
    };
}
