import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, ExternalLink, HardHat, Info, MapPin, Search, Store, TrafficCone, type LucideIcon } from "lucide-react";
import LocationPicker from "@/components/custom/LocationPicker";
import MapsLink from "@/components/custom/MapsLink";
import { badgeVariants } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readAllPremises } from "@/lib/admin/users";
import { currentNotices, noticeTypeStyles, worksNear } from "@/lib/business/business";
import { AFFECTED_RADIUS_KM, isWithinRadius } from "@/lib/maps/geo";
import { formatDate } from "@/lib/tickets/tickets";
import type { Coordinates } from "@/lib/maps/maps";
import { cn } from "@/lib/utils";
import { tone } from "@/lib/tones";
import { PATHS } from "@/routes";
import type { RoadClosure } from "@/types/road-closure";
import type { ConstructionSchedule } from "@/types/schedule";

const ALL_AREAS = "__all__";

/** One icon per notice type, used in the colour key and the shop rows. */
const typeIcons: Record<keyof typeof noticeTypeStyles, LucideIcon> = {
    closure: TrafficCone,
    construction: HardHat,
    access: Info,
};
const ignoreLocationChange = () => undefined;

interface TimelineItem {
    id: string;
    type: keyof typeof noticeTypeStyles;
    title: string;
    detail?: string;
    alternative?: string;
    when: string;
    location?: Coordinates;
}

/** A shop's notices and works as timeline entries, soonest to end first. */
function timeline({ notices, works }: { notices: RoadClosure[]; works: ConstructionSchedule[] }): TimelineItem[] {
    const fromNotices = [...notices]
        .sort((a, b) => a.endAt.localeCompare(b.endAt))
        .map((notice) => ({
            id: notice.id,
            type: notice.kind,
            title: notice.title,
            detail: notice.reason,
            alternative: notice.alternative,
            when: `Until ${formatDate(notice.endAt)}`,
            location: notice,
        }));
    const fromWorks = works.map((item) => ({
        id: item.id,
        type: "construction" as const,
        title: item.title,
        detail: item.description,
        when: `${formatDate(item.startsAt)} – ${formatDate(item.endsAt)}`,
    }));
    return [...fromNotices, ...fromWorks];
}

