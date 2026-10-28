import { recordAudit } from "@/lib/admin/audit";
import { notifyAnnouncementsChanged, publishAnnouncement, syncClosureAnnouncement } from "@/lib/admin/announcements";
import { readClosureRecords, writeClosureRecords } from "@/lib/admin/closureRecords";
import { readSchedule, updateScheduleItem } from "@/lib/admin/schedule";
import { newId } from "@/lib/admin/store";
import { closureAnnouncementFields } from "@/lib/road/closureAnnouncement";
import type {
    ClosureExtent,
    ClosureHours,
    ClosureKind,
    ClosureStatus,
    RoadClosure,
    RoadPoint,
} from "@/types/road-closure";

/**
 * MOCK CLOSURES & ACCESS NOTICES (frontend only, no backend). Seeded from data/closures.json,
 * then kept in localStorage. Road closures and business access info share one list; which
 * businesses are "affected" is worked out by distance at display time, not stored.
 * Replace with Supabase later.
 */
const readAll = readClosureRecords;

/** All closures and access notices, newest start first. */
export function readClosures(): RoadClosure[] {
    return [...readAll()].sort((a, b) => b.startAt.localeCompare(a.startAt));
}

/** Closures that are planned or active right now. */
export function activeClosures(): RoadClosure[] {
    return readClosures().filter((closure) => closure.status !== "ended");
}

interface BaseInput {
    title: string;
    area: string;
    reason: string;
    alternative: string;
    latitude: number;
    longitude: number;
    startAt: string;
    endAt: string;
    status: ClosureStatus;
}

export interface NewClosureInput extends BaseInput {
    road: string;
    pedestrian?: string;
    extent?: ClosureExtent;
    hours?: ClosureHours;
    path?: RoadPoint[];
}

function create(kind: ClosureKind, input: NewClosureInput, actor: string): RoadClosure {
    const closure: RoadClosure = {
        id: newId(kind === "access" ? "AN" : "RC"),
        kind,
        ...input,
        createdBy: actor,
        createdAt: new Date().toISOString(),
    };
    writeClosureRecords([closure, ...readAll()]);
    return closure;
}

/** Publishes a temporary road closure and its public advisory under the selected schedule. */
export function createClosure(input: NewClosureInput & { scheduleId: string }, actor: string): RoadClosure {
    const { scheduleId, ...details } = input;
    if (!readSchedule().some((item) => item.id === scheduleId)) {
        throw new Error("Select a valid construction schedule.");
    }
    const start = Date.parse(details.startAt);
    const end = Date.parse(details.endAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        throw new Error("The closure end must be after its start.");
    }
    const closure = create("closure", details, actor);
    publishAnnouncement({
        ...closureAnnouncementFields(closure),
        sourceClosureId: closure.id,
    }, actor, { notify: false });
    setClosureSchedule(closure.id, scheduleId, actor);
    recordAudit({ actor, action: "closure_create", detail: `Set closure “${input.title}” (${input.road}).` });
    return closure;
}

/** Store the relationship on schedules, matching the existing schedule editor and public list. */
export function setClosureSchedule(id: string, scheduleId: string, actor: string): void {
    if (!readAll().some((closure) => closure.id === id && closure.kind === "closure")) {
        throw new Error("Road closure not found.");
    }
    const schedules = readSchedule();
    if (!schedules.some((item) => item.id === scheduleId)) {
        throw new Error("Select a valid construction schedule.");
    }
    const target = schedules.find((item) => item.id === scheduleId)!;
    updateScheduleItem(scheduleId, { closureIds: [...new Set([...(target.closureIds ?? []), id])] }, actor, { notify: false });
    // Notify readers only after the closure, announcement and schedule links are all saved.
    notifyAnnouncementsChanged();
}

/** Shares a piece of access information with businesses near a pinned location. */
export function createAccessInfo(input: Omit<BaseInput, "reason" | "status">, actor: string): RoadClosure {
    const notice = create("access", { ...input, road: "", reason: "", status: "active" }, actor);
    recordAudit({ actor, action: "business_notice", detail: `Shared access info “${input.title}”.` });
    return notice;
}

export function setClosureStatus(id: string, status: ClosureStatus, actor: string): void {
    const all = readAll();
    const existing = all.find((closure) => closure.id === id);
    if (!existing) throw new Error("Road closure not found.");
    if (existing.status === status) return;
    const next = all.map((closure) => (closure.id === id ? { ...closure, status } : closure));
    writeClosureRecords(next);
    syncClosureAnnouncement(id, actor);
    recordAudit({ actor, action: "closure_status", detail: `Closure ${id} marked ${status}.` });
    notifyAnnouncementsChanged();
}
