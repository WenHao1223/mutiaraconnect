import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";
import { ChevronDown, Search, Store, TrafficCone } from "lucide-react";
import ClosureList, { type ClosureTab } from "@/components/map/ClosureList";
import CommunityMap, { type MapFocus } from "@/components/map/CommunityMap";
import ShopDetail from "@/components/map/ShopDetail";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/use-geolocation";
import { readClosures } from "@/lib/admin/closures";
import { readAllPremises } from "@/lib/admin/users";
import { currentNotices, worksNear } from "@/lib/business/business";
import { AFFECTED_RADIUS_KM, distanceInKm } from "@/lib/maps/geo";
import { MAPS_API_KEY } from "@/lib/maps/mapConfig";
import type { Coordinates } from "@/lib/maps/maps";
import {
    closureColor,
    closurePoints,
    distanceToClosure,
    EXTENT_LABEL,
    LINE_COLOR,
    TIME_LABEL,
    timeStatus,
} from "@/lib/road/closureDisplay";
import { planRoute, type PlannedRoute } from "@/lib/road/routing";
import { tone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import type { RoadClosure } from "@/types/road-closure";

type PanelTab = "shops" | "closures";

/**
 * Road & Access: registered shops and road closures on one map. Pick a shop to see which closed
 * roads affect it and get a route there that avoids them.
 */
export default function MapPage() {
    if (!MAPS_API_KEY) {
        return (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                <p>
                    Google Maps is unavailable. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to the <code>.env</code> file and
                    restart the dev server to view the map.
                </p>
            </div>
        );
    }
    return (
        <APIProvider apiKey={MAPS_API_KEY} region="MY" language="en">
            <CommunityMapPage />
        </APIProvider>
    );
}

function CommunityMapPage() {
    // Read once on load: closures that haven't ended, access notices, and every registered shop.
    const [{ closures, notices, shops }] = useState(() => ({
        // Ended covers both closures marked ended and ones past their end date.
        closures: readClosures().filter(
            (closure) => closure.kind === "closure" && timeStatus(closure).state !== "ended",
        ),
        notices: currentNotices().filter((notice) => notice.kind === "access"),
        shops: readAllPremises(),
    }));

    // Road closures within range of each shop, nearest first.
    const nearbyByShop = useMemo(() => {
        const byShop = new Map<string, RoadClosure[]>();
        for (const shop of shops) {
            const near = closures
                .filter((closure) => distanceToClosure(shop, closure) <= AFFECTED_RADIUS_KM)
                .sort((a, b) => distanceToClosure(shop, a) - distanceToClosure(shop, b));
            byShop.set(shop.id, near);
        }
        return byShop;
    }, [shops, closures]);
    const affectedShopIds = useMemo(
        () => new Set(shops.filter((shop) => (nearbyByShop.get(shop.id) ?? []).length > 0).map((shop) => shop.id)),
        [shops, nearbyByShop],
    );

    // "?closure=RC-1042" (from the home page and announcements) opens on that closure;
    // "?shop=<id>" (from Local Businesses) opens on that shop.
    const [searchParams] = useSearchParams();
    const linkedClosure = closures.find((closure) => closure.id === searchParams.get("closure"));
    const linkedShop = linkedClosure ? undefined : shops.find((shop) => shop.id === searchParams.get("shop"));

    const [panelTab, setPanelTab] = useState<PanelTab>(linkedClosure ? "closures" : "shops");
    const [panelOpen, setPanelOpen] = useState(true);
    const [closureTab, setClosureTab] = useState<ClosureTab>(() => {
        const state = linkedClosure ? timeStatus(linkedClosure).state : "now";
        return state === "ended" ? "now" : state;
    });
    const [selectedClosureId, setSelectedClosureId] = useState(linkedClosure?.id);
    const [selectedShopId, setSelectedShopId] = useState(linkedShop?.id);
    const [query, setQuery] = useState("");
    const [focus, setFocus] = useState<MapFocus>(() =>
        linkedClosure
            ? { key: `closure:${linkedClosure.id}`, points: closurePoints(linkedClosure) }
            : linkedShop
              ? {
                    key: `shop:${linkedShop.id}`,
                    points: [linkedShop, ...(nearbyByShop.get(linkedShop.id) ?? []).flatMap(closurePoints)],
                }
              : { key: "all", points: [...shops, ...closures.flatMap(closurePoints)] },
    );

    // The route starts at the visitor's location or at an address they searched for.
    const { location, status: locationStatus, error: locationError, requestLocation } = useGeolocation();
    const [originSource, setOriginSource] = useState<"me" | Coordinates>();
    const origin = originSource === "me" ? location : originSource;

    const selectedShop = shops.find((shop) => shop.id === selectedShopId);
    const routeKey = selectedShop && origin ? `${selectedShop.id}|${origin.latitude},${origin.longitude}` : undefined;
    const [result, setResult] = useState<{ key: string; route?: PlannedRoute; error?: string }>();

    // Plan a route whenever there's both a shop and a starting point; stale answers are ignored.
    useEffect(() => {
        if (!routeKey || !selectedShop || !origin) return;
        let current = true;
        planRoute(origin, selectedShop, closures)
            .then((route) => {
                if (!current) return;
                setResult({ key: routeKey, route });
                setFocus({ key: `route:${routeKey}`, points: [...route.path, ...(route.walk?.path ?? [])] });
            })
            .catch((error: Error) => current && setResult({ key: routeKey, error: error.message }));
        return () => {
            current = false;
        };
    }, [routeKey, selectedShop, origin, closures]);

    const routeForShop = result && result.key === routeKey ? result : undefined;
    const routing = !!routeKey && !routeForShop;

    const visibleShops = useMemo(() => {
        const text = query.trim().toLowerCase();
        return shops
            .filter((shop) => `${shop.name} ${shop.address}`.toLowerCase().includes(text))
            .sort((a, b) => Number(affectedShopIds.has(b.id)) - Number(affectedShopIds.has(a.id)));
    }, [shops, query, affectedShopIds]);

    const selectShop = (id: string) => {
        const shop = shops.find((item) => item.id === id);
        if (!shop) return;
        setSelectedShopId(id);
        setSelectedClosureId(undefined);
        setPanelTab("shops");
        setPanelOpen(true);
        const near = nearbyByShop.get(id) ?? [];
        setFocus({ key: `shop:${id}`, points: [shop, ...near.flatMap(closurePoints)] });
    };

    const selectClosure = (id: string | undefined) => {
        setSelectedClosureId(id);
        const closure = closures.find((item) => item.id === id);
        if (!closure) return;
        const state = timeStatus(closure).state;
        if (state !== "ended") setClosureTab(state);
        setPanelTab("closures");
        setPanelOpen(true);
        setFocus({ key: `closure:${id}`, points: closurePoints(closure) });
    };

    const shopNotices = selectedShop
        ? notices.filter((notice) => distanceInKm(selectedShop, notice) <= AFFECTED_RADIUS_KM)
        : [];

    return (
        <div className="relative flex min-h-[32rem] flex-1 bg-background" aria-label="Road closures and local businesses map">
            <div className="absolute inset-0">
                <CommunityMap
                    closures={closures}
                    shops={shops}
                    selectedShopId={selectedShopId}
                    onSelectShop={selectShop}
                    selectedClosureId={selectedClosureId}
                    onSelectClosure={selectClosure}
                    affectedShopIds={affectedShopIds}
                    route={routeForShop?.route?.path}
                    walk={routeForShop?.route?.walk?.path}
                    origin={origin}
                    focus={focus}
                    onMapClick={() => setSelectedClosureId(undefined)}
                />
            </div>

            <MapKey />

            <aside
                aria-label="Shops and road closures"
                className={cn(
                    // On phones the panel takes under half the screen (about three shops) so the map stays visible.
                    "absolute inset-x-3 bottom-3 z-10 flex max-h-[48%] flex-col overflow-hidden rounded-xl border bg-card/95 shadow-lg backdrop-blur",
                    "md:inset-x-auto md:right-3 md:top-3 md:bottom-3 md:max-h-none md:w-[24rem]",
                    !panelOpen && "max-h-none md:bottom-auto",
                    "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-500",
                )}
            >
                <div className="flex items-center gap-2 border-b p-2">
                    <div className="grid flex-1 grid-cols-2 gap-1" role="tablist" aria-label="Show">
                        <PanelTabButton
                            active={panelTab === "shops"}
                            onClick={() => {
                                setPanelTab("shops");
                                setPanelOpen(true);
                            }}
                            icon={<Store className="size-4" aria-hidden />}
                            label={`Shops (${shops.length})`}
                        />
                        <PanelTabButton
                            active={panelTab === "closures"}
                            onClick={() => {
                                setPanelTab("closures");
                                setPanelOpen(true);
                            }}
                            icon={<TrafficCone className="size-4" aria-hidden />}
                            label={`Road closures (${closures.length})`}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setPanelOpen((open) => !open)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                        aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
                    >
                        <ChevronDown className={cn("size-4 transition-transform", !panelOpen && "rotate-180")} aria-hidden />
                    </button>
                </div>

                {panelOpen && panelTab === "shops" && (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {selectedShop ? (
                            <ShopDetail
                                shop={selectedShop}
                                nearbyClosures={nearbyByShop.get(selectedShop.id) ?? []}
                                notices={shopNotices}
                                works={worksNear(selectedShop)}
                                onBack={() => setSelectedShopId(undefined)}
                                onSelectClosure={selectClosure}
                                origin={origin}
                                onOriginChange={setOriginSource}
                                locationStatus={locationStatus}
                                locationError={originSource === "me" ? locationError : undefined}
                                onUseMyLocation={() => {
                                    setOriginSource("me");
                                    requestLocation();
                                }}
                                route={routeForShop?.route}
                                routing={routing}
                                routeError={routeForShop?.error}
                            />
                        ) : (
                            <div className="space-y-2 p-3">
                                {/* Hidden on phones to leave room for the list. */}
                                <p className="hidden text-sm text-muted-foreground md:block">
                                    Pick a shop to see which roads around it are closed and how to get there.
                                </p>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search shop or address…"
                                        className="bg-card pl-8"
                                        aria-label="Search shops"
                                    />
                                </div>
                                <ul className="space-y-1.5">
                                    {visibleShops.map((shop, index) => {
                                        const near = nearbyByShop.get(shop.id) ?? [];
                                        return (
                                            <li
                                                key={shop.id}
                                                style={{ animationDelay: `${index * 40}ms` }}
                                                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-backwards"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => selectShop(shop.id)}
                                                    className="w-full rounded-lg border bg-card p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                                                >
                                                    <span className="block text-sm font-semibold">{shop.name}</span>
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {shop.address || "Pinned on the map"}
                                                    </span>
                                                    <span className="mt-1.5 flex flex-wrap gap-1">
                                                        {near.length === 0 ? (
                                                            <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-medium", tone.success)}>
                                                                No closures nearby
                                                            </span>
                                                        ) : (
                                                            near.map((closure) => (
                                                                <span
                                                                    key={closure.id}
                                                                    className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium"
                                                                >
                                                                    <span
                                                                        className="size-2 rounded-full"
                                                                        style={{ backgroundColor: closureColor(closure) }}
                                                                        aria-hidden
                                                                    />
                                                                    {closure.road}
                                                                </span>
                                                            ))
                                                        )}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                    {visibleShops.length === 0 && (
                                        <li className="py-4 text-center text-sm text-muted-foreground">No shops match.</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {panelOpen && panelTab === "closures" && (
                    <ClosureList
                        closures={closures}
                        tab={closureTab}
                        onTabChange={setClosureTab}
                        selectedId={selectedClosureId}
                        onSelect={selectClosure}
                    />
                )}
            </aside>
        </div>
    );
}

function PanelTabButton({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
        >
            {icon}
            {label}
        </button>
    );
}

/** Explains the map's colours, in the same words as the panel. */
function MapKey() {
    const items = [
        { label: `${EXTENT_LABEL.full}, ${TIME_LABEL.now.toLowerCase()}`, swatch: { backgroundColor: LINE_COLOR.full } },
        { label: `${EXTENT_LABEL.partial}, ${TIME_LABEL.now.toLowerCase()}`, swatch: { backgroundColor: LINE_COLOR.partial } },
        {
            label: `${TIME_LABEL.later} / ${TIME_LABEL.upcoming.toLowerCase()}`,
            swatch: { backgroundColor: LINE_COLOR.notYet, opacity: 0.55 },
        },
        { label: "Your route", swatch: { backgroundColor: LINE_COLOR.route } },
    ];
    return (
        <div className="pointer-events-none absolute left-3 top-3 z-10 hidden flex-col gap-1 rounded-lg bg-card/95 px-3 py-2 text-xs shadow-sm backdrop-blur sm:flex">
            {items.map((item) => (
                <span key={item.label} className="flex items-center gap-2">
                    <span className="h-1.5 w-6 rounded-full" style={item.swatch} aria-hidden />
                    {item.label}
                </span>
            ))}
            <span className="flex items-center gap-2">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                    <Store className="size-2.5" />
                </span>
                Shop (amber ring: closures nearby)
            </span>
        </div>
    );
}
