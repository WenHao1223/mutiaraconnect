import type { ReactNode } from "react";

/**
 * The "still need help?" block at the end of the About and FAQ pages: a title and a line of
 * text on the left, the page's action buttons on the right.
 */
export default function HelpPanel({
    id,
    title,
    description,
    children,
}: {
    /** Heading id, so the section can be labelled by it. */
    id: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section
            aria-labelledby={id}
            className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h2 id={id} className="text-2xl font-bold text-primary">
                    {title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-wrap gap-2">{children}</div>
        </section>
    );
}
