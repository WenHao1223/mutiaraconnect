import StatusIcon from "@/components/tickets/StatusIcon";
import { STATUS_ORDER, statusMeta } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/ticket";

/**
 * A ticket's progress as a line of stops (Received, Under Review, In Progress, Resolved): the
 * current stop shows the status icon in its colour, the line up to it takes that colour, and the
 * rest is dashed. Shared by the ticket details and Your recent tickets. Phones only label the
 * current stop.
 */
export default function StatusProgress({ status }: { status: TicketStatus }) {
    const current = STATUS_ORDER.indexOf(status);
    const style = statusMeta[status];

    // Every stop is the same 28px slot spread edge to edge, so the stops (and their labels) land
    // in the same place on every row. The line runs behind them, from the first slot's centre.
    const filled = `calc((100% - 1.75rem) * ${current / (STATUS_ORDER.length - 1)})`;

    return (
        <div className="relative pb-6">
            <span
                className="absolute inset-x-3.5 top-3.5 -translate-y-1/2 border-t-2 border-dashed border-muted-foreground/30"
                aria-hidden
            />
            <span
                className={cn(
                    "absolute left-3.5 top-3.5 h-1 -translate-y-1/2 rounded-full",
                    style.fill,
                )}
                style={{ width: filled }}
                aria-hidden
            />
            <ol
                className="relative flex items-center justify-between"
                aria-label={`Progress: ${statusMeta[status].label}`}
            >
                {STATUS_ORDER.map((step, index) => {
                    const reached = index <= current;
                    const isCurrent = index === current;
                    const isLast = index === STATUS_ORDER.length - 1;
                    return (
                        <li
                            key={step}
                            aria-current={isCurrent ? "step" : undefined}
                            className="relative flex size-7 items-center justify-center"
                        >
                            {isCurrent ? (
                                <StatusIcon status={status} />
                            ) : (
                                <span
                                    className={cn(
                                        "block size-3 rounded-full",
                                        reached
                                            ? style.fill
                                            : "border-2 border-muted-foreground/30 bg-card",
                                    )}
                                />
                            )}
                            <span
                                className={cn(
                                    "absolute top-full mt-1 whitespace-nowrap text-xs",
                                    index === 0
                                        ? "left-0"
                                        : isLast
                                          ? "right-0"
                                          : "left-1/2 -translate-x-1/2",
                                    isCurrent
                                        ? cn("font-semibold", style.text)
                                        : "hidden text-muted-foreground sm:block",
                                )}
                            >
                                {statusMeta[step].label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
