import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import { Check, ChevronRight, MapPin, TrainFront } from "lucide-react";
import LrtRouteDiagram from "@/components/construction/LrtRouteDiagram";
import { PalmCrown, PALM_SWAY } from "@/components/custom/PalmTree";
import CommunityMap from "@/components/map/CommunityMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readClosures } from "@/lib/admin/closures";
import { readSchedule, scheduleStatusLabels, scheduleStatusTone } from "@/lib/admin/schedule";
import { readLrtStations } from "@/lib/lrt/stations";
import { MAPS_API_KEY } from "@/lib/maps/mapConfig";
import { closureColor, countdown, headline, timeStatus } from "@/lib/road/closureDisplay";
import { formatDate } from "@/lib/tickets/tickets";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { RoadClosure } from "@/types/road-closure";
import type { ConstructionSchedule } from "@/types/schedule";

/** The preview map shows roads only, so no shop is ever marked as affected. */
const noShops = new Set<string>();

/**
 * Home: what's happening around the Mutiara Line today. Up top, people pick where they're headed
 * and the board beside it shows the closures and works there (the roads closed right now until
 * they pick). Then the line, and the closures on a map beside the newest construction updates,
 * each leading to its own page.
 */
export default function HomePage() {
    // Read once on load, like the Road & Access map: closures that haven't ended, works not yet
    // completed, and the newest updates.
    const [{ closures, works, updates }] = useState(() => {
        const schedule = readSchedule();
        return {
            closures: readClosures().filter(
                (closure) => closure.kind === "closure" && timeStatus(closure).state !== "ended",
            ),
            works: schedule.filter((item) => item.status !== "completed"),
            updates: [...schedule]
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .slice(0, 4),
        };
    });
    const [area, setArea] = useState<string>();
    const areas = areasAlongLine([...closures, ...works].map((item) => item.area));
    const navigate = useNavigate();

    return (
        <div className="flex-1 bg-background">
            <section className="bg-logo-backdrop">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[1fr_22rem]">
                    {/* On wide screens the headline lines up with the board's top and the picker with its bottom. */}
                    <div className="flex min-w-0 flex-col justify-between gap-6">
                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Roads and works around the <MutiaraLineTitle />
                        </h1>
                        {/* Picking an area fills the board with what's happening there; picking it again clears it. */}
                        <div>
                            <p id="area-picker-label" className="font-medium text-white/85">
                                Where are you headed?
                            </p>
                            <div
                                role="group"
                                aria-labelledby="area-picker-label"
                                className="mt-3 flex flex-wrap gap-2"
                            >
                                {areas.map((name) => (
                                    <Button
                                        key={name}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        aria-pressed={area === name}
                                        onClick={() => setArea(area === name ? undefined : name)}
                                        className={cn(
                                            "group transition duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none",
                                            area === name &&
                                                "border-info bg-info text-info-foreground hover:bg-info/90 hover:text-info-foreground",
                                        )}
                                    >
                                        {area === name ? (
                                            <Check aria-hidden />
                                        ) : (
                                            <MapPin
                                                className="group-hover:animate-[pin-hop_0.5s_ease-out] motion-reduce:animate-none"
                                                aria-hidden
                                            />
                                        )}
                                        {name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <AreaBoard area={area} closures={closures} works={works} />
                </div>
            </section>

            <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
                <section aria-labelledby="line-heading">
                    <SectionHeader
                        id="line-heading"
                        title="The Mutiara Line"
                        to={PATHS.constructionInfo}
                    >
                        Stations &amp; Alignment
                    </SectionHeader>
                    <div className="mt-4">
                        <LrtRouteDiagram />
                    </div>
                </section>

                {/* Side by side on wide screens; either one fills the row when the other is missing. */}
                {(MAPS_API_KEY || updates.length > 0) && (
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-8">
                        {/* Without a Maps key the board above still lists the closures. */}
                        {MAPS_API_KEY && (
                            <section
                                aria-labelledby="map-heading"
                                className={cn(
                                    "flex min-w-0 flex-col",
                                    updates.length > 0 ? "lg:col-span-3" : "lg:col-span-5",
                                )}
                            >
                                <SectionHeader
                                    id="map-heading"
                                    title="Closures on the map"
                                    to={PATHS.roadAccess}
                                >
                                    Open Road &amp; Access
                                </SectionHeader>
                                {/* Picking a closed road opens it on the full map. */}
                                <div className="mt-4 h-80 overflow-hidden rounded-xl border shadow-sm lg:h-auto lg:min-h-80 lg:flex-1">
                                    <APIProvider apiKey={MAPS_API_KEY} region="MY" language="en">
                                        <CommunityMap
                                            closures={closures}
                                            shops={[]}
                                            onSelectShop={() => undefined}
                                            onSelectClosure={(id) =>
                                                navigate(`${PATHS.roadAccess}?closure=${id}`)
                                            }
                                            affectedShopIds={noShops}
                                            gestureHandling="cooperative"
                                        />
                                    </APIProvider>
                                </div>
                            </section>
                        )}

                        {updates.length > 0 && (
                            <section
                                aria-labelledby="works-heading"
                                className={cn(
                                    "flex min-w-0 flex-col",
                                    MAPS_API_KEY ? "lg:col-span-2" : "lg:col-span-5",
                                )}
                            >
                                <SectionHeader
                                    id="works-heading"
                                    title="Construction updates"
                                    to={PATHS.constructionUpdates}
                                >
                                    All updates
                                </SectionHeader>
                                <ul className="mt-4 flex-1 divide-y rounded-xl border bg-card px-4 py-1 shadow-sm">
                                    {updates.map((update) => (
                                        <li key={update.id}>
                                            <Link
                                                to={PATHS.constructionUpdates}
                                                className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium">
                                                        {update.title}
                                                    </span>
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {update.area} ·{" "}
                                                        {formatDate(update.startsAt)}
                                                    </span>
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "shrink-0",
                                                        scheduleStatusTone[update.status],
                                                    )}
                                                >
                                                    {scheduleStatusLabels[update.status]}
                                                </Badge>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Where the stations sit along the headline's track, as a share of its width. */
const TITLE_STOPS = [0, 0.33, 0.66, 1];

/** Two-tone shadow under each word: the brand blue, stepped. */
const TITLE_SHADOW = "[text-shadow:3px_3px_0_var(--brand-blue),6px_6px_0_rgb(39_79_142/0.45)]";

/**
 * An "i" drawn as a Penang coconut palm: a dotless i is the trunk and the crown sits where the dot
 * would be, swaying a little (still for people who ask for reduced motion).
 */
function PalmI({ front, back }: { front: string; back: string }) {
    return (
        <span className="relative inline-block">
            ı
            <svg
                viewBox="0 0 160 90"
                className={cn(
                    "pointer-events-none absolute top-[-0.46em] left-1/2 h-[1.05em] w-[1.9em] -translate-x-1/2 overflow-visible origin-[50%_69%]",
                    PALM_SWAY,
                )}
            >
                <PalmCrown front={front} back={back} />
            </svg>
        </span>
    );
}

/**
 * "Mutiara Line" on its own line under the headline: gold "Mutiara" and white "Line" with a blue
 * shadow, each "i" a coconut palm. A track under it draws in on load. Its stations pop
 * on as the line reaches them, then a small train runs it once and stops at the end. People who
 * ask for reduced motion see the finished track with the train already there.
 */
function MutiaraLineTitle() {
    return (
        <span className="relative mt-6 block w-fit pb-5 font-display text-[2rem] whitespace-nowrap sm:mt-8 sm:text-5xl lg:text-6xl">
            <span className="sr-only">Mutiara Line</span>
            {/* Decorated letters are hidden from screen readers, which read the plain text above. */}
            <span aria-hidden>
                <span className={cn("text-brand-gold", TITLE_SHADOW)}>
                    Mut
                    <PalmI front="fill-white" back="fill-brand-gold" />
                    ara
                </span>{" "}
                <span className={cn("text-white", TITLE_SHADOW)}>
                    L
                    <PalmI front="fill-brand-gold" back="fill-white" />
                    ne
                </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 h-4" aria-hidden>
                <span className="absolute inset-x-0 top-1/2 h-1 origin-left -translate-y-1/2 rounded-full bg-info animate-[line-draw_1s_ease-out_both] motion-reduce:animate-none" />
                {TITLE_STOPS.map((at) => (
                    <span
                        key={at}
                        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-info bg-logo-backdrop animate-[stop-pop_0.35s_ease-out_both] motion-reduce:animate-none"
                        style={{ left: `${at * 100}%`, animationDelay: `${at * 1000}ms` }}
                    />
                ))}
                <span className="absolute top-1/2 right-0 flex h-4 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-info text-info-foreground ring-2 ring-logo-backdrop animate-[headline-train_2.2s_ease-in-out_1.1s_both] motion-reduce:animate-none">
                    <TrainFront className="size-3" />
                </span>
            </span>
        </span>
    );
}

/** A section's heading with a link to the page that has the full list. */
function SectionHeader({
    id,
    title,
    to,
    children,
}: {
    id: string;
    title: string;
    to: string;
    children: string;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id={id} className="text-2xl font-bold text-primary">
                {title}
            </h2>
            <Link
                to={to}
                className="group inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
            >
                {children}
                <ChevronRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                />
            </Link>
        </div>
    );
}

/** The areas named in the data, ordered south to north along the line; any off the line go last. */
function areasAlongLine(names: string[]): string[] {
    const order = readLrtStations().map((station) => station.area);
    const rank = (name: string) => {
        const index = order.indexOf(name);
        return index === -1 ? order.length : index;
    };
    return [...new Set(names)].sort((a, b) => rank(a) - rank(b));
}

/**
 * Beside the headline: the roads closed right now, or, once an area is picked, every closure and
 * unfinished work there. Closures take their map line colour and open on Road & Access; works open
 * Construction Updates. The pulsing dot marks the closed-now list as live.
 */
function AreaBoard({
    area,
    closures,
    works,
}: {
    area?: string;
    closures: RoadClosure[];
    works: ConstructionSchedule[];
}) {
    const shownClosures = area
        ? closures.filter((closure) => closure.area === area)
        : closures.filter((closure) => timeStatus(closure).state === "now");
    const shownWorks = area ? works.filter((item) => item.area === area) : [];
    const count = shownClosures.length + shownWorks.length;

    return (
        <section
            aria-labelledby="board-heading"
            aria-live="polite"
            className="flex h-56 min-w-0 flex-col rounded-xl lg:h-auto lg:min-h-60 border bg-card p-4 text-card-foreground shadow-md"
        >
            <div className="flex items-center justify-between gap-3">
                <h2 id="board-heading" className="flex items-center gap-2 text-sm font-semibold">
                    {area ? (
                        <MapPin className="size-4 text-primary" aria-hidden />
                    ) : (
                        <span className="relative flex size-2" aria-hidden>
                            <span className="absolute inline-flex size-full rounded-full bg-destructive opacity-75 motion-safe:animate-ping" />
                            <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                        </span>
                    )}
                    {area ? `Around ${area}` : "Closed now"}
                </h2>
                <span className="text-xs text-muted-foreground">
                    {area
                        ? `${count} ${count === 1 ? "item" : "items"}`
                        : `${count} ${count === 1 ? "road" : "roads"}`}
                </span>
            </div>

            {count === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                    {area
                        ? `No closures or works around ${area} right now.`
                        : "No roads are closed right now. Pick an area to see what's coming up."}
                </p>
            ) : (
                // The board keeps its size (on wide screens, the height of the headline and picker beside it);
                // a long list scrolls inside it. contain-size stops the list itself from making the board taller.
                <ul className="-mx-2 mt-1 min-h-0 flex-1 divide-y overflow-y-auto px-2 contain-size">
                    {shownClosures.map((closure) => (
                        <li key={closure.id}>
                            <BoardRow
                                to={`${PATHS.roadAccess}?closure=${closure.id}`}
                                color={closureColor(closure)}
                                title={closure.road}
                                detail={
                                    area
                                        ? headline(closure)
                                        : `${headline(closure)} · ${closure.area}`
                                }
                                aside={countdown(closure)}
                            />
                        </li>
                    ))}
                    {shownWorks.map((item) => (
                        <li key={item.id}>
                            <BoardRow
                                to={PATHS.constructionUpdates}
                                title={item.title}
                                detail={`Works from ${formatDate(item.startsAt)}`}
                                aside={
                                    <Badge
                                        variant="outline"
                                        className={scheduleStatusTone[item.status]}
                                    >
                                        {scheduleStatusLabels[item.status]}
                                    </Badge>
                                }
                            />
                        </li>
                    ))}
                </ul>
            )}

            {area && (
                <Link
                    to={PATHS.roadAccess}
                    className="group mt-3 inline-flex items-center gap-0.5 self-start text-sm font-medium text-primary hover:underline"
                >
                    See on the map
                    <ChevronRight
                        className="size-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                    />
                </Link>
            )}
        </section>
    );
}

/** One line on the board: a colour bar (closures only), the title and detail, then a note on the right. */
function BoardRow({
    to,
    color,
    title,
    detail,
    aside,
}: {
    to: string;
    color?: string;
    title: string;
    detail: string;
    aside?: ReactNode;
}) {
    return (
        <Link
            to={to}
            className="group -mx-2 flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {color && (
                <span
                    className="h-7 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                />
            )}
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{title}</span>
                <span className="block truncate text-xs text-muted-foreground">{detail}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">{aside}</span>
            <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
            />
        </Link>
    );
}
