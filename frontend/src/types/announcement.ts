export interface Announcement {
    id: string;
    title: string;
    body: string;
    time: string;
    type: "closure" | "construction" | "general";
}
