import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/tickets/StatusBadge";
import TicketStatusDialog from "@/components/admin/TicketStatusDialog";
import TicketsMap from "@/components/admin/TicketsMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth/auth";
import { categoryLabels, formatDate, getAllTickets, matchesTicketQuery, STATUS_ORDER, statusMeta } from "@/lib/tickets/tickets";
import type { Ticket, TicketStatus } from "@/types/ticket";

type StatusFilter = TicketStatus | "all";

/** Manage every report: search, filter, review location on the map and resolve the status. */
export default function TicketAdmin() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const [tickets, setTickets] = useState<Ticket[]>(() => getAllTickets());
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [selectedId, setSelectedId] = useState<string>();
    const [editing, setEditing] = useState<Ticket>();

    const visible = tickets.filter(
        (ticket) =>
            (statusFilter === "all" || ticket.status === statusFilter) &&
            matchesTicketQuery(ticket, query),
    );

    function handleUpdated(updated: Ticket) {
        setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
        toast.success(`${updated.id} updated to ${statusMeta[updated.status].label}.`);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Tickets</CardTitle>
                    <CardDescription>
                        {visible.length} of {tickets.length} tickets
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                        <div className="relative min-w-56 flex-1">
                            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search ID, category, area…"
                                className="pl-8"
                                aria-label="Search tickets"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                            <SelectTrigger className="w-44" aria-label="Filter by status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                {STATUS_ORDER.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {statusMeta[status].label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Area</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((ticket) => (
                                <TableRow
                                    key={ticket.id}
                                    onClick={() => setSelectedId(ticket.id)}
                                    className="cursor-pointer"
                                    data-state={ticket.id === selectedId ? "selected" : undefined}
                                >
                                    <TableCell className="font-medium">{ticket.id}</TableCell>
                                    <TableCell>{categoryLabels[ticket.category]}</TableCell>
                                    <TableCell className="text-muted-foreground">{ticket.location}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={ticket.status} />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(ticket.submittedAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setEditing(ticket);
                                            }}
                                        >
                                            Update
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                                        No tickets match these filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Where tickets are raised</CardTitle>
                    <CardDescription>Pins for every geolocated ticket.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TicketsMap tickets={visible} selectedId={selectedId} />
                    {selectedId && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Selected <span className="font-medium text-foreground">{selectedId}</span>
                        </p>
                    )}
                </CardContent>
            </Card>

            {editing && (
                <TicketStatusDialog
                    key={editing.id}
                    ticket={editing}
                    actor={actor}
                    open={Boolean(editing)}
                    onOpenChange={(open) => !open && setEditing(undefined)}
                    onUpdated={handleUpdated}
                />
            )}
        </div>
    );
}
