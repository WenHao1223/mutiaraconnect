import { useEffect, useRef } from "react";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { Store } from "lucide-react";
import { MAP_ID, PENANG_CENTER } from "@/lib/maps/mapConfig";
import type { Coordinates } from "@/lib/maps/maps";
import { closureColor, LINE_COLOR, timeStatus } from "@/lib/road/closureDisplay";
import { cn } from "@/lib/utils";
import type { RoadClosure } from "@/types/road-closure";
import type { BusinessProfile } from "@/types/user";

/** What the map should frame. Changing `key` re-frames it; the user's own panning is left alone otherwise. */
export interface MapFocus {
    key: string;
    points: Coordinates[];
}

interface CommunityMapProps {
    closures: RoadClosure[];
    shops: BusinessProfile[];
    selectedShopId?: string;
    onSelectShop: (id: string) => void;
    selectedClosureId?: string;
    onSelectClosure: (id: string) => void;
    /** Shops with a closed road nearby get an amber ring. */
    affectedShopIds: Set<string>;
    route?: Coordinates[];
    /** The walk from where the drive stops to the shop, when the shop is on a fully closed road. */
    walk?: Coordinates[];
    /** Where a planned route starts, or the visitor's shared position. */
    origin?: Coordinates;
    focus?: MapFocus;
    onMapClick?: () => void;
}

/**
 * The main map: closed roads drawn as coloured lines, registered shops as pins, and a planned
 * route to the selected shop. Must sit inside an APIProvider.
 */
export default function CommunityMap({
    closures,
    shops,
    selectedShopId,
    onSelectShop,
    selectedClosureId,
    onSelectClosure,
    affectedShopIds,
    route,
    walk,
    origin,
    focus,
    onMapClick,
}: CommunityMapProps) {
    return (
        <Map
            className="h-full w-full"
            mapId={MAP_ID}
            defaultCenter={PENANG_CENTER}
            defaultZoom={13}
            gestureHandling="greedy"
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            clickableIcons={false}
            onClick={onMapClick}
        >
            <ClosedRoadLines closures={closures} selectedId={selectedClosureId} onSelect={onSelectClosure} />
            {route && route.length > 1 && <RouteLine path={route} />}
            {walk && walk.length > 1 && <RouteLine path={walk} dashed />}
            {shops.map((shop) => {
                const selected = shop.id === selectedShopId;
                return (
                    <AdvancedMarker
                        key={shop.id}
                        position={{ lat: shop.latitude, lng: shop.longitude }}
                        title={shop.name}
                        zIndex={selected ? 30 : 10}
                        onClick={() => onSelectShop(shop.id)}
                    >
                        <span
                            className={cn(
                                "flex items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-md transition-transform",
                                selected ? "size-10 scale-110" : "size-8",
                                affectedShopIds.has(shop.id) && "ring-3 ring-hazard",
                            )}
                        >
                            <Store className={selected ? "size-5" : "size-4"} aria-hidden />
                        </span>
                    </AdvancedMarker>
                );
            })}
            {origin && (
                <AdvancedMarker position={{ lat: origin.latitude, lng: origin.longitude }} title="Start" zIndex={40}>
                    <span className="block size-4 rounded-full border-2 border-white bg-blue-500 shadow-md" />
                </AdvancedMarker>
            )}
            {focus && <FrameFocus focus={focus} />}
        </Map>
    );
}

/** Red = fully closed now, orange = partially closed now, faded blue = closing later or upcoming. */
function ClosedRoadLines({
    closures,
    selectedId,
    onSelect,
}: {
    closures: RoadClosure[];
    selectedId?: string;
    onSelect: (id: string) => void;
}) {
    const map = useMap();
    // Keep the latest handler without redrawing every line when the parent re-renders.
    const onSelectRef = useRef(onSelect);
    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        if (!map) return;
        const lines: google.maps.Polyline[] = [];

        for (const closure of closures) {
            if (!closure.path || closure.path.length < 2) continue;
            const path = closure.path.map((point) => ({ lat: point.latitude, lng: point.longitude }));
            const opacity = timeStatus(closure).state === "now" ? 1 : 0.55;
            const selected = closure.id === selectedId;
            const weight = selected ? 9 : 6;

            // White casing underneath keeps the line readable over busy map tiles.
            lines.push(
                new google.maps.Polyline({
                    map,
                    path,
                    strokeColor: "#ffffff",
                    strokeOpacity: opacity,
                    strokeWeight: weight + 4,
                    zIndex: selected ? 10 : 1,
                    clickable: false,
                }),
            );
            const line = new google.maps.Polyline({
                map,
                path,
                strokeColor: closureColor(closure),
                strokeOpacity: opacity,
                strokeWeight: weight,
                zIndex: selected ? 11 : 2,
            });
            line.addListener("click", () => onSelectRef.current(closure.id));
            lines.push(line);
        }

        return () => lines.forEach((line) => line.setMap(null));
    }, [map, closures, selectedId]);

    return null;
}

/** The planned drive as a solid line, or the walking part as dots. */
function RouteLine({ path, dashed = false }: { path: Coordinates[]; dashed?: boolean }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        const points = path.map((point) => ({ lat: point.latitude, lng: point.longitude }));
        const casing = dashed
            ? undefined
            : new google.maps.Polyline({
                map,
                path: points,
                strokeColor: "#ffffff",
                strokeWeight: 9,
                strokeOpacity: 0.9,
                zIndex: 5,
                clickable: false,
            });
        const line = new google.maps.Polyline({
            map,
            path: points,
            strokeColor: LINE_COLOR.route,
            strokeWeight: 5,
            strokeOpacity: dashed ? 0 : 0.95,
            // Walking is drawn as round dots every 12px.
            icons: dashed
                ? [
                    {
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: LINE_COLOR.route,
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 1.5,
                            scale: 3.5,
                        },
                        offset: "0",
                        repeat: "12px",
                    },
                ]
                : undefined,
            zIndex: 12,
            clickable: false,
        });
        return () => {
            casing?.setMap(null);
            line.setMap(null);
        };
    }, [map, path, dashed]);

    return null;
}

/** Frames the focus points whenever the focus key changes. */
function FrameFocus({ focus }: { focus: MapFocus }) {
    const map = useMap();
    const lastKey = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!map || focus.points.length === 0 || lastKey.current === focus.key) return;
        lastKey.current = focus.key;
        if (focus.points.length === 1) {
            map.panTo({ lat: focus.points[0].latitude, lng: focus.points[0].longitude });
            map.setZoom(16);
            return;
        }
        const bounds = new google.maps.LatLngBounds();
        for (const point of focus.points) bounds.extend({ lat: point.latitude, lng: point.longitude });
        // Leave room for the side panel: on the right from tablet width up, along the bottom on phones.
        const wide = window.matchMedia("(min-width: 768px)").matches;
        map.fitBounds(bounds, wide ? { top: 64, left: 64, bottom: 64, right: 440 } : { top: 48, left: 32, right: 32, bottom: 320 });
    }, [map, focus]);

    return null;
}
