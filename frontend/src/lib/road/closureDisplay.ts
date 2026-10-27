import { distanceInKm } from "@/lib/maps/geo";
import type { Coordinates } from "@/lib/maps/maps";
import { tone } from "@/lib/tones";
import type { ClosureHours, RoadClosure } from "@/types/road-closure";

/*
 * One vocabulary for road closures, used on cards, tabs, the map key and the admin form:
 *   how much  -> "Fully closed" / "Partially closed"
 *   when      -> "Closed now" / "Closing later" / "Upcoming"
 */

/** When a closure affects the road: blocked at this moment, open now but closing later today, not started, or over. */
export type TimeState = "now" | "later" | "upcoming" | "ended";

export const TIME_LABEL: Record<TimeState, string> = {
    now: "Closed now",
    later: "Closing later",
    upcoming: "Upcoming",
    ended: "Reopened",
};

/** Badge colours for each time state, used by the admin closure list. Shared tones, like every badge. */
export const TIME_TONE: Record<TimeState, string> = {
    now: tone.danger,
    later: tone.info,
    upcoming: tone.info,
    ended: tone.neutral,
};

export const EXTENT_LABEL = { full: "Fully closed", partial: "Partially closed" } as const;

/** Map line colours: red/orange while blocked, faded blue while not blocked yet, harbour blue for a planned route. */
export const LINE_COLOR = {
    full: "#dc2626",
    partial: "#f97316",
    notYet: "#0284c7",
    route: "#0b4f6c",
} as const;

const DAY_MS = 86_400_000;

const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short" });

const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

/** "23:00" -> "11pm", "09:30" -> "9:30am". */
export function formatTime(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const suffix = h < 12 ? "am" : "pm";
    const hour = h % 12 || 12;
    return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

function inHours(hours: ClosureHours, now: Date): boolean {
    const minute = now.getHours() * 60 + now.getMinutes();
    const from = toMinutes(hours.from);
    const to = toMinutes(hours.to);
    // Overnight windows (23:00–05:00) wrap past midnight.
    return from < to ? minute >= from && minute < to : minute >= from || minute < to;
}

/** "11pm – 5am nightly", "9am – 5pm daily" or "All day". */
export function hoursLabel(hours?: ClosureHours): string {
    if (!hours) return "All day";
    const overnight = toMinutes(hours.to) <= toMinutes(hours.from);
    return `${formatTime(hours.from)} – ${formatTime(hours.to)} ${overnight ? "nightly" : "daily"}`;
}

/** True for overnight or evening work, so the page can show a moon instead of a clock. */
export const isNightWork = (hours?: ClosureHours) =>
    !!hours && (toMinutes(hours.to) <= toMinutes(hours.from) || toMinutes(hours.from) >= 19 * 60);

export const extentOf = (closure: RoadClosure) => closure.extent ?? "full";

/**
 * The one title format for closures: the road, then any qualifiers in brackets, e.g.
 * "Jalan Penang (near Komtar, night only)". Night work adds "night only"; other set hours add "set hours".
 */
export function closureTitle(road: string, detail: string, hours?: ClosureHours): string {
    const qualifiers = [
        detail.trim(),
        hours ? (isNightWork(hours) ? "night only" : "set hours") : "",
    ].filter(Boolean);
    return qualifiers.length > 0 ? `${road.trim()} (${qualifiers.join(", ")})` : road.trim();
}

/** Not started yet: its start date is still ahead. */
export const isUpcoming = (closure: RoadClosure, now = new Date()) =>
    closure.status !== "ended" && new Date(closure.startAt) > now;

/** Past its end date, even if an admin hasn't marked it ended yet. */
export const isPastEnd = (closure: RoadClosure, now = new Date()) => new Date(closure.endAt) < now;

/**
 * Which time state a closure is in right now. A closure past its end date counts as ended, so a
 * forgotten status never leaves a reopened road showing as closed.
 */
export function timeStatus(closure: RoadClosure, now = new Date()): { state: TimeState } {
    if (closure.status === "ended" || isPastEnd(closure, now)) return { state: "ended" };
    if (isUpcoming(closure, now)) return { state: "upcoming" };
    if (!closure.hours || inHours(closure.hours, now)) return { state: "now" };
    return { state: "later" };
}

/** One line combining how much and when: "Fully closed now", "Partially closed from 10pm", "Fully closed from 1 Nov". */
export function headline(closure: RoadClosure, now = new Date()): string {
    const extent = EXTENT_LABEL[extentOf(closure)];
    const { state } = timeStatus(closure, now);
    if (state === "now") return `${extent} now`;
    if (state === "later" && closure.hours)
        return `${extent} from ${formatTime(closure.hours.from)}`;
    if (state === "upcoming") return `${extent} from ${shortDate(closure.startAt)}`;
    return `Reopened ${shortDate(closure.endAt)}`;
}

/** "12 days left" while running, "In 9 days" before it starts. */
export function countdown(closure: RoadClosure, now = new Date()): string | undefined {
    const { state } = timeStatus(closure, now);
    if (state === "ended") return undefined;
    if (state === "upcoming") {
        const days = Math.ceil((new Date(closure.startAt).getTime() - now.getTime()) / DAY_MS);
        return days <= 0 ? "Starts today" : days === 1 ? "Tomorrow" : `In ${days} days`;
    }
    // Still running here, so the end is in the future and at least one day is left.
    const days = Math.ceil((new Date(closure.endAt).getTime() - now.getTime()) / DAY_MS);
    return days === 1 ? "Last day" : `${days} days left`;
}

/** Every point of a closure's drawn road, or its pin if it has none. */
export const closurePoints = (closure: RoadClosure): Coordinates[] =>
    closure.path && closure.path.length > 0 ? closure.path : [closure];

/** Distance from a point to the nearest part of the closed road (its drawn path, or its pin). */
export function distanceToClosure(point: Coordinates, closure: RoadClosure): number {
    return Math.min(...closurePoints(closure).map((node) => distanceInKm(point, node)));
}

/** Colour for the closure's line and card accent: red/orange when blocked now, blue otherwise. */
export function closureColor(closure: RoadClosure, now = new Date()): string {
    return timeStatus(closure, now).state === "now"
        ? LINE_COLOR[extentOf(closure)]
        : LINE_COLOR.notYet;
}
