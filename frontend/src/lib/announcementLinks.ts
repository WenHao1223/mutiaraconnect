import { PATHS } from "@/routes";
import type { Announcement } from "@/types/announcement";

export const announcementUrl = (id: string) => `${PATHS.announcements}?announcement=${encodeURIComponent(id)}`;

export function announcementDestination(item: Announcement) {
    if (item.sourceClosureId) {
        return item.closureState === "ended"
            ? { to: PATHS.roadAccess, label: "View current road restrictions" }
            : { to: `${PATHS.roadAccess}?closure=${encodeURIComponent(item.sourceClosureId)}`, label: "View this road closure" };
    }
    return item.type === "closure" ? { to: PATHS.roadAccess, label: "View road & access map" }
        : { to: item.area ? `${PATHS.constructionInfo}?area=${encodeURIComponent(item.area)}` : PATHS.constructionInfo, label: "View station progress" };
}
