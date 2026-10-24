import { categoryIcons, categoryLabels } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { TicketCategory } from "@/types/ticket";

/** A span so it can sit inside buttons and other inline content. */
export default function CategoryBadge({
    category,
    className,
}: {
    category: TicketCategory;
    className?: string;
}) {
    const Icon = categoryIcons[category];
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground",
                className,
            )}
        >
            <Icon className="size-3" aria-hidden />
            {categoryLabels[category]}
        </span>
    );
}
