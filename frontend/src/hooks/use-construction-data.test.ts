import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeConstructionData } from "./use-construction-data";
import { createClosure, setClosureStatus } from "@/lib/admin/closures";
import { readSchedule } from "@/lib/admin/schedule";
import { markAllAnnouncementsRead, readAnnouncements } from "@/lib/admin/announcements";

describe("shared public construction refresh", () => {
    const cleanup: (() => void)[] = [];
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-02T00:00:00Z"));
        const storage = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
        vi.stubGlobal("document", new EventTarget());
        vi.stubGlobal("window", Object.assign(new EventTarget(), { setInterval, clearInterval }));
    });
    afterEach(() => {
        cleanup.splice(0).forEach((stop) => stop());
        vi.useRealTimers(); vi.unstubAllGlobals();
    });

    it("shares one clock and removes it after the final public view unsubscribes", () => {
        const stopFirst = subscribeConstructionData(vi.fn());
        const stopSecond = subscribeConstructionData(vi.fn());
        expect(vi.getTimerCount()).toBe(1);
        stopFirst(); expect(vi.getTimerCount()).toBe(1);
        stopSecond(); expect(vi.getTimerCount()).toBe(0);
    });

    it("refreshes on publication and status changes, but ignores unchanged data and read state", () => {
        const listener = vi.fn();
        cleanup.push(subscribeConstructionData(listener)); listener.mockClear();
        const closure = createClosure({
            scheduleId: readSchedule()[0].id, title: "Test closure", road: "Test road", area: "Komtar",
            reason: "Works", alternative: "", latitude: 5.4, longitude: 100.3,
            startAt: "2026-11-01T00:00:00Z", endAt: "2026-11-03T00:00:00Z", status: "active",
        }, "Admin");
        expect(listener).toHaveBeenCalledTimes(1);
        setClosureStatus(closure.id, "ended", "Admin");
        expect(listener).toHaveBeenCalledTimes(2);
        markAllAnnouncementsRead();
        window.dispatchEvent(new Event("focus"));
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it("refreshes time-dependent restrictions without an admin action", () => {
        const closure = createClosure({
            scheduleId: readSchedule()[0].id, title: "Short restriction", road: "Test road", area: "Komtar",
            reason: "Works", alternative: "", latitude: 5.4, longitude: 100.3,
            startAt: "2026-11-01T23:59:00Z", endAt: "2026-11-02T00:00:15Z", status: "active",
        }, "Admin");
        const listener = vi.fn();
        cleanup.push(subscribeConstructionData(listener)); listener.mockClear();
        expect(readAnnouncements().find((item) => item.sourceClosureId === closure.id)?.closureState).toBe("now");
        vi.advanceTimersByTime(30_000);
        expect(vi.getTimerCount()).toBe(1);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(readAnnouncements().find((item) => item.sourceClosureId === closure.id)?.closureState).toBe("ended");
    });
});
