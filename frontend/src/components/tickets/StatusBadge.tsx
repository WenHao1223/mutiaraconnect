import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusMeta } from "@/lib/tickets";
import type { TicketStatus } from "@/types/ticket";

/** A span (not Badge's div) so it can sit inside buttons and other inline content. */
export default function StatusBadge({
    status,
    className,
}: {
    status: TicketStatus;
    className?: string;
}) {
    const { label, badge } = statusMeta[status];
    return (
        <span
            className={cn(
                badgeVariants({ variant: "outline" }),
                "whitespace-nowrap rounded-full",
                badge,
                className,
            )}
        >
            {label}
        </span>
    );
}