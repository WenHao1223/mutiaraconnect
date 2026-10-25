import { AlertTriangle, BellRing, CheckCircle2, FolderOpen, Users } from "lucide-react";
import ReportsCharts from "@/components/admin/ReportsCharts";
import SummaryCard from "@/components/admin/SummaryCard";
import { readAnnouncements } from "@/lib/admin/announcements";
import { readClosures } from "@/lib/admin/closures";
import { readUsers } from "@/lib/admin/users";
import { timeStatus } from "@/lib/road/closureDisplay";
import { getAllTickets, isOpen } from "@/lib/tickets/tickets";

/** Admin home: the at-a-glance numbers and the management charts. */
export default function AdminOverview() {
    const tickets = getAllTickets();
    const open = tickets.filter(isOpen).length;
    const resolved = tickets.length - open;
    // Closures in progress (closed now, or closing later today), by the same date rule as the public map.
    const activeClosures = readClosures().filter((closure) => {
        const { state } = timeStatus(closure);
        return closure.kind === "closure" && (state === "now" || state === "later");
    }).length;
    const announcements = readAnnouncements().length;
    const users = readUsers().length;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <SummaryCard label="Total tickets" value={tickets.length} icon={FolderOpen} hint="All time" />
                <SummaryCard
                    label="Open tickets"
                    value={open}
                    icon={AlertTriangle}
                    tone="bg-hazard/15 text-hazard-text"
                    hint="Awaiting resolution"
                />
                <SummaryCard
                    label="Resolved"
                    value={resolved}
                    icon={CheckCircle2}
                    tone="bg-success/15 text-success-text"
                    hint="Closed out"
                />
                <SummaryCard
                    label="Active closures"
                    value={activeClosures}
                    icon={AlertTriangle}
                    tone="bg-destructive/10 text-destructive"
                    hint="In effect now"
                />
                <SummaryCard
                    label="Announcements"
                    value={announcements}
                    icon={BellRing}
                    tone="bg-info/10 text-info"
                    hint="Published"
                />
                <SummaryCard
                    label="Registered users"
                    value={users}
                    icon={Users}
                    tone="bg-primary/10 text-primary"
                    hint="All roles"
                />
            </div>

            <ReportsCharts tickets={tickets} />
        </div>
    );
}
