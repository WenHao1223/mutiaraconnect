import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import StatusProgress from "@/components/tickets/StatusProgress";
import TicketDialog from "@/components/tickets/TicketDialog";
import { stationNear } from "@/lib/lrt/stations";
import { categoryIcons, categoryLabels, formatDate, statusMeta } from "@/lib/tickets/tickets";
import { PATHS } from "@/routes";
import type { Ticket } from "@/types/ticket";

/**
 * The signed-in user's latest tickets as journey rows. Each row opens that ticket's details in
 * the shared ticket popup; "View all" goes to My Tickets for the full list.
 */
export default function RecentTickets({
    tickets,
    onChange,
}: {
    tickets: Ticket[];
    /** An edited ticket, or undefined once withdrawn, so the page can update its list. */
    onChange: (id: string, ticket: Ticket | undefined) => void;
}) {
    const [open, setOpen] = useState<Ticket>();

    // Keep the popup on the edited ticket; a withdrawn one closes it.
    function change(ticket: Ticket | undefined) {
        if (open) onChange(open.id, ticket);
        setOpen(ticket);
    }

    return (
        <section aria-labelledby="recent-heading" className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-2 px-5 pt-5">
                <h2 id="recent-heading" className="text-lg font-bold">
                    Your recent tickets
                </h2>
                {tickets.length > 0 && (
                    <Link
                        to={PATHS.profileTickets}
                        className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
                    >
                        View all
                        <ChevronRight className="size-4" aria-hidden />
                    </Link>
                )}
            </div>

            {tickets.length === 0 ? (
                <p className="px-5 pt-2 pb-5 text-sm text-muted-foreground">
                    Tickets you send will show up here, with how far along each one is.
                </p>
            ) : (
                <ul className="mt-2 divide-y">
                    {tickets.map((ticket) => {
                        const Icon = categoryIcons[ticket.category];
                        // Lead with the nearest LRT station; the exact address moves to the quiet line.
                        // Tickets without a pin keep their address as the title.
                        const category = categoryLabels[ticket.category];
                        const station = stationNear(ticket);
                        const atStation = station?.name === ticket.location;
                        const place = station
                            ? `${atStation ? "at" : "near"} ${station.name} station`
                            : `at ${ticket.location}`;
                        const address = station && !atStation ? ticket.location : undefined;
                        return (
                            <li key={ticket.id}>
                                <button
                                    type="button"
                                    onClick={() => setOpen(ticket)}
                                    aria-label={`${ticket.id}, ${category} ${place}: ${statusMeta[ticket.status].label}`}
                                    className="grid w-full cursor-pointer gap-x-10 gap-y-3 px-5 text-left pt-4 pb-1 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[18rem_minmax(0,1fr)] md:items-center"
                                >
                                    {/* What and where first; the ID and last update are reference, so one quiet line. */}
                                    <div className="min-w-0 md:pb-3">
                                        {/* The category is the strong part; the place reads quieter beside it. */}
                                        <span className="flex min-w-0 items-center gap-2">
                                            <Icon
                                                className="size-4 shrink-0 text-muted-foreground"
                                                aria-hidden
                                            />
                                            <span className="truncate">
                                                <span className="font-semibold">{category}</span>{" "}
                                                <span className="text-muted-foreground">
                                                    {place}
                                                </span>
                                            </span>
                                        </span>
                                        {/* ID · address · date; a long address shortens, the ID and date stay whole. */}
                                        <span className="mt-1 flex min-w-0 gap-1 text-xs whitespace-nowrap text-muted-foreground">
                                            <span>{ticket.id} ·</span>
                                            {address && <span className="truncate">{address}</span>}
                                            {address && <span>·</span>}
                                            <span>{formatDate(ticket.updatedAt)}</span>
                                        </span>
                                    </div>
                                    <div className="md:pt-2">
                                        <StatusProgress status={ticket.status} />
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <TicketDialog ticket={open} onClose={() => setOpen(undefined)} onChange={change} />
        </section>
    );
}
