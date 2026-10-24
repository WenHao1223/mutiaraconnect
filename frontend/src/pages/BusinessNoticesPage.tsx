import { useState } from "react";
import { ExternalLink, MapPin, Search, Store } from "lucide-react";
import AccessNotices from "@/components/business/AccessNotices";
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
import { cn } from "@/lib/utils";
import { tone } from "@/lib/tones";

const ALL_AREAS = "__all__";
const ignoreLocationChange = () => undefined;

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
                                {Object.values(noticeTypeStyles).map(({ label, tag }) => (
                                    <li key={label} className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", tag)}>
                                        {label}
                                    </li>
                                ))}
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
                                            { ...noticeTypeStyles.closure, count: notices.filter((n) => n.kind === "closure").length },
                                            { ...noticeTypeStyles.access, count: notices.filter((n) => n.kind === "access").length },
                                            { ...noticeTypeStyles.construction, count: works.length },
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
                                                    <span className="block text-sm font-semibold">{premise.name}</span>
                                                    <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                                                        {area} · {premise.address || "Pinned on the map"}
                                                    </span>
                                                    <span className="mt-2 flex flex-wrap gap-1.5">
                                                        {counts.map(({ label, tag, count }) => (
                                                            <span
                                                                key={label}
                                                                className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", tag)}
                                                            >
                                                                {count} {label}
                                                            </span>
                                                        ))}
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
                                    {selected.notices.length > 0 && (
                                        <AccessNotices closures={selected.notices} title="What's affected" />
                                    )}
                                    {selected.works.map((item) => (
                                        <article
                                            key={item.id}
                                            className={cn(
                                                "rounded-lg border border-l-4 bg-card p-5",
                                                noticeTypeStyles.construction.edge,
                                            )}
                                        >
                                            <div className="flex justify-between gap-3">
                                                <div>
                                                    <span
                                                        className={cn(
                                                            "rounded px-1.5 py-0.5 text-[11px] font-medium",
                                                            noticeTypeStyles.construction.tag,
                                                        )}
                                                    >
                                                        {noticeTypeStyles.construction.label}
                                                    </span>
                                                    <h3 className="mt-1.5 text-lg font-semibold">{item.title}</h3>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{item.area}</span>
                                            </div>
                                            <p className="mt-2 text-sm">{item.description}</p>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {formatDate(item.startsAt)} – {formatDate(item.endsAt)}
                                            </p>
                                        </article>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
