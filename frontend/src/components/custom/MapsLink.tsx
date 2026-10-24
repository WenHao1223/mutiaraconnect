import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
    googleMapsDirectionsUrl,
    googleMapsSearchUrl,
    type Coordinates,
} from "@/lib/maps/maps";

interface MapsLinkProps {
    /** Pin coordinates, or a place name used when no pin is available. */
    location: Coordinates | string;
    /**
     * "directions" opens turn-by-turn navigation, "walking" opens it in walking mode,
     * "search" centres on the place.
     */
    mode?: "search" | "directions" | "walking";
    className?: string;
    children: ReactNode;
}

/** Shared Google Maps link: keeps the anchor markup and URL helpers in one spot. */
export default function MapsLink({ location, mode = "search", className, children }: MapsLinkProps) {
    const href =
        mode === "directions"
            ? googleMapsDirectionsUrl(location)
            : mode === "walking"
              ? googleMapsDirectionsUrl(location, "walking")
              : googleMapsSearchUrl(location);

    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={cn(
                "inline-flex items-center gap-1 font-medium text-primary hover:underline",
                className,
            )}
        >
            {children}
        </a>
    );
}
