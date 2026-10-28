import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { announcementUrl } from "@/lib/announcementLinks";
import { EXTENT_LABEL, extentOf, hoursLabel, TIME_LABEL, TIME_TONE, timeStatus } from "@/lib/road/closureDisplay";
import { PATHS } from "@/routes";
import type { Announcement } from "@/types/announcement";
import type { RoadClosure } from "@/types/road-closure";

export default function ClosureNotice({ closure, announcement }: { closure: RoadClosure; announcement?: Announcement }) {
    const { state } = timeStatus(closure);
    const ended = state === "ended";
    const formatDate = (iso: string) => new Date(iso).toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur", dateStyle: "medium", timeStyle: "short",
    });
    return (
        <div className="space-y-2 rounded-lg border bg-card p-3 text-sm">
            <Badge variant="outline" className={TIME_TONE[state]}>{ended ? "Restriction ended" : closure.kind === "access" ? "Access information" : TIME_LABEL[state]}</Badge>
            <p className="font-medium">{closure.title}</p>
            {closure.kind === "closure" && <p className="text-xs text-muted-foreground">{EXTENT_LABEL[extentOf(closure)]} · {hoursLabel(closure.hours)} (MYT)</p>}
            <p className="text-xs text-muted-foreground">{formatDate(closure.startAt)} – {formatDate(closure.endAt)} MYT</p>
            {closure.pedestrian && <p className="text-xs">Pedestrians: {closure.pedestrian}</p>}
            {closure.alternative && <p className="text-xs">Access: {closure.alternative}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-primary">
                {!ended && <Link to={closure.kind === "closure" ? `${PATHS.roadAccess}?closure=${encodeURIComponent(closure.id)}` : PATHS.roadAccess} className="hover:underline">{closure.kind === "closure" ? "View this closure on the map →" : "View road & access map →"}</Link>}
                {announcement && <Link to={announcementUrl(announcement.id)} className="hover:underline">{ended ? "Read ended notice →" : "Read announcement →"}</Link>}
            </div>
        </div>
    );
}
