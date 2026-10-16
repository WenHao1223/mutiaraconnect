import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_ORDER, statusMeta, updateTicketStatus } from "@/lib/tickets/tickets";
import type { Ticket, TicketStatus } from "@/types/ticket";

interface TicketStatusDialogProps {
    ticket: Ticket;
    actor: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated: (ticket: Ticket) => void;
}

/** Lets an admin move a ticket along the status pipeline with a message to the reporter. */
export default function TicketStatusDialog({
    ticket,
    actor,
    open,
    onOpenChange,
    onUpdated,
}: TicketStatusDialogProps) {
    const [status, setStatus] = useState<TicketStatus>(ticket.status);
    const [message, setMessage] = useState("");

    function save() {
        const text = message.trim() || `Status set to ${statusMeta[status].label}.`;
        const updated = updateTicketStatus(ticket.id, status, text, actor);
        if (updated) onUpdated(updated);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update {ticket.id}</DialogTitle>
                    <DialogDescription>Change the status and tell the reporter what happened.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="ticket-status">Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as TicketStatus)}>
                            <SelectTrigger id="ticket-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_ORDER.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {statusMeta[value].label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="ticket-message">Message to reporter</Label>
                        <Textarea
                            id="ticket-message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="e.g. Contractor reminded of permitted hours."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={save}>Save update</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
