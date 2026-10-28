import { useSyncExternalStore } from "react";
import { readAnnouncements, subscribeAnnouncements } from "@/lib/admin/announcements";
import { readClosures } from "@/lib/admin/closures";
import { readSchedule } from "@/lib/admin/schedule";
import { timeStatus } from "@/lib/road/closureDisplay";

function readData() {
    const closures = readClosures();
    return {
        closures,
        schedules: readSchedule(),
        announcements: readAnnouncements(),
        closureStates: Object.fromEntries(closures.map((item) => [item.id, timeStatus(item).state])),
    };
}

let snapshot: ReturnType<typeof readData> | undefined;
let signature = "";
const listeners = new Set<() => void>();
let stop: (() => void) | undefined;

function refresh() {
    const next = readData();
    const nextSignature = JSON.stringify(next);
    if (signature === nextSignature) return;
    snapshot = next;
    signature = nextSignature;
    listeners.forEach((listener) => listener());
}

function getSnapshot() {
    if (!snapshot) {
        snapshot = readData();
        signature = JSON.stringify(snapshot);
    }
    return snapshot;
}

/** One shared clock keeps overnight restrictions and expired records fresh across all public views. */
export function subscribeConstructionData(listener: () => void) {
    listeners.add(listener);
    if (!stop) {
        const unsubscribe = subscribeAnnouncements(refresh);
        window.addEventListener("storage", refresh);
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        const timer = window.setInterval(refresh, 30_000);
        stop = () => {
            unsubscribe();
            window.removeEventListener("storage", refresh);
            window.removeEventListener("focus", refresh);
            document.removeEventListener("visibilitychange", refresh);
            window.clearInterval(timer);
        };
    }
    refresh();
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            stop?.();
            stop = undefined;
        }
    };
}

export function useConstructionData() {
    return useSyncExternalStore(subscribeConstructionData, getSnapshot);
}
