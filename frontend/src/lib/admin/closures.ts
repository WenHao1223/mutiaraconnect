import closureData from "@/data/closures.json";
import { recordAudit } from "@/lib/admin/audit";
import { newId, readJson, writeJson } from "@/lib/admin/store";
import type { ClosureKind, ClosureStatus, RoadClosure } from "@/types/road-closure";

/**
 * MOCK CLOSURES & ACCESS NOTICES (frontend only, no backend). Seeded from data/closures.json,
 * then kept in localStorage. Road closures and business access info share one list; which
 * businesses are "affected" is worked out by distance at display time, not stored.
 * Replace with Supabase later.
 */
const CLOSURES_KEY = "mutiaraconnect.closures";
const seed = closureData as RoadClosure[];

const readAll = () => readJson<RoadClosure[]>(CLOSURES_KEY, seed);

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
    emergency?: string;
}

function create(kind: ClosureKind, input: NewClosureInput, actor: string): RoadClosure {
    const closure: RoadClosure = {
        id: newId(kind === "access" ? "AN" : "RC"),
        kind,
        ...input,
        createdBy: actor,
        createdAt: new Date().toISOString(),
    };
    writeJson(CLOSURES_KEY, [closure, ...readAll()]);
    return closure;
}

/** Sets a temporary road closure. */
export function createClosure(input: NewClosureInput, actor: string): RoadClosure {
    const closure = create("closure", input, actor);
    recordAudit({ actor, action: "closure_create", detail: `Set closure “${input.title}” (${input.road}).` });
    return closure;
}

/** Shares a piece of access information with businesses near a pinned location. */
export function createAccessInfo(input: Omit<BaseInput, "reason" | "status">, actor: string): RoadClosure {
    const notice = create("access", { ...input, road: "", reason: "", status: "active" }, actor);
    recordAudit({ actor, action: "business_notice", detail: `Shared access info “${input.title}”.` });
    return notice;
}

export function setClosureStatus(id: string, status: ClosureStatus, actor: string): void {
    const next = readAll().map((closure) => (closure.id === id ? { ...closure, status } : closure));
    writeJson(CLOSURES_KEY, next);
    recordAudit({ actor, action: "closure_status", detail: `Closure ${id} marked ${status}.` });
}
