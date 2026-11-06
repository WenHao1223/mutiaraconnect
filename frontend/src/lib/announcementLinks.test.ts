import { describe, expect, it, vi } from "vitest";
vi.mock("@/routes", () => ({ PATHS: { announcements: "/announcements", roadAccess: "/road-access", constructionInfo: "/construction/info" } }));
import { announcementDestination, announcementUrl } from "./announcementLinks";
import type { Announcement } from "@/types/announcement";

const notice: Announcement = { id: "notice 1", title: "Advisory", body: "Details", type: "closure", time: "Just now", sourceClosureId: "closure/1" };

describe("public advisory navigation", () => {
    it("encodes source IDs when opening the specific live closure", () => {
        expect(announcementDestination(notice).to).toBe("/road-access?closure=closure%2F1");
        expect(announcementUrl(notice.id)).toBe("/announcements?announcement=notice%201");
    });
    it("directs ended advisories to current restrictions instead of an absent map selection", () => {
        expect(announcementDestination({ ...notice, closureState: "ended" })).toEqual({ to: "/road-access", label: "View current road restrictions" });
    });
    it("preserves destinations for manually published notices", () => {
        expect(announcementDestination({ ...notice, sourceClosureId: undefined }).to).toBe("/road-access");
        expect(announcementDestination({ ...notice, sourceClosureId: undefined, type: "construction", area: "Bayan Lepas" }).to).toBe("/construction/info?area=Bayan%20Lepas");
    });
});
