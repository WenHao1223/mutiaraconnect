import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publishAnnouncement, readAnnouncements, subscribeAnnouncements } from "./announcements";
import { createAccessInfo, createClosure, readClosures, setClosureSchedule } from "./closures";
import { readSchedule } from "./schedule";

const details = {
    title: "Jalan Test (night only)", road: "Jalan Test", area: "Komtar",
    reason: "Foundation piling", alternative: "", pedestrian: "Use the covered walkway",
    latitude: 5.41, longitude: 100.33,
    startAt: "2026-11-01T23:00:00+08:00", endAt: "2026-11-15T05:00:00+08:00",
    status: "active" as const, extent: "partial" as const,
    hours: { from: "23:00", to: "05:00" },
};

describe("automatic road closure publication", () => {
    beforeEach(() => {
        const storage = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
        vi.stubGlobal("window", new EventTarget());
    });
    afterEach(() => vi.unstubAllGlobals());

    it("creates a closure-category advisory and links both records to the selected schedule", () => {
        const schedule = readSchedule()[0];
        const closure = createClosure({ ...details, scheduleId: schedule.id }, "Admin");
        const notice = readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        expect(notice).toMatchObject({ type: "closure", area: details.area, createdBy: "Admin" });
        expect(notice.pinned).not.toBe(true);
        for (const value of [details.road, details.reason, details.pedestrian, "Partially closed", "nightly", "MYT", "11:00 pm", "5:00 am"]) {
            expect(notice.body.toLowerCase()).toContain(value.toLowerCase());
        }
        const saved = readSchedule().find((item) => item.id === schedule.id)!;
        expect(saved.closureIds).toContain(closure.id);
        expect(saved.announcementIds).toContain(notice.id);
        expect(readClosures().find((item) => item.id === closure.id)?.startAt).toBe(details.startAt);
    });

    it("notifies subscribers only when both records and schedule links can be read", () => {
        const snapshots: boolean[] = [];
        const unsubscribe = subscribeAnnouncements(() => {
            const notice = readAnnouncements().find((item) => item.sourceClosureId);
            snapshots.push(Boolean(notice && readClosures().some((item) => item.id === notice.sourceClosureId)
                && readSchedule().some((item) => item.closureIds?.includes(notice.sourceClosureId!) && item.announcementIds?.includes(notice.id))));
        });
        createClosure({ ...details, scheduleId: readSchedule()[0].id }, "Admin");
        unsubscribe();
        expect(snapshots).toEqual([true]);
    });

    it("does not duplicate generated notices or links when publication or assignment is repeated", () => {
        const scheduleId = readSchedule()[0].id;
        const closure = createClosure({ ...details, scheduleId }, "Admin");
        const notice = readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        const again = publishAnnouncement({ title: notice.title, body: notice.body, type: "closure", sourceClosureId: closure.id }, "Admin");
        setClosureSchedule(closure.id, scheduleId, "Admin");
        expect(again.id).toBe(notice.id);
        expect(readAnnouncements().filter((item) => item.sourceClosureId === closure.id)).toHaveLength(1);
        const schedule = readSchedule().find((item) => item.id === scheduleId)!;
        expect(schedule.closureIds?.filter((id) => id === closure.id)).toHaveLength(1);
        expect(schedule.announcementIds?.filter((id) => id === notice.id)).toHaveLength(1);
    });

    it("moves the generated notice with its closure while preserving unrelated notices", () => {
        const [original, target] = readSchedule();
        const closure = createClosure({ ...details, scheduleId: original.id }, "Admin");
        const notice = readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        setClosureSchedule(closure.id, target.id, "Admin");
        const savedOriginal = readSchedule().find((item) => item.id === original.id)!;
        const savedTarget = readSchedule().find((item) => item.id === target.id)!;
        expect(savedOriginal.closureIds).not.toContain(closure.id);
        expect(savedOriginal.announcementIds).toEqual(original.announcementIds);
        expect(savedTarget.closureIds).toContain(closure.id);
        expect(savedTarget.announcementIds).toEqual([...target.announcementIds!, notice.id]);
    });

    it("rejects invalid dates and schedules before creating either record", () => {
        const before = { closures: readClosures(), announcements: readAnnouncements(), schedules: readSchedule() };
        expect(() => createClosure({ ...details, scheduleId: "missing" }, "Admin")).toThrow("Select a valid construction schedule.");
        for (const endAt of [details.startAt, "invalid", "2026-10-01T00:00:00Z"]) {
            expect(() => createClosure({ ...details, endAt, scheduleId: before.schedules[0].id }, "Admin")).toThrow("The closure end must be after its start.");
        }
        expect(readClosures()).toEqual(before.closures);
        expect(readAnnouncements()).toEqual(before.announcements);
        expect(readSchedule()).toEqual(before.schedules);
    });

    it("leaves historical closures, access notices and manual announcements outside automatic publication", () => {
        const before = readAnnouncements();
        readClosures();
        createAccessInfo(details, "Admin");
        expect(readAnnouncements()).toEqual(before);
        const manual = { title: "Manual advisory", body: "Traffic information", type: "closure" as const };
        const first = publishAnnouncement(manual, "Admin");
        const second = publishAnnouncement(manual, "Admin");
        expect(first.sourceClosureId).toBeUndefined();
        expect(second.id).not.toBe(first.id);
    });
});
