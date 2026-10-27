import { useState } from "react";
import { Camera, Search } from "lucide-react";
import { toast } from "sonner";
import CategoryBadge from "@/components/tickets/CategoryBadge";
import StatusBadge from "@/components/tickets/StatusBadge";
import TicketSheet from "@/components/admin/TicketSheet";
import TicketStatusDialog from "@/components/admin/TicketStatusDialog";
import TicketsMap from "@/components/admin/TicketsMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth/auth";
import { formatDate, getAllTickets, matchesTicketQuery, STATUS_ORDER, statusMeta } from "@/lib/tickets/tickets";
import type { Ticket, TicketStatus } from "@/types/ticket";

type StatusFilter = TicketStatus | "all";

/**
 * Manage every report: search and filter the table, open one to see its photos and history and
 * update its status, and review where tickets are raised on the map.
 */
export default function TicketAdmin() {
    const { user } = useAuth();
    const actor = user?.email ?? user?.name ?? "Admin";

    const [tickets, setTickets] = useState<Ticket[]>(() => getAllTickets());
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [selectedId, setSelectedId] = useState<string>();
    // The ticket shown in the side panel, and the one in the Update dialog.
    const [viewing, setViewing] = useState<Ticket>();
    const [editing, setEditing] = useState<Ticket>();

    const visible = tickets.filter(
        (ticket) =>
            (statusFilter === "all" || ticket.status === statusFilter) &&
            matchesTicketQuery(ticket, query),
    );

    // Opening a ticket also picks its pin on the map below.
    function open(ticket: Ticket) {
        setSelectedId(ticket.id);
        setViewing(ticket);
    }

    function handleUpdated(updated: Ticket) {
        setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
        setViewing((current) => (current?.id === updated.id ? updated : current));
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
                    {/* Click a row to see it in full (photos, history) and update it there. */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-40 pl-6">Ticket</TableHead>
                                <TableHead>Issue</TableHead>
                                <TableHead className="hidden md:table-cell">Reporter</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden pr-6 text-right sm:table-cell">Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((ticket) => (
                                <TableRow
                                    key={ticket.id}
                                    onClick={() => open(ticket)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            open(ticket);
                                        }
                                    }}
                                    tabIndex={0}
                                    aria-label={`${ticket.id}: open details`}
                                    className="cursor-pointer align-top focus-visible:bg-muted/50 focus-visible:outline-none"
                                    data-state={ticket.id === selectedId ? "selected" : undefined}
                                >
                                    <TableCell className="pl-6 whitespace-nowrap">
                                        <span className="block font-medium">{ticket.id}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            {formatDate(ticket.submittedAt)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="max-w-0 w-full">
                                        <span className="flex items-center gap-2">
                                            <CategoryBadge category={ticket.category} />
                                            <span className="truncate text-sm font-medium">
                                                {ticket.location}
                                            </span>
                                            {(ticket.photos?.length || ticket.hasPhoto) && (
                                                <span
                                                    className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground"
                                                    title="Photo attached"
                                                >
                                                    <Camera className="size-3.5" aria-label="Photo attached" />
                                                    {(ticket.photos?.length ?? 0) > 1 && ticket.photos?.length}
                                                </span>
                                            )}
                                        </span>
                                        <span className="mt-1 block truncate text-sm text-muted-foreground">
                                            {ticket.description}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden max-w-48 truncate text-sm md:table-cell">
                                        {ticket.submittedByEmail ?? (
                                            <span className="text-muted-foreground">Anonymous</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={ticket.status} />
                                    </TableCell>
                                    <TableCell className="hidden pr-6 text-right text-sm whitespace-nowrap text-muted-foreground sm:table-cell">
                                        {formatDate(ticket.updatedAt)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
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

            <TicketSheet ticket={viewing} onClose={() => setViewing(undefined)} onUpdate={setEditing} />

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
