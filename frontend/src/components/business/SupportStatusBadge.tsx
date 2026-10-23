import { badgeVariants } from "@/components/ui/badge";
import { supportStatusMeta } from "@/lib/business/support";
import { cn } from "@/lib/utils";
import type { SupportRequestStatus } from "@/types/business";

/** Same as the ticket StatusBadge, for support requests. */
export default function SupportStatusBadge({
    status,
    className,
}: {
    status: SupportRequestStatus;
    className?: string;
}) {
    const { label, badge } = supportStatusMeta[status];
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
