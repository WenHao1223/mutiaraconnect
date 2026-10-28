import { recordAudit } from "@/lib/admin/audit";
import { notifyAnnouncementsChanged, readAnnouncements } from "@/lib/admin/announcements";
import { readClosureRecords } from "@/lib/admin/closureRecords";
import { normalizeSchedule, readScheduleRecords, writeScheduleRecords } from "@/lib/admin/scheduleRecords";
import { newId } from "@/lib/admin/store";
import { tone } from "@/lib/tones";
import type { ConstructionSchedule, ScheduleStatus } from "@/types/schedule";

/**
 * MOCK CONSTRUCTION SCHEDULE (frontend only, no backend). Seeded from
 * data/construction-schedule.json, then kept in localStorage. Replace with Supabase later.
 */
export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
    ongoing: "Ongoing Works",
    upcoming: "Upcoming",
    completed: "Completed",
};

export const scheduleStatusTone: Record<ScheduleStatus, string> = {
    upcoming: tone.info,
    ongoing: tone.warning,
    completed: tone.success,
};

/** Schedule items, soonest start first, with missing relationship arrays defaulted to empty. */
export function readSchedule(): ConstructionSchedule[] {
    return readScheduleRecords()
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Save ownership and its dependent advisory links together, regardless of which admin form called us. */
function saveSchedule(all: ConstructionSchedule[], edited: ConstructionSchedule, actor: string): void {
    const roadIds = new Set(readClosureRecords().filter((item) => item.kind === "closure").map((item) => item.id));
    const owned = new Set((edited.closureIds ?? []).filter((id) => roadIds.has(id)));
    const previous = all.find((item) => item.id === edited.id);
    if (previous?.closureIds?.some((id) => roadIds.has(id) && !owned.has(id))) {
        throw new Error("Reassign road closures to another schedule before removing their links.");
    }
    const generated = readAnnouncements().filter((item) => item.sourceClosureId);
    const generatedIds = new Set(generated.map((item) => item.id));
    const candidates = previous ? all.map((item) => item.id === edited.id ? edited : item) : [...all, edited];
    const updatedAt = new Date().toISOString();
    const next = candidates.map((item) => {
        const closureIds = item.id === edited.id ? item.closureIds ?? []
            : (item.closureIds ?? []).filter((id) => !owned.has(id));
        const announcementIds = [...new Set([
            ...(item.announcementIds ?? []).filter((id) => !generatedIds.has(id)),
            ...generated.filter((notice) => closureIds.includes(notice.sourceClosureId!)).map((notice) => notice.id),
        ])];
        const changed = JSON.stringify(closureIds) !== JSON.stringify(item.closureIds ?? [])
            || JSON.stringify(announcementIds) !== JSON.stringify(item.announcementIds ?? []);
        return normalizeSchedule({ ...item, closureIds, announcementIds,
            ...(changed ? { updatedAt, updatedBy: actor } : {}),
        });
    });
    writeScheduleRecords(next);
}

export interface NewScheduleInput
    extends Pick<ConstructionSchedule, "stationIds" | "closureIds" | "announcementIds"> {
    title: string;
    description: string;
    area: string;
    startsAt: string;
    endsAt: string;
    status: ScheduleStatus;
}

export function createScheduleItem(input: NewScheduleInput, actor: string): ConstructionSchedule {
    const item = normalizeSchedule({
        id: newId("CS"),
        ...input,
        updatedBy: actor,
        updatedAt: new Date().toISOString(),
    });
    saveSchedule(readSchedule(), item, actor);
    recordAudit({ actor, action: "schedule_create", detail: `Added schedule item “${input.title}”.` });
    notifyAnnouncementsChanged();
    return readSchedule().find((saved) => saved.id === item.id)!;
}

export function updateScheduleItem(
    id: string,
    patch: Partial<NewScheduleInput>,
    actor: string,
    options: { notify?: boolean } = {},
): void {
    const all = readSchedule();
    const existing = all.find((item) => item.id === id);
    if (!existing) throw new Error("Construction schedule not found.");
    saveSchedule(all, normalizeSchedule({ ...existing, ...patch, updatedBy: actor, updatedAt: new Date().toISOString() }), actor);
    recordAudit({ actor, action: "schedule_update", detail: `Updated schedule item ${id}.` });
    if (options.notify !== false) notifyAnnouncementsChanged();
}
