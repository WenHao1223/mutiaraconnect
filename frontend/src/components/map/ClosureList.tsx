import { useEffect, useRef } from "react";
import { CalendarDays, Clock, ExternalLink, Footprints, Moon } from "lucide-react";
import { googleMapsStretchUrl } from "@/lib/maps/maps";
import {
    closureColor,
    countdown,
    headline,
    hoursLabel,
    isNightWork,
    TIME_LABEL,
    timeStatus,
    type TimeState,
} from "@/lib/road/closureDisplay";
import { formatDate } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import type { RoadClosure } from "@/types/road-closure";

export type ClosureTab = Exclude<TimeState, "ended">;
const CLOSURE_TABS: ClosureTab[] = ["now", "later", "upcoming"];

interface ClosureListProps {
    closures: RoadClosure[];
    tab: ClosureTab;
    onTabChange: (tab: ClosureTab) => void;
    selectedId?: string;
    onSelect: (id: string | undefined) => void;
}

/** The "Road closures" side-panel tab: Closed now / Closing later / Upcoming, each row expandable. */
export default function ClosureList({ closures, tab, onTabChange, selectedId, onSelect }: ClosureListProps) {
    const selectedRef = useRef<HTMLLIElement>(null);
    useEffect(() => {
        selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [selectedId]);

    const inTab = (value: ClosureTab) => closures.filter((closure) => timeStatus(closure).state === value);
    const shown = inTab(tab);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="grid grid-cols-3 gap-1 border-b p-2" role="tablist" aria-label="When">
                {CLOSURE_TABS.map((value) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        onClick={() => onTabChange(value)}
                        className={cn(
                            "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                            tab === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                        )}
                    >
                        {TIME_LABEL[value]} ({inTab(value).length})
                    </button>
                ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {shown.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                        {tab === "now"
                            ? "No roads are closed right now."
                            : tab === "later"
                              ? "No roads are closing later today."
                              : "No closures are scheduled yet."}
                    </p>
                ) : (
                    <ul className="divide-y">
                        {shown.map((closure) => {
                            const selected = closure.id === selectedId;
                            const closedNow = timeStatus(closure).state === "now";
                            return (
                                <li key={closure.id} ref={selected ? selectedRef : undefined}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(selected ? undefined : closure.id)}
                                        aria-expanded={selected}
                                        className={cn(
                                            "flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                                            selected && "bg-muted/70",
                                        )}
                                    >
                                        <span
                                            className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: closureColor(closure), opacity: closedNow ? 1 : 0.55 }}
                                            aria-hidden
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-start justify-between gap-2">
                                                <span className="truncate text-sm font-semibold">{closure.title}</span>
                                                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                                                    {countdown(closure)}
                                                </span>
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {closure.area}
                                            </span>
                                            <span className="mt-0.5 block text-xs font-medium">{headline(closure)}</span>
                                        </span>
                                    </button>
                                    {selected && (
                                        <div className="space-y-1.5 bg-muted/30 px-3 pb-3 pl-7 text-sm motion-safe:animate-in motion-safe:fade-in">
                                            {closure.reason && (
                                                <p>
                                                    <span className="font-semibold">Reason: </span>
                                                    {closure.reason}
                                                </p>
                                            )}
                                            {closure.pedestrian && (
                                                <p className="flex gap-1.5">
                                                    <Footprints className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />
                                                    {closure.pedestrian}
                                                </p>
                                            )}
                                            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    {isNightWork(closure.hours) ? (
                                                        <Moon className="size-3.5" aria-hidden />
                                                    ) : (
                                                        <Clock className="size-3.5" aria-hidden />
                                                    )}
                                                    {hoursLabel(closure.hours)}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays className="size-3.5" aria-hidden />
                                                    {formatDate(closure.startAt)} – {formatDate(closure.endAt)}
                                                </span>
                                            </p>
                                            {closure.path && closure.path.length > 1 && (
                                                <a
                                                    href={googleMapsStretchUrl(closure.path)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                >
                                                    View road in Google Maps <ExternalLink className="size-3" aria-hidden />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
