import type { Announcement } from "@/types/announcement";

// Mock data. Replace with a Supabase query later.
export const sampleAnnouncements: Announcement[] = [
    {
        id: "a1",
        title: "Sample: Lane closure this weekend",
        body: "Replace this with a real announcement from the database.",
        time: "2 hours ago",
        type: "closure",
    },
    {
        id: "a2",
        title: "Sample: Night works near a station site",
        body: "Expect noise between 10 PM and 5 AM.",
        time: "Yesterday",
        type: "construction",
    },
    {
        id: "a3",
        title: "Sample: Feedback form is now open",
        body: "Residents can now submit and track feedback online.",
        time: "3 days ago",
        type: "general",
    },
];
