import { Clock, MessageSquareText, Paperclip, Store } from "lucide-react";
import { categoryLabels, formatDate, formatDateTime, statusMeta } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/tickets/StatusBadge";
import StatusProgress from "@/components/tickets/StatusProgress";
import type { Ticket } from "@/types/ticket";

/** Everything about one ticket: summary, progress bar, latest response and history. */
export default function TicketDetail({ ticket }: { ticket: Ticket }) {
    const latest = ticket.updates[ticket.updates.length - 1];
    const history = [...ticket.updates].reverse();

    return (
        <article>
            <header className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">
                        {ticket.id} · {categoryLabels[ticket.category]}
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {ticket.location} · Submitted {formatDate(ticket.submittedAt)}
                    </p>
                </div>
                <StatusBadge status={ticket.status} />
            </header>

            {(ticket.premise || ticket.hasPhoto) && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {ticket.premise && (
                        <span className="inline-flex items-center gap-1.5">
                            <Store className="size-4" aria-hidden /> {ticket.premise}
                        </span>
                    )}
                    {ticket.hasPhoto && (
                        <span className="inline-flex items-center gap-1.5">
                            <Paperclip className="size-4" aria-hidden /> Photo attached
                        </span>
                    )}
                </div>
            )}

            <p className="mt-4 text-sm">{ticket.description}</p>

            <div className="mt-6">
                <StatusProgress status={ticket.status} />
            </div>

            {ticket.status === "received" ? (
                <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                    <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
                    No response yet. A team member will review your report soon.
                </p>
            ) : (
                <div className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm">
                    <p>
                        <span className="font-semibold">Response:</span> {latest.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {latest.by} · {formatDateTime(latest.at)}
                    </p>
                </div>
            )}

            <section className="mt-8" aria-labelledby="ticket-history">
                <h3
                    id="ticket-history"
                    className="flex items-center gap-2 text-sm font-semibold text-primary"
                >
                    <MessageSquareText className="size-4" aria-hidden /> History
                </h3>
                <ol className="mt-3 space-y-4 border-l pl-5">
                    {history.map((update, index) => (
                        <li key={`${update.status}-${update.at}`} className="relative">
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute left-[-1.6rem] top-1 size-2.5 rounded-full ring-4 ring-card",
                                    index === 0 ? "bg-primary" : "bg-border",
                                )}
                            />
                            <p className="text-sm font-medium">{statusMeta[update.status].label}</p>
                            <p className="text-sm text-muted-foreground">{update.message}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {update.by} · {formatDateTime(update.at)}
                            </p>
                        </li>
                    ))}
                </ol>
            </section>
        </article>
    );
}