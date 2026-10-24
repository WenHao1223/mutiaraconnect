import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Car, ExternalLink, Footprints, MapPin, Navigation, Siren } from "lucide-react";
import MapsLink from "@/components/custom/MapsLink";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CLOSURE_STATUS_LABEL, CLOSURE_STATUS_TONE } from "@/lib/maps/mapConfig";
import { formatDate } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { RoadClosure } from "@/types/road-closure";

interface ClosureCardProps {
    closure: RoadClosure;
}

/** One road closure on the Road & Access page: what's closed, then how drivers, pedestrians and emergency vehicles get past. */
export default function ClosureCard({ closure }: ClosureCardProps) {
    const ended = closure.status === "ended";

    return (
        <Card className={cn("overflow-hidden shadow-sm md:flex", ended && "opacity-70")}>
            <div className="space-y-2 border-b bg-primary/5 p-4 md:w-72 md:shrink-0 md:border-b-0 md:border-r">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-muted-foreground">{closure.id}</span>
                    <Badge variant="outline" className={CLOSURE_STATUS_TONE[closure.status]}>
                        {CLOSURE_STATUS_LABEL[closure.status]}
                    </Badge>
                </div>
                <h3 className="text-base font-semibold leading-tight text-primary">{closure.title}</h3>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {[closure.road, closure.area].filter(Boolean).join(" · ")}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                    {formatDate(closure.startAt)} – {formatDate(closure.endAt)}
                </p>
                {closure.reason && <p className="text-xs">{closure.reason}</p>}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <dl className="grid gap-4 sm:grid-cols-3">
                    <AccessNote icon={<Car aria-hidden />} label="Detour" text={closure.alternative} />
                    <AccessNote icon={<Footprints aria-hidden />} label="Pedestrians" text={closure.pedestrian} />
                    <AccessNote icon={<Siren aria-hidden />} label="Emergency" text={closure.emergency} />
                </dl>

                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs">
                    {!ended && (
                        <Link
                            to={`${PATHS.home}?closure=${closure.id}`}
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                            View on map <MapPin className="size-3" aria-hidden />
                        </Link>
                    )}
                    <MapsLink location={closure}>
                        Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                    </MapsLink>
                    {!ended && (
                        <MapsLink location={closure} mode="walking">
                            Walking directions <Navigation className="size-3" aria-hidden />
                        </MapsLink>
                    )}
                </div>
            </div>
        </Card>
    );
}

interface AccessNoteProps {
    icon: ReactNode;
    label: string;
    text?: string;
}

function AccessNote({ icon, label, text }: AccessNoteProps) {
    return (
        <div className="space-y-1">
            <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground [&_svg]:size-3.5">
                {icon}
                {label}
            </dt>
            <dd className="text-sm">{text || <span className="text-muted-foreground">No details given</span>}</dd>
        </div>
    );
}
