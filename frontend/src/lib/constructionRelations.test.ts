import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import stationData from "@/data/lrt-stations.json";
import closureData from "@/data/closures.json";
import scheduleData from "@/data/construction-schedule.json";
import { constructionAdvisories, stationRelations } from "./constructionRelations";
import type { Announcement } from "@/types/announcement";
import type { LrtStation } from "@/types/lrt";
import type { RoadClosure } from "@/types/road-closure";
import type { ConstructionSchedule } from "@/types/schedule";

const station = { ...stationData[0], area: "Shared area" } as LrtStation;
const closure = { ...closureData[0], id: "owned", area: "Different area", hours: undefined,
    startAt: "2026-11-01T00:00:00+08:00", endAt: "2026-11-10T00:00:00+08:00", status: "active" } as RoadClosure;
const nearby = { ...closure, id: "nearby", area: "Shared area" };
const ended = { ...nearby, id: "ended", status: "ended" } as RoadClosure;
const schedule = { ...scheduleData[0], stationIds: [station.id], closureIds: [closure.id], announcementIds: ["notice"] } as ConstructionSchedule;
const notices: Announcement[] = [
    { id: "notice", title: "Linked restriction", body: "Details", type: "closure", time: "Just now", area: "Shared area", sourceClosureId: closure.id, closureState: "now" },
    { id: "nearby-notice", title: "Nearby advisory", body: "Details", type: "closure", time: "Just now", area: "SHARED AREA" },
    { id: "old", title: "Ended restriction", body: "Details", type: "closure", time: "Yesterday", area: "Shared area", closureState: "ended", pinned: true },
];

describe("public construction relationships", () => {
    beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-02T00:00:00Z")); });
    afterEach(() => vi.useRealTimers());

    it("uses explicit station links instead of shared area names and deduplicates records", () => {
        const other = { ...schedule, id: "other-work", stationIds: ["other-station"], closureIds: [nearby.id], announcementIds: ["nearby-notice"] };
        const duplicate = { ...schedule, id: "same-station-work" };
        const result = stationRelations(station, [schedule, duplicate, other], [closure, nearby, ended], notices);
        expect(result.schedules.map((item) => item.id)).toEqual([schedule.id, duplicate.id]);
        expect(result.closures.map((item) => item.id)).toEqual([closure.id]);
        expect(result.announcements.map((item) => item.id)).toEqual(["notice"]);
        expect(result.nearbyClosures.map((item) => item.id)).toEqual([nearby.id]);
        expect(result.nearbyAnnouncements.map((item) => item.id)).toEqual(["nearby-notice"]);
    });

    it("retains linked historical closures without treating them as nearby current restrictions", () => {
        const result = stationRelations(station, [{ ...schedule, closureIds: [ended.id], announcementIds: ["old"] }], [closure, nearby, ended], notices);
        expect(result.closures.map((item) => item.id)).toEqual([ended.id]);
        expect(result.announcements.map((item) => item.id)).toEqual(["old"]);
        expect(result.nearbyClosures).not.toContain(ended);
    });

    it("does not match empty areas or infer station links from a title", () => {
        const result = stationRelations({ ...station, area: "" }, [{ ...schedule, title: station.name, stationIds: [] }], [nearby], notices);
        expect(result.schedules).toEqual([]);
        expect(result.closures).toEqual([]);
        expect(result.nearbyClosures).toEqual([]);
        expect(result.nearbyAnnouncements).toEqual([]);
    });

    it("includes linked unpinned closure advisories and excludes ended restrictions from current advisories", () => {
        const construction: Announcement = { ...notices[0], id: "construction", type: "construction", sourceClosureId: undefined, closureState: undefined };
        const result = constructionAdvisories([...notices, construction], [schedule], " shared AREA ");
        expect(result.map((item) => item.id)).toEqual(["notice", "construction"]);
        expect(constructionAdvisories(notices, [schedule], "Other area")).toEqual([]);
    });
});
