import { BadgeCheck } from "lucide-react";
import { categoryLabels, formatDate } from "@/lib/tickets/tickets";
import type { Ticket } from "@/types/ticket";

/** Public, anonymised feed of already-resolved reports. Reporter and premise are never shown. */
export default function PublicResolvedTickets({ tickets }: { tickets: Ticket[] }) {
    return (
        <div>
            <div className="flex items-center gap-2">
                <BadgeCheck className="size-5 text-success" aria-hidden />
                <h2 className="text-lg font-semibold">Recently resolved</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
                Tickets that have been fixed, shared anonymously so you can see the work in
                progress.
            </p>

            {tickets.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nothing resolved yet.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {tickets.map((ticket) => {
                        const outcome = ticket.updates[ticket.updates.length - 1];
                        return (
                            <li
                                key={ticket.id}
                                className="rounded-lg border-l-2 border-l-success bg-muted/40 p-3"
                            >
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {categoryLabels[ticket.category]}
                                    </span>
                                    <span aria-hidden>·</span>
                                    <span>{ticket.location}</span>
                                    <span className="ml-auto">{formatDate(ticket.updatedAt)}</span>
                                </div>
                                <p className="mt-1.5 text-sm">{outcome.message}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Anonymous ticket</p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
