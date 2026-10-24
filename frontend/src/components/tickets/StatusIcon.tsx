import { statusMeta } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/ticket";

const sizes = {
    sm: { circle: "size-7", icon: "size-3.5" },
    lg: { circle: "size-9", icon: "size-5" },
};

/**
 * A ticket's status as a coloured circle with its icon (no text). Screen readers get the
 * status name. Shared by the recent tickets progress line and the ticket popup.
 */
export default function StatusIcon({
    status,
    size = "sm",
}: {
    status: TicketStatus;
    size?: "sm" | "lg";
}) {
    const { icon: Icon, fill, ring, label } = statusMeta[status];
    return (
        <span
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full ring-4",
                sizes[size].circle,
                fill,
                ring,
            )}
            title={label}
        >
            <Icon className={sizes[size].icon} strokeWidth={2.5} aria-hidden />
            <span className="sr-only">{label}</span>
        </span>
    );
}
