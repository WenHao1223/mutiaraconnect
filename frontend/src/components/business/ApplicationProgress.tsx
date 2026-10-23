import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types/business";

/** Three-step bar like the ticket StatusProgress: Submitted, Under review, then the decision. */
export default function ApplicationProgress({ status }: { status: ApplicationStatus }) {
    const decided = status !== "pending";
    const steps = ["Submitted", "Under review", status === "rejected" ? "Rejected" : "Approved"];
    const current = decided ? 2 : 1;
    const doneColour = status === "approved" ? "bg-success" : status === "rejected" ? "bg-destructive" : "bg-primary";

    return (
        <ol className="grid grid-cols-3 gap-1.5" aria-label="Application progress">
            {steps.map((step, index) => {
                const reached = index <= current;
                const isCurrent = index === current;
                return (
                    <li key={step} aria-current={isCurrent ? "step" : undefined}>
                        <div className={cn("h-2 rounded-full", reached ? doneColour : "bg-muted")} />
                        <span
                            className={cn(
                                "mt-2 block text-center text-xs",
                                isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                            )}
                        >
                            {step}
                            {index < current && <span className="sr-only"> (done)</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
