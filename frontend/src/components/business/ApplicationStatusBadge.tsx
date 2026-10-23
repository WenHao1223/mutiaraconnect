import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { applicationStatusMeta } from "@/lib/business/business";
import type { ApplicationStatus } from "@/types/business";

/** Same as the ticket StatusBadge, for business applications. */
export default function ApplicationStatusBadge({
    status,
    className,
}: {
    status: ApplicationStatus;
    className?: string;
}) {
    const { label, badge } = applicationStatusMeta[status];
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
