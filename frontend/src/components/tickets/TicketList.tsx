import { useState } from "react";
import { BadgeCheck, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { categoryLabels, formatDate, isBusinessOwner, isOpen } from "@/lib/tickets";
import StatusBadge from "@/components/tickets/StatusBadge";
import type { Ticket } from "@/types/ticket";

type Filter = "all" | "open" | "resolved";

interface TicketListProps {
    tickets: Ticket[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

export default function TicketList({ tickets, selectedId, onSelect }: TicketListProps) {
    const [filter, setFilter] = useState<Filter>("all");

    const openCount = tickets.filter(isOpen).length;
    const filters: { value: Filter; label: string; count: number }[] = [
        { value: "all", label: "All", count: tickets.length },
        { value: "open", label: "Open", count: openCount },
        { value: "resolved", label: "Resolved", count: tickets.length - openCount },
    ];
    const visible = tickets.filter(
        (t) => filter === "all" || (filter === "open" ? isOpen(t) : !isOpen(t)),
    );

    return (
        <div>
            <div role="group" aria-label="Filter tickets" className="flex flex-wrap gap-1.5">
                {filters.map((f) => (
                    <Button
                        key={f.value}
                        type="button"
                        size="sm"
                        variant={filter === f.value ? "default" : "outline"}
                        aria-pressed={filter === f.value}
                        onClick={() => setFilter(f.value)}
                    >
                        {f.label} ({f.count})
                    </Button>
                ))}
            </div>

            {visible.length === 0 ? (
                <p className="mt-4 rounded-lg bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                    No {filter} tickets.
                </p>
            ) : (
                <ul className="mt-3 space-y-2">
                    {visible.map((ticket) => {
                        const selected = ticket.id === selectedId;
                        return (
                            <li key={ticket.id}>
                                <button
                                    type="button"
                                    aria-current={selected ? "true" : undefined}
                                    onClick={() => onSelect(ticket.id)}
                                    className={cn(
                                        "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        selected && "border-primary bg-accent",
                                    )}
                                >
                                    <span className="flex items-start justify-between gap-2">
                                        <span className="flex items-center gap-1 text-sm font-semibold">
                                            <span>
                                                {ticket.id} · {categoryLabels[ticket.category]}
                                            </span>
                                            {isBusinessOwner(ticket) && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span
                                                            className="inline-flex text-primary"
                                                            aria-label="Business owner verified"
                                                        >
                                                            <BadgeCheck className="size-3.5" />
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Business owner verified
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </span>
                                        <StatusBadge status={ticket.status} />
                                    </span>
                                    <span className="mt-1 block text-sm text-muted-foreground">
                                        {ticket.location}
                                        {ticket.premise && ` · ${ticket.premise}`}
                                    </span>
                                    <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        Updated {formatDate(ticket.updatedAt)}
                                        {ticket.hasPhoto && (
                                            <span className="inline-flex items-center gap-1">
                                                <Paperclip className="size-3" aria-hidden />
                                                <span className="sr-only">Has photo</span>
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}