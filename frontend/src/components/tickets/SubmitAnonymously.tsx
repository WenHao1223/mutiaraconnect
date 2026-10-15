import { useId, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface SubmitAnonymouslyProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    /** Explains what "anonymous" hides for this particular form. */
    description: ReactNode;
}

/** A fully clickable row that toggles whether a submission is filed anonymously. */
export default function SubmitAnonymously({ checked, onCheckedChange, description }: SubmitAnonymouslyProps) {
    const id = useId();

    return (
        <label
            htmlFor={id}
            className="flex cursor-pointer items-start gap-2.5 rounded-md border p-3 transition hover:bg-muted/50 focus-within:ring-1 focus-within:ring-ring"
        >
            <Checkbox
                id={id}
                className="mt-0.5"
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
            />
            <span className="space-y-0.5">
                <span className="block text-sm font-medium">Submit anonymously</span>
                <span className="block text-sm text-muted-foreground">{description}</span>
            </span>
        </label>
    );
}
