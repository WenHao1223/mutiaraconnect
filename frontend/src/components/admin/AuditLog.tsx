import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { readAuditLog } from "@/lib/admin/audit";
import { formatDateTime } from "@/lib/tickets/tickets";
import type { AuditAction } from "@/types/audit";

const actionLabels: Record<AuditAction, string> = {
    sign_in: "Sign in",
    sign_out: "Sign out",
    role_change: "Role change",
    user_status: "User status",
    ticket_status: "Ticket status",
    closure_create: "Closure created",
    closure_status: "Closure status",
    schedule_create: "Schedule added",
    schedule_update: "Schedule updated",
    announcement: "Announcement",
    business_notice: "Business notice",
    business_application: "Business application",
    business_support: "Business support",
};

/** Super admin tool: a read-only trail of who did what and when. */
export default function AuditLog() {
    const [entries] = useState(() => readAuditLog());
    const [filter, setFilter] = useState<AuditAction | "all">("all");

    const visible = filter === "all" ? entries : entries.filter((entry) => entry.action === filter);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                    <CardTitle className="text-lg">Audit log</CardTitle>
                    <CardDescription>{visible.length} entries, newest first</CardDescription>
                </div>
                <Select value={filter} onValueChange={(value) => setFilter(value as AuditAction | "all")}>
                    <SelectTrigger className="w-48" aria-label="Filter by action">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All actions</SelectItem>
                        {(Object.keys(actionLabels) as AuditAction[]).map((action) => (
                            <SelectItem key={action} value={action}>
                                {actionLabels[action]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>When</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Detail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="whitespace-nowrap text-muted-foreground">
                                        {formatDateTime(entry.at)}
                                    </TableCell>
                                    <TableCell className="font-medium">{entry.actor}</TableCell>
                                    <TableCell>{actionLabels[entry.action]}</TableCell>
                                    <TableCell className="text-muted-foreground">{entry.detail}</TableCell>
                                </TableRow>
                            ))}
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                                        No audit entries yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
