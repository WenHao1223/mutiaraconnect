import { TrainFront } from "lucide-react";
import { nearestStation } from "@/lib/lrt/stations";
import { formatDistance } from "@/lib/maps/geo";
import type { Coordinates } from "@/lib/maps/maps";
import { cn } from "@/lib/utils";

/** "Nearest station: Komtar · 109 m" for a pin. Shared by the ticket form and ticket details. */
export default function NearestStation({
    point,
    className,
}: {
    point: Coordinates;
    className?: string;
}) {
    const { station, km } = nearestStation(point);
    return (
        <p className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", className)}>
            <TrainFront className="size-4 shrink-0" aria-hidden />
            Nearest station: {station.name} · {formatDistance(km)}
        </p>
    );
}
