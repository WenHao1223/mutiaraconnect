import {
    ArrowLeft,
    Car,
    ExternalLink,
    Footprints,
    HardHat,
    Info,
    Loader2,
    LocateFixed,
    MapPin,
    Route,
    TriangleAlert,
} from "lucide-react";
import { AddressSearch } from "@/components/custom/LocationPicker";
import { Button } from "@/components/ui/button";
import type { LocationStatus } from "@/hooks/use-geolocation";
import { formatDistance } from "@/lib/maps/geo";
import { googleMapsRouteUrl, type Coordinates } from "@/lib/maps/maps";
import { closureColor, countdown, distanceToClosure, headline, timeStatus } from "@/lib/road/closureDisplay";
import { ORS_API_KEY, type PlannedRoute } from "@/lib/road/routing";
import { tone } from "@/lib/tones";
import type { RoadClosure } from "@/types/road-closure";
import type { ConstructionSchedule } from "@/types/schedule";
import type { BusinessProfile } from "@/types/user";

/** "On this road" when the shop fronts the closed stretch, otherwise "120 m away". */
function distanceAway(shop: BusinessProfile, closure: RoadClosure): string {
    const km = distanceToClosure(shop, closure);
    return km < 0.03 ? "On this road" : `${formatDistance(km)} away`;
}

interface ShopDetailProps {
    shop: BusinessProfile;
    /** Road closures near the shop, nearest first. */
    nearbyClosures: RoadClosure[];
    /** Access notices (entrance, loading, parking changes) for this shop. */
    notices: RoadClosure[];
    works: ConstructionSchedule[];
    onBack: () => void;
    onSelectClosure: (id: string) => void;
    /** Start of the route: the visitor's location or an address they searched. */
    origin?: Coordinates;
    onOriginChange: (origin: Coordinates) => void;
    locationStatus: LocationStatus;
    locationError?: string;
    onUseMyLocation: () => void;
    route?: PlannedRoute;
    routing: boolean;
    routeError?: string;
}

/** Side-panel view of one shop: which closures affect it, its access notices, and a route that avoids closed roads. */
export default function ShopDetail({
    shop,
    nearbyClosures,
    notices,
    works,
    onBack,
    onSelectClosure,
    origin,
    onOriginChange,
    locationStatus,
    locationError,
    onUseMyLocation,
    route,
    routing,
    routeError,
}: ShopDetailProps) {
    const locating = locationStatus === "locating";

    return (
        <div className="space-y-4 p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2">
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-3.5" aria-hidden /> All shops
            </button>

            <div>
                <h2 className="text-lg font-semibold leading-tight text-primary">{shop.name}</h2>
                <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {shop.address || "Pinned on the map"}
                </p>
                <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${tone.success}`}>
                    Still open for business
                </span>
            </div>

            <section aria-label="Roads affected nearby" className="space-y-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roads affected nearby</h3>
                {nearbyClosures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No road closures near this shop.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {nearbyClosures.map((closure) => (
                            <li key={closure.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelectClosure(closure.id)}
                                    className="flex w-full gap-2.5 rounded-lg border p-2 text-left transition-colors hover:bg-muted/60"
                                >
                                    <span
                                        className="w-1.5 shrink-0 self-stretch rounded-full"
                                        style={{
                                            backgroundColor: closureColor(closure),
                                            opacity: timeStatus(closure).state === "now" ? 1 : 0.55,
                                        }}
                                        aria-hidden
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">{closure.title}</span>
                                        <span className="block text-xs">{headline(closure)}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            {distanceAway(shop, closure)} · {countdown(closure)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {notices.length > 0 && (
                <section aria-label="Access changes at this shop" className="space-y-1.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access changes</h3>
                    {notices.map((notice) => (
                        <div key={notice.id} className="rounded-lg border border-info/30 bg-info/5 p-2 text-sm">
                            <p className="flex items-center gap-1.5 font-medium">
                                <Info className="size-4 shrink-0 text-info" aria-hidden />
                                {notice.title}
                            </p>
                            {notice.alternative && <p className="mt-0.5 pl-5.5 text-muted-foreground">{notice.alternative}</p>}
                        </div>
                    ))}
                </section>
            )}

            {works.length > 0 && (
                <section aria-label="Construction nearby" className="space-y-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Construction nearby</h3>
                    {works.map((work) => (
                        <p key={work.id} className="flex gap-1.5 text-sm">
                            <HardHat className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
                            {work.title}
                        </p>
                    ))}
                </section>
            )}

            <section aria-label="Get there" className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                    <Route className="size-4 text-primary" aria-hidden /> Get there, avoiding closed roads
                </h3>
                {!ORS_API_KEY ? (
                    <p className="text-xs text-muted-foreground">
                        Route planning is off. Add <code>VITE_ORS_API_KEY</code> (free from openrouteservice.org) to the{" "}
                        <code>.env</code> file and restart the dev server.
                    </p>
                ) : (
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={onUseMyLocation}
                            disabled={locating}
                        >
                            {locating ? <Loader2 className="animate-spin" aria-hidden /> : <LocateFixed aria-hidden />}
                            {locating ? "Finding your location…" : "Start from my location"}
                        </Button>
                        {locationError && <p className="text-xs text-destructive">{locationError}</p>}
                        <p className="text-center text-[11px] text-muted-foreground">or start from an address</p>
                        <AddressSearch onFound={(latitude, longitude) => onOriginChange({ latitude, longitude })} />

                        {routing && (
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Loader2 className="size-4 animate-spin" aria-hidden /> Planning a route…
                            </p>
                        )}
                        {routeError && <p className="text-sm text-destructive">{routeError}</p>}
                        {route && !routing && origin && (
                            <div className="space-y-2 rounded-md bg-card p-2.5 text-sm shadow-sm motion-safe:animate-in motion-safe:fade-in">
                                <p className="flex items-center gap-1.5 font-semibold">
                                    <Car className="size-4 text-primary" aria-hidden />
                                    {route.distanceKm.toFixed(1)} km · about {route.minutes} min
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {route.avoided.length > 0
                                        ? `Goes around ${route.avoided.map((closure) => closure.road).join(" and ")} (fully closed).`
                                        : "No fully closed roads on the way right now."}
                                </p>
                                {route.walk && (
                                    <p className="flex gap-1.5 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                                        <Footprints className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                        {route.walk.closure.road} is fully closed, so cars can't reach the door. Park at
                                        the end of the closure and walk the last {formatDistance(route.walk.km)} (dashed
                                        line).
                                    </p>
                                )}
                                {route.partialOnRoute.length > 0 && (
                                    <p className="flex gap-1.5 text-xs text-orange-700 dark:text-orange-300">
                                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                        Passes {route.partialOnRoute.map((closure) => closure.road).join(", ")} (partially
                                        closed): expect delays.
                                    </p>
                                )}
                                <Button asChild size="sm" className="w-full">
                                    <a
                                        href={googleMapsRouteUrl(origin, route.walk ? route.walk.path[0] : shop, route.steerPoints)}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <ExternalLink aria-hidden /> Navigate in Google Maps
                                    </a>
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
