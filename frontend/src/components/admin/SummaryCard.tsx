import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    label: string;
    value: number | string;
    hint?: string;
    icon: LucideIcon;
    /** Tailwind classes for the icon bubble, e.g. "bg-hazard/15 text-amber-700". */
    tone?: string;
}

/** One number on the admin overview. */
export default function SummaryCard({ label, value, hint, icon: Icon, tone }: SummaryCardProps) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <span className={cn("rounded-lg p-2.5", tone ?? "bg-primary/10 text-primary")}>
                    <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-semibold leading-tight">{value}</p>
                    {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
