import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TrainFront } from "lucide-react";
import StationDetailsDialog from "@/components/construction/StationDetailsDialog";
import lrtPhoto from "@/assets/penang-lrt.png";
import { Badge } from "@/components/ui/badge";
import { scheduleStatusLabels, scheduleStatusTone } from "@/lib/admin/schedule";
import { readLrtStations, readStationsByLine } from "@/lib/lrt/stations";
import { cn } from "@/lib/utils";
import type { LrtStation, StationConstructionStatus } from "@/types/lrt";

/** The diagram is drawn in a 1000 x 450 box that scales to its container. */
const VIEW_W = 1000;
const VIEW_H = 450;

/** The route as one line: along the bottom, up the right side, back along the top. */
const LEFT = 70;
const RIGHT = 820;
const TOP = 70;
const BOTTOM = 360;
const BEND = 70;
const ROUTE = [
    `M ${LEFT} ${BOTTOM}`,
    `H ${RIGHT - BEND}`,
    `A ${BEND} ${BEND} 0 0 0 ${RIGHT} ${BOTTOM - BEND}`,
    `V ${TOP + BEND}`,
    `A ${BEND} ${BEND} 0 0 0 ${RIGHT - BEND} ${TOP}`,
    `H ${LEFT}`,
].join(" ");

/** How far the cross-channel stop sits off the line, in the same units. */
const BRANCH_LENGTH = 110;

/** How long the line takes to draw, and how long the train takes to run the route. */
const DRAW_MS = 2400;
const TRAIN_SECONDS = 26;

type Side = "top" | "bottom" | "left" | "right";

interface Stop {
    station: LrtStation;
    x: number;
    y: number;
    /** Where the name goes, away from the line. */
    side: Side;
    /** How far along the line (0 to 1), which sets when the station appears while it draws. */
    along: number;
}

/** The side of the line a direction points to. */
function sideOf(x: number, y: number): Side {
    return Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "bottom" : "top";
}

/** Each station's ring and its fill on hover, in the colour of its construction status. */
const ring: Record<StationConstructionStatus, string> = {
    upcoming: "border-info group-hover:bg-info group-hover:text-info-foreground",
    ongoing: "border-hazard group-hover:bg-hazard group-hover:text-hazard-foreground",
    completed: "border-success group-hover:bg-success group-hover:text-success-foreground",
};

const labelPosition: Record<Side, string> = {
    top: "bottom-full mb-1.5 left-1/2 -translate-x-1/2 text-center",
    bottom: "top-full mt-1.5 left-1/2 -translate-x-1/2 text-center",
    left: "right-full mr-2 top-1/2 -translate-y-1/2 text-right",
    right: "left-full ml-2 top-1/2 -translate-y-1/2 text-left",
};

const statuses: StationConstructionStatus[] = ["upcoming", "ongoing", "completed"];

/**
 * The Mutiara Line as a transit diagram: every station on one route, in its construction status
 * colour. When it scrolls into view the line draws from the first station to the last, each
 * station appears as the line reaches it, then a train runs the route. Hovering a station shows
 * its progress; clicking opens a summary anchored to that station. Everything is laid out from
 * the station list, and holds still for people who ask for reduced motion.
 */
