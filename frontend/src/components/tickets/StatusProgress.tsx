import { cn } from "@/lib/utils";
import { STATUS_ORDER, statusMeta } from "@/lib/tickets";
import type { TicketStatus } from "@/types/ticket";

/** Four-step bar: Received, Under Review, In Progress, Resolved. */
export default function StatusProgress({ status }: { status: TicketStatus }) {
    const current = STATUS_ORDER.indexOf(status);

    return (
        <ol className="grid grid-cols-4 gap-1.5" aria-label="Ticket progress">
            {STATUS_ORDER.map((step, index) => {
                const reached = index <= current;
                const isCurrent = index === current;
                return (
                    <li key={step} aria-current={isCurrent ? "step" : undefined}>
                        <div
                            className={cn(
                                "h-2 rounded-full",
                                reached ? (status === "resolved" ? "bg-success" : "bg-primary") : "bg-muted",
                            )}
                        />
                        <span
                            className={cn(
                                "mt-2 block text-center text-xs",
                                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                            )}
                        >
                            {statusMeta[step].label}
                            {index < current && <span className="sr-only"> (done)</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}