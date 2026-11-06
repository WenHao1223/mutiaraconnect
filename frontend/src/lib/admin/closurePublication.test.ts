import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteAnnouncement, markAnnouncementRead, publishAnnouncement, readAnnouncements, readReadAnnouncementIds, subscribeAnnouncements, toggleAnnouncementPin } from "./announcements";
import { createAccessInfo, createClosure, readClosures, setClosureSchedule, setClosureStatus } from "./closures";
import { createScheduleItem, readSchedule, updateScheduleItem } from "./schedule";

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
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

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

    it("synchronizes ending and reactivation without replacing publication metadata, pins or read state", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-11-02T15:30:00Z"));
        const schedule = readSchedule()[0];
        const closure = createClosure({ ...details, scheduleId: schedule.id }, "Author");
        const notice = readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        toggleAnnouncementPin(notice.id, "Admin");
        markAnnouncementRead(notice.id);
        vi.setSystemTime(new Date("2026-11-03T15:30:00Z"));
        setClosureStatus(closure.id, "ended", "Editor");
        const ended = readAnnouncements().find((item) => item.id === notice.id)!;
        expect(ended).toMatchObject({
            id: notice.id, publishedAt: notice.publishedAt, createdBy: "Author", pinned: true,
            closureState: "ended", updatedAt: "2026-11-03T15:30:00.000Z",
        });
        expect(ended.body).toContain("Status: Restriction ended");
        expect(ended.title).toContain("Road closure ended:");
        expect(readReadAnnouncementIds()).toContain(notice.id);
        setClosureStatus(closure.id, "active", "Editor");
        expect(readAnnouncements().find((item) => item.id === notice.id)?.closureState).toBe("now");
        expect(readSchedule().find((item) => item.id === schedule.id)?.status).toBe(schedule.status);
    });

    it("derives upcoming, Malaysian daily hours and natural expiry without changing publication dates", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-10-30T00:00:00Z"));
        const closure = createClosure({ ...details, scheduleId: readSchedule()[0].id }, "Admin");
        const getNotice = () => readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        const publishedAt = getNotice().publishedAt;
        expect(getNotice().closureState).toBe("upcoming");
        vi.setSystemTime(new Date("2026-11-02T15:30:00Z")); // 23:30 MYT, overnight restriction applies.
        expect(getNotice().closureState).toBe("now");
        vi.setSystemTime(new Date("2026-11-03T01:30:00Z")); // 09:30 MYT, road open between shifts.
        expect(getNotice().closureState).toBe("later");
        vi.setSystemTime(new Date("2026-11-16T00:00:00Z"));
        expect(getNotice().closureState).toBe("ended");
        expect(getNotice().publishedAt).toBe(publishedAt);
        expect(getNotice().updatedAt).toBeUndefined();
        expect(readClosures().find((item) => item.id === closure.id)?.status).toBe("active");
    });

    it("moves both records when the schedule editor claims a closure", () => {
        const [original, target] = readSchedule();
        const closure = createClosure({ ...details, scheduleId: original.id }, "Admin");
        const notice = readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        updateScheduleItem(target.id, { closureIds: [...target.closureIds!, closure.id] }, "Editor");
        expect(readSchedule().filter((item) => item.closureIds?.includes(closure.id)).map((item) => item.id)).toEqual([target.id]);
        expect(readSchedule().filter((item) => item.announcementIds?.includes(notice.id)).map((item) => item.id)).toEqual([target.id]);
        updateScheduleItem(target.id, { announcementIds: [] }, "Editor");
        expect(readSchedule().find((item) => item.id === target.id)?.announcementIds).toContain(notice.id);
        const before = readSchedule();
        expect(() => updateScheduleItem(target.id, { closureIds: target.closureIds }, "Editor")).toThrow("Reassign road closures");
        expect(readSchedule()).toEqual(before);
    });

    it("also enforces ownership when a new schedule selects an existing closure", () => {
        const original = readSchedule()[0];
        const closure = createClosure({ ...details, scheduleId: original.id }, "Admin");
        const notice = readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        const beforeCount = readSchedule().length;
        const created = createScheduleItem({
            title: "New work package", description: original.description, area: original.area,
            startsAt: original.startsAt, endsAt: original.endsAt, status: original.status,
            stationIds: original.stationIds, closureIds: [closure.id], announcementIds: [],
        }, "Editor");
        expect(readSchedule()).toHaveLength(beforeCount + 1);
        expect(created.announcementIds).toContain(notice.id);
        expect(readSchedule().filter((item) => item.closureIds?.includes(closure.id)).map((item) => item.id)).toEqual([created.id]);
    });

    it("does not let an independent announcement selection move or duplicate generated advisories", () => {
        const [owner, other] = readSchedule();
        const closure = createClosure({ ...details, scheduleId: owner.id }, "Admin");
        const notice = readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        updateScheduleItem(other.id, { announcementIds: [...other.announcementIds!, notice.id] }, "Editor");
        expect(readSchedule().find((item) => item.id === other.id)?.announcementIds).not.toContain(notice.id);
        expect(readSchedule().find((item) => item.id === owner.id)?.announcementIds).toContain(notice.id);
    });

    it("cleans up a deleted notice without deleting its closure or recreating the notice on later changes", () => {
        const [owner, target] = readSchedule();
        const closure = createClosure({ ...details, scheduleId: owner.id }, "Admin");
        const notice = readAnnouncements().find((item) => item.sourceClosureId === closure.id)!;
        markAnnouncementRead(notice.id);
        deleteAnnouncement(notice.id, "Admin");
        expect(readAnnouncements().some((item) => item.id === notice.id)).toBe(false);
        expect(readSchedule().some((item) => item.announcementIds?.includes(notice.id))).toBe(false);
        expect(readReadAnnouncementIds()).not.toContain(notice.id);
        expect(readClosures().some((item) => item.id === closure.id)).toBe(true);
        setClosureStatus(closure.id, "ended", "Admin");
        setClosureSchedule(closure.id, target.id, "Admin");
        expect(readAnnouncements().some((item) => item.sourceClosureId === closure.id)).toBe(false);
    });
});