export default function LrtRouteDiagram() {
    const stations = useMemo(() => readLrtStations(), []);
    const branch = useMemo(() => readStationsByLine("cross_channel"), []);
    const reduced = useMemo(
        () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        [],
    );

    const frameRef = useRef<HTMLDivElement>(null);
    const routeRef = useRef<SVGPathElement>(null);
    const [stops, setStops] = useState<Stop[]>([]);
    const [spur, setSpur] = useState<{ from: Stop; stop: Stop }>();
    const [shown, setShown] = useState(reduced);
    const [running, setRunning] = useState(false);
    // Place the stations evenly along the line, with each name on the side facing away from it.
    // The cross-channel station hangs off the station it branches from, towards the inside.
    useLayoutEffect(() => {
        const route = routeRef.current;
        if (!route) return;
        const main = stations.filter((station) => station.line === "island_mainline");
        const length = route.getTotalLength();
        const placed = main.map((station, index): Stop => {
            const along = main.length > 1 ? index / (main.length - 1) : 0;
            const at = route.getPointAtLength(along * length);
            const before = route.getPointAtLength(Math.max(0, along * length - 2));
            const after = route.getPointAtLength(Math.min(length, along * length + 2));
            // The right-hand side of the direction of travel faces away from the inside of the loop.
            const side = sideOf(-(after.y - before.y), after.x - before.x);
            return { station, x: at.x, y: at.y, side, along };
        });
        setStops(placed);

        const [joint] = branch.filter((station) => station.line === "island_mainline");
        const [spurStation] = branch.filter((station) => station.line === "cross_channel");
        const from = placed.find((stop) => stop.station.id === joint?.id);
        if (from && spurStation) {
            const inward = { top: [0, 1], bottom: [0, -1], left: [1, 0], right: [-1, 0] }[
                from.side
            ];
            setSpur({
                from,
                stop: {
                    station: spurStation,
                    x: from.x + inward[0] * BRANCH_LENGTH,
                    y: from.y + inward[1] * BRANCH_LENGTH,
                    side: sideOf(inward[0], inward[1]),
                    along: Math.min(1, from.along + 0.04),
                },
            });
        }
    }, [stations, branch]);

    // Start drawing once the diagram is in view, and send the train once the line has been drawn.
    useEffect(() => {
        const frame = frameRef.current;
        if (!frame || shown) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                setShown(true);
                observer.disconnect();
            },
            { threshold: 0.35 },
        );
        observer.observe(frame);
        return () => observer.disconnect();
    }, [shown]);
    useEffect(() => {
        if (!shown || reduced) return;
        const timer = window.setTimeout(() => setRunning(true), DRAW_MS);
        return () => window.clearTimeout(timer);
    }, [shown, reduced]);

    // Each station appears as the line reaches it.
    const delay = (along: number) => ({
        transitionDelay: reduced ? undefined : `${along * DRAW_MS}ms`,
    });

    const renderStop = ({ station, x, y, side, along }: Stop) => (
        <StationDetailsDialog
            key={station.id}
            station={station}
            side={side === "bottom" ? "top" : "bottom"}
        >
            <button
                type="button"
                aria-label={`${station.code} ${station.name}, ${scheduleStatusLabels[station.status]}, ${station.progress}% done`}
                className={cn(
                    "group absolute z-10 cursor-pointer -translate-x-1/2 -translate-y-1/2 transition duration-300 focus-visible:outline-none motion-reduce:transition-none",
                    shown ? "scale-100 opacity-100" : "scale-50 opacity-0",
                )}
                style={{
                    left: `${(x / VIEW_W) * 100}%`,
                    top: `${(y / VIEW_H) * 100}%`,
                    ...delay(along),
                }}
            >
                <span
                    className={cn(
                        "grid size-9 place-items-center rounded-full border-4 bg-card text-[11px] font-bold text-foreground transition duration-200 group-hover:scale-110 group-data-[state=open]:ring-2 group-data-[state=open]:ring-primary/40 group-data-[state=open]:ring-offset-2 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background motion-reduce:transition-none",
                        ring[station.status],
                    )}
                >
                    {station.code}
                </span>
                <span
                    className={cn(
                        "absolute w-28 text-xs leading-tight font-semibold text-foreground",
                        labelPosition[side],
                    )}
                >
                    {station.name}
                </span>
            </button>
        </StationDetailsDialog>
    );

    return (
        <div className="relative isolate overflow-hidden rounded-xl border bg-card p-4 shadow-sm sm:p-6">
            {/* A photo of the train sits faintly behind the diagram, faded out towards the edges. */}
            <img
                src={lrtPhoto}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-15 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)]"
            />
            <ul
                className="flex flex-wrap items-center gap-x-4 gap-y-2"
                aria-label="Station colours"
            >
                {statuses.map((status) => (
                    <li key={status}>
                        <Badge variant="outline" className={scheduleStatusTone[status]}>
                            {scheduleStatusLabels[status]}
                        </Badge>
                    </li>
                ))}
                {spur && (
                    <li className="flex items-center gap-2 text-xs text-muted-foreground">
                        <svg width="28" height="6" aria-hidden>
                            <line
                                x1="0"
                                y1="3"
                                x2="28"
                                y2="3"
                                className="stroke-primary"
                                strokeWidth="3"
                                strokeDasharray="6 5"
                            />
                        </svg>
                        Cross-channel link
                    </li>
                )}
                <li className="ml-auto text-xs text-muted-foreground">
                    Pick a station for its progress
                </li>
            </ul>

            {/* The loop needs a wide screen; narrower ones get the stations top to bottom instead. */}
            <StationList stations={stations} branch={branch} />
            <div className="mt-4 hidden lg:block">
                <div ref={frameRef} className="relative aspect-[1000/450] min-w-[760px]">
                    <svg
                        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                        className="absolute inset-0 size-full"
                        aria-hidden
                    >
                        <path
                            d={ROUTE}
                            className="fill-none stroke-muted"
                            strokeWidth="8"
                            strokeLinecap="round"
                        />
                        <path
                            ref={routeRef}
                            d={ROUTE}
                            pathLength={1}
                            className="fill-none stroke-primary"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="1 1"
                            style={{
                                strokeDashoffset: shown ? 0 : 1,
                                transition: reduced
                                    ? undefined
                                    : `stroke-dashoffset ${DRAW_MS}ms ease-in-out`,
                            }}
                        />
                        {spur && (
                            <line
                                x1={spur.from.x}
                                y1={spur.from.y}
                                x2={spur.stop.x}
                                y2={spur.stop.y}
                                className="stroke-primary transition-opacity duration-300 motion-reduce:transition-none"
                                strokeWidth="5"
                                strokeDasharray="10 8"
                                style={{ opacity: shown ? 1 : 0, ...delay(spur.stop.along) }}
                            />
                        )}
                        {/* The train, running the whole route once the line is drawn. */}
                        {running && (
                            <g>
                                <animateMotion
                                    dur={`${TRAIN_SECONDS}s`}
                                    repeatCount="indefinite"
                                    path={ROUTE}
                                    rotate="0"
                                />
                                <rect
                                    x="-17"
                                    y="-13"
                                    width="34"
                                    height="26"
                                    rx="13"
                                    className="fill-primary stroke-card"
                                    strokeWidth="3"
                                />
                                <TrainFront
                                    x={-9}
                                    y={-9}
                                    size={18}
                                    className="text-primary-foreground"
                                    aria-hidden
                                />
                            </g>
                        )}
                    </svg>

                    {stops.map(renderStop)}
                    {spur && renderStop(spur.stop)}
                </div>
            </div>

        </div>
    );
}

