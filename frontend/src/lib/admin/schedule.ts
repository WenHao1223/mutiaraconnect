import scheduleData from "@/data/construction-schedule.json";
import { recordAudit } from "@/lib/admin/audit";
import { newId, readJson, writeJson } from "@/lib/admin/store";
import { tone } from "@/lib/tones";
import type { ConstructionSchedule, ScheduleStatus } from "@/types/schedule";

/**
 * MOCK CONSTRUCTION SCHEDULE (frontend only, no backend). Seeded from
 * data/construction-schedule.json, then kept in localStorage. Replace with Supabase later.
 */
const SCHEDULE_KEY = "mutiaraconnect.construction-schedule";
const seed = scheduleData as ConstructionSchedule[];

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

/** Schedule items, soonest start first. */
export function readSchedule(): ConstructionSchedule[] {
    return [...readJson<ConstructionSchedule[]>(SCHEDULE_KEY, seed)].sort((a, b) =>
        a.startsAt.localeCompare(b.startsAt),
    );
}

export interface NewScheduleInput {
    title: string;
    description: string;
    area: string;
    startsAt: string;
    endsAt: string;
    status: ScheduleStatus;
}

export function createScheduleItem(input: NewScheduleInput, actor: string): ConstructionSchedule {
    const item: ConstructionSchedule = {
        id: newId("CS"),
        ...input,
        updatedBy: actor,
        updatedAt: new Date().toISOString(),
    };
    writeJson(SCHEDULE_KEY, [...readJson<ConstructionSchedule[]>(SCHEDULE_KEY, seed), item]);
    recordAudit({ actor, action: "schedule_create", detail: `Added schedule item “${input.title}”.` });
    return item;
}

export function updateScheduleItem(
    id: string,
    patch: Partial<Pick<ConstructionSchedule, "status" | "endsAt" | "description">>,
    actor: string,
): void {
    const all = readJson<ConstructionSchedule[]>(SCHEDULE_KEY, seed);
    const next = all.map((item) =>
        item.id === id
            ? { ...item, ...patch, updatedBy: actor, updatedAt: new Date().toISOString() }
            : item,
    );
    writeJson(SCHEDULE_KEY, next);
    recordAudit({ actor, action: "schedule_update", detail: `Updated schedule item ${id}.` });
}
