/** Calendar dates use Malaysian time, regardless of the viewer's timezone. */
const publicationDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

export function publicationDateKey(publishedAt?: string): string | null {
    if (!publishedAt) return null;
    const date = new Date(publishedAt);
    if (Number.isNaN(date.getTime())) return null;
    const parts = publicationDateFormatter.formatToParts(date);
    return ["year", "month", "day"]
        .map((type) => parts.find((part) => part.type === type)?.value)
        .join("-");
}

/** An empty prefix includes undated legacy records; selected dates exclude them. */
export function matchesPublicationDate(publishedAt: string | undefined, prefix: string): boolean {
    return !prefix || Boolean(publicationDateKey(publishedAt)?.startsWith(prefix));
}