/** Public page: shops affected by the works, what changed, how to reach them, and that they're open. */
export default function BusinessNoticesPage() {
    const [query, setQuery] = useState("");
    const [areaFilter, setAreaFilter] = useState(ALL_AREAS);
    const [selectedId, setSelectedId] = useState<string>();

    const closures = currentNotices();
    const affected = readAllPremises()
        .map((premise) => {
            const notices = closures.filter((closure) => isWithinRadius(premise, closure, AFFECTED_RADIUS_KM));
            const works = worksNear(premise);
            // Shops don't store an area; use the first one their notices or works mention.
            const area = [...notices, ...works].map((item) => item.area).find(Boolean) ?? "Other";
            return { premise, notices, works, area };
        })
        .filter(({ notices, works }) => notices.length > 0 || works.length > 0);

    const areas = [...new Set(affected.map(({ area }) => area))].sort();
    const text = query.trim().toLowerCase();
    const visible = affected.filter(
        ({ premise, area }) =>
            (areaFilter === ALL_AREAS || area === areaFilter) &&
            `${premise.name} ${premise.address} ${area}`.toLowerCase().includes(text),
    );
    const selected = visible.find(({ premise }) => premise.id === selectedId) ?? visible[0];

    return (
        <div className="flex-1 bg-background">
            <section className="border-b bg-muted/50">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-hazard" aria-hidden />
                        Community
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">Local Businesses</h1>
                    <p className="mt-1 max-w-2xl text-muted-foreground">
                        Shops near the LRT works are still open. Here's what has changed around them and how to
                        reach them while roads and entrances are affected.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
                {affected.length === 0 ? (
                    <div className="rounded-lg bg-muted px-4 py-8 text-center">
                        <Store className="mx-auto size-8 text-muted-foreground" aria-hidden />
                        <p className="mt-2 text-sm font-medium">No shops are affected by current works</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Notices appear here when a closure or access change is near a registered shop.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
                        <div className="rounded-xl border bg-card p-5 shadow-sm">
                            <h2 className="text-lg font-semibold">Affected shops</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {affected.length === 1
                                    ? "1 shop is affected by current works."
                                    : `${affected.length} shops are affected by current works.`}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <div className="relative min-w-40 flex-1">
                                    <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search shop or address…"
                                        className="pl-8"
                                        aria-label="Search shops"
                                    />
                                </div>
                                <Select value={areaFilter} onValueChange={setAreaFilter}>
                                    <SelectTrigger className="w-36" aria-label="Filter by area">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_AREAS}>All areas</SelectItem>
                                        {areas.map((area) => (
                                            <SelectItem key={area} value={area}>
                                                {area}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Colour key">
                                {(Object.keys(noticeTypeStyles) as (keyof typeof noticeTypeStyles)[]).map((type) => {
                                    const Icon = typeIcons[type];
                                    return (
                                        <li
                                            key={type}
                                            className={cn(
                                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                                                noticeTypeStyles[type].tag,
                                            )}
                                        >
                                            <Icon className="size-3" aria-hidden /> {noticeTypeStyles[type].label}
                                        </li>
                                    );
                                })}
                            </ul>

                            {visible.length === 0 ? (
                                <p className="mt-4 rounded-lg bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                                    No shops match your search.
                                </p>
                            ) : (
                                <ul className="mt-3 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                                    {visible.map(({ premise, notices, works, area }) => {
                                        const isSelected = premise.id === selected?.premise.id;
                                        const counts = [
                                            { type: "closure" as const, count: notices.filter((n) => n.kind === "closure").length },
                                            { type: "access" as const, count: notices.filter((n) => n.kind === "access").length },
                                            { type: "construction" as const, count: works.length },
                                        ].filter(({ count }) => count > 0);
                                        return (
                                            <li key={premise.id}>
                                                <button
                                                    type="button"
                                                    aria-current={isSelected ? "true" : undefined}
                                                    onClick={() => setSelectedId(premise.id)}
                                                    className={cn(
                                                        "w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                        isSelected && "border-primary bg-accent",
                                                    )}
                                                >
                                                    <span className="flex items-center justify-between gap-3">
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-semibold">{premise.name}</span>
                                                            <span className="mt-0.5 block text-xs text-muted-foreground">{area}</span>
                                                        </span>
                                                        <span className="flex shrink-0 gap-1.5">
                                                            {counts.map(({ type, count }) => {
                                                                const Icon = typeIcons[type];
                                                                const label = `${count} ${noticeTypeStyles[type].label}`;
                                                                return (
                                                                    <span
                                                                        key={type}
                                                                        title={label}
                                                                        aria-label={label}
                                                                        className={cn(
                                                                            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                                                                            noticeTypeStyles[type].tag,
                                                                        )}
                                                                    >
                                                                        <Icon className="size-3" aria-hidden /> {count}
                                                                    </span>
                                                                );
                                                            })}
                                                        </span>
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {selected && (
                            <Card className="lg:sticky lg:top-24">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Store className="size-4" /> {selected.premise.name}
                                        </CardTitle>
                                        <span
                                            className={cn(
                                                badgeVariants({ variant: "outline" }),
                                                "whitespace-nowrap rounded-full",
                                                tone.success,
                                            )}
                                        >
                                            Still open for business
                                        </span>
                                    </div>
                                    <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="inline-flex items-center gap-1.5">
                                            <MapPin className="size-4" aria-hidden />
                                            {selected.premise.address || "Pinned on the map"}
                                        </span>
                                        <MapsLink location={selected.premise}>
                                            Open in Google Maps <ExternalLink className="size-3" aria-hidden />
                                        </MapsLink>
                                        {/* Opens the shop on the Road & Access map, with the closures around it. */}
                                        <Link
                                            to={`${PATHS.roadAccess}?shop=${selected.premise.id}`}
                                            className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                                        >
                                            View on map <ChevronRight className="size-3.5" aria-hidden />
                                        </Link>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <LocationPicker
                                        readOnly
                                        hideCaption
                                        recenterKey={selected.premise.id}
                                        value={{
                                            latitude: selected.premise.latitude,
                                            longitude: selected.premise.longitude,
                                            address: selected.premise.address,
                                        }}
                                        onChange={ignoreLocationChange}
                                    />
                                    <section aria-labelledby="whats-affected">
                                        <h3
                                            id="whats-affected"
                                            className="flex items-center gap-2 text-sm font-semibold text-primary"
                                        >
                                            What's affected
                                        </h3>
                                        {/* Same timeline as a ticket's History, with an icon per type on the line. */}
                                        <ol className="ml-3.5 mt-4 space-y-6 border-l pl-6">
                                            {timeline(selected).map((item) => {
                                                const Icon = typeIcons[item.type];
                                                const style = noticeTypeStyles[item.type];
                                                return (
                                                    <li key={item.id} className="relative">
                                                        <span
                                                            aria-hidden
                                                            className="absolute left-[-2.4rem] top-0 rounded-full bg-card ring-4 ring-card"
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "flex size-7 items-center justify-center rounded-full",
                                                                    style.tag,
                                                                )}
                                                            >
                                                                <Icon className="size-3.5" />
                                                            </span>
                                                        </span>
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            <p className="font-semibold">{item.title}</p>
                                                            <span
                                                                title={style.label}
                                                                aria-label={style.label}
                                                                className={cn("inline-flex rounded p-1", style.tag)}
                                                            >
                                                                <Icon className="size-3" aria-hidden />
                                                            </span>
                                                        </div>
                                                        {item.detail && (
                                                            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                                                        )}
                                                        {item.alternative && (
                                                            <p className="mt-1.5 flex items-start gap-1.5 text-sm">
                                                                <ArrowRight
                                                                    className="mt-0.5 size-4 shrink-0 text-success"
                                                                    aria-hidden
                                                                />
                                                                {item.alternative}
                                                            </p>
                                                        )}
                                                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                            <span>{item.when}</span>
                                                            {item.location && (
                                                                <MapsLink location={item.location}>
                                                                    Open in Google Maps{" "}
                                                                    <ExternalLink className="size-3" aria-hidden />
                                                                </MapsLink>
                                                            )}
                                                        </p>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    </section>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
