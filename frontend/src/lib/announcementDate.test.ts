import { describe, expect, it } from "vitest";
import { matchesPublicationDate, publicationDateKey } from "./announcementDate";

describe("announcement publication dates", () => {
    it("uses the Malaysian calendar date across UTC month and year boundaries", () => {
        expect(publicationDateKey("2026-12-31T16:30:00Z")).toBe("2027-01-01");
        expect(publicationDateKey("2026-10-31T16:00:00Z")).toBe("2026-11-01");
        expect(publicationDateKey("2026-10-31T15:59:59Z")).toBe("2026-10-31");
    });

    it("accepts a whole year, a month within a year, or an exact day", () => {
        const publishedAt = "2026-10-16T10:00:00+08:00";
        expect(matchesPublicationDate(publishedAt, "2026")).toBe(true);
        expect(matchesPublicationDate(publishedAt, "2026-10")).toBe(true);
        expect(matchesPublicationDate(publishedAt, "2026-10-16")).toBe(true);
        expect(matchesPublicationDate(publishedAt, "2025")).toBe(false);
        expect(matchesPublicationDate(publishedAt, "2026-01")).toBe(false);
        expect(matchesPublicationDate(publishedAt, "2026-10-17")).toBe(false);
    });

    it("keeps undated or invalid records in the unfiltered list only", () => {
        for (const date of [undefined, "", "invalid"]) {
            expect(publicationDateKey(date)).toBeNull();
            expect(matchesPublicationDate(date, "")).toBe(true);
            expect(matchesPublicationDate(date, "2026")).toBe(false);
        }
    });

    it("preserves leap day after converting to Malaysian time", () => {
        expect(publicationDateKey("2028-02-28T17:00:00Z")).toBe("2028-02-29");
        expect(matchesPublicationDate("2028-02-29T20:00:00Z", "2028-02")).toBe(false);
    });
});