/** One station on the narrow-screen list: its code ring, name, and progress written out. */
function StationRow({ station }: { station: LrtStation }) {
    return (
        <StationDetailsDialog station={station}>
            <button
                type="button"
                className="group flex w-full cursor-pointer items-center gap-3 rounded-md py-1.5 text-left data-[state=open]:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <span
                    className={cn(
                        "relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-4 bg-card text-[11px] font-bold text-foreground transition-colors duration-200 motion-reduce:transition-none",
                        ring[station.status],
                    )}
                >
                    {station.code}
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{station.name}</span>
                    <span className="block text-xs text-muted-foreground">
                        {scheduleStatusLabels[station.status]} · {station.progress}%
                    </span>
                </span>
            </button>
        </StationDetailsDialog>
    );
}

/**
 * The same line top to bottom for phones and tablets, where the loop would be too small to read.
 * The cross-channel station hangs off the station it branches from on a dashed line.
 */
function StationList({ stations, branch }: { stations: LrtStation[]; branch: LrtStation[] }) {
    const main = stations.filter((station) => station.line === "island_mainline");
    const joint = branch.find((station) => station.line === "island_mainline");
    const spurStation = branch.find((station) => station.line === "cross_channel");

    return (
        <ol className="relative mt-4 lg:hidden">
            {/* The line, running between the first and last station's rings. */}
            <span
                className="absolute top-6 bottom-6 left-[18px] w-1 -translate-x-1/2 rounded-full bg-primary"
                aria-hidden
            />
            {main.map((station) => (
                <li key={station.id}>
                    <StationRow station={station} />
                    {spurStation && station.id === joint?.id && (
                        <div className="ml-[18px] flex items-center">
                            <span
                                className="w-6 border-t-[3px] border-dashed border-primary"
                                aria-hidden
                            />
                            <StationRow station={spurStation} />
                        </div>
                    )}
                </li>
            ))}
        </ol>
    );
}
