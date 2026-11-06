import { timeStatus } from "@/lib/road/closureDisplay";
import type { Announcement } from "@/types/announcement";
import type { LrtStation } from "@/types/lrt";
import type { RoadClosure } from "@/types/road-closure";
import type { ConstructionSchedule } from "@/types/schedule";

export function sortAnnouncements(items: Announcement[]) {
    return [...items].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
        || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export function stationRelations(
    station: LrtStation, schedules: ConstructionSchedule[], closures: RoadClosure[], announcements: Announcement[],
) {
    const relatedSchedules = schedules.filter((item) => item.stationIds?.includes(station.id));
    const closureIds = new Set(relatedSchedules.flatMap((item) => item.closureIds ?? []));
    const noticeIds = new Set(relatedSchedules.flatMap((item) => item.announcementIds ?? []));
    const relatedClosures = closures.filter((item) => closureIds.has(item.id));
    const relatedNotices = sortAnnouncements(announcements.filter((item) => noticeIds.has(item.id)
        || Boolean(item.sourceClosureId && closureIds.has(item.sourceClosureId))));
    const sameArea = (area?: string) => Boolean(area?.trim() && station.area.trim())
        && area!.trim().toLowerCase() === station.area.trim().toLowerCase();
    const relatedNoticeIds = new Set(relatedNotices.map((item) => item.id));
    return {
        schedules: relatedSchedules, closures: relatedClosures, announcements: relatedNotices,
        nearbyClosures: closures.filter((item) => !closureIds.has(item.id) && sameArea(item.area) && timeStatus(item).state !== "ended"),
        nearbyAnnouncements: sortAnnouncements(announcements.filter((item) => !relatedNoticeIds.has(item.id)
            && sameArea(item.area) && item.closureState !== "ended")),
    };
}

export function constructionAdvisories(announcements: Announcement[], schedules: ConstructionSchedule[], area = "all") {
    const linked = new Set(schedules.flatMap((item) => item.announcementIds ?? []));
    return sortAnnouncements(announcements.filter((item) => item.closureState !== "ended"
        && (item.type === "construction" || item.pinned || (item.type === "closure" && linked.has(item.id)))
        && (area === "all" || item.area?.trim().toLowerCase() === area.trim().toLowerCase())));
}
