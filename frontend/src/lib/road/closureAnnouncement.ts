import { EXTENT_LABEL, extentOf, hoursLabel, timeStatus, type TimeState } from "@/lib/road/closureDisplay";
import type { RoadClosure } from "@/types/road-closure";

const advisoryStatus: Record<TimeState, string> = {
    upcoming: "Upcoming restriction",
    now: "Closed now",
    later: "Open now; restriction applies during the listed hours",
    ended: "Restriction ended",
};

/** Generated content always follows its source; elapsed dates never require a storage migration. */
export function closureAnnouncementFields(closure: RoadClosure, now = new Date()) {
    const state = timeStatus(closure, now).state;
    const formatDate = (iso: string) => new Date(iso).toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short",
    });
    return {
        title: `${state === "ended" ? "Road closure ended" : "Road closure"}: ${closure.title}`,
        type: "closure" as const,
        area: closure.area,
        body: [
            `Status: ${advisoryStatus[state]}`,
            `Road: ${closure.road}`,
            closure.area ? `Area: ${closure.area}` : "",
            `Restriction: ${EXTENT_LABEL[extentOf(closure)]}`,
            `Starts: ${formatDate(closure.startAt)} MYT`,
            `Expected end: ${formatDate(closure.endAt)} MYT`,
            `Hours: ${hoursLabel(closure.hours)} (Malaysia time)`,
            closure.reason ? `Reason: ${closure.reason}` : "",
            closure.pedestrian ? `Pedestrian access: ${closure.pedestrian}` : "",
        ].filter(Boolean).join("\n"),
        closureState: state,
    };
}
