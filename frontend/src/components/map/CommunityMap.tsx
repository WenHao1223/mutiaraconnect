import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AdvancedMarker, InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import { Store } from "lucide-react";
import { type LrtLinePath, STATION_STATUS } from "@/lib/maps/lrtOverlay";
import { MAP_ID, PENANG_CENTER } from "@/lib/maps/mapConfig";
import type { Coordinates } from "@/lib/maps/maps";
import { closureColor, LINE_COLOR, timeStatus } from "@/lib/road/closureDisplay";
import { cn } from "@/lib/utils";
import { PATHS } from "@/routes";
import type { LrtStation } from "@/types/lrt";
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
    /** "cooperative" when the map sits inside a scrolling page, so scrolling moves the page. */
    gestureHandling?: "greedy" | "cooperative";
    /** LRT lines and stations to draw under the closures. Leave out to hide the LRT layer. */
    lrtLines?: LrtLinePath[];
    stations?: LrtStation[];
    selectedStationId?: string;
    onSelectStation?: (id: string | undefined) => void;
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
    gestureHandling = "greedy",
    lrtLines = [],
    stations = [],
    selectedStationId,
    onSelectStation,
}: CommunityMapProps) {
    const selectedStation = stations.find((station) => station.id === selectedStationId);
    return (
        <Map
            className="h-full w-full"
            mapId={MAP_ID}
            defaultCenter={PENANG_CENTER}
            defaultZoom={13}
            gestureHandling={gestureHandling}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            clickableIcons={false}
            onClick={onMapClick}
        >
            <LrtLines lines={lrtLines} />
            {stations.map((station) => {
                const selected = station.id === selectedStationId;
                const lineColor = lrtLines.find((line) => line.id === station.line)?.color ?? LINE_COLOR.route;
                return (
                    <AdvancedMarker
                        key={station.id}
                        position={{ lat: station.latitude, lng: station.longitude }}
                        title={`${station.code} ${station.name}`}
                        zIndex={selected ? 25 : 5}
                        onClick={() => onSelectStation?.(selected ? undefined : station.id)}
                    >
                        {/* Ring in the line colour, centre in the build-status colour. */}
                        <span
                            className={cn(
                                "flex items-center justify-center rounded-full border-[3px] bg-white shadow transition-transform",
                                selected ? "size-6" : "size-4",
                            )}
                            style={{ borderColor: lineColor }}
                        >
                            <span
                                className={cn("rounded-full", selected ? "size-2.5" : "size-1.5")}
                                style={{ backgroundColor: STATION_STATUS[station.status].color }}
                            />
                        </span>
                    </AdvancedMarker>
                );
            })}
            {selectedStation && (
                <InfoWindow
                    position={{ lat: selectedStation.latitude, lng: selectedStation.longitude }}
                    pixelOffset={[0, -14]}
                    headerContent={
                        <span className="text-sm font-semibold">
                            {selectedStation.code} · {selectedStation.name}
                        </span>
                    }
                    onCloseClick={() => onSelectStation?.(undefined)}
                >
                    <StationCard station={selectedStation} />
                </InfoWindow>
            )}
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

/**
 * The LRT alignment in railway style: the line colour with white ticks along it, drawn underneath
 * closures, routes and pins so those stay readable on top.
 */
function LrtLines({ lines }: { lines: LrtLinePath[] }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        const drawn: google.maps.Polyline[] = [];
        for (const line of lines) {
            if (line.points.length < 2) continue;
            const path = line.points.map((point) => ({ lat: point.latitude, lng: point.longitude }));
            drawn.push(
                new google.maps.Polyline({
                    map,
                    path,
                    strokeColor: line.color,
                    strokeOpacity: 0.85,
                    strokeWeight: 5,
                    zIndex: 0,
                    clickable: false,
                    icons: [
                        {
                            icon: { path: "M 0,-1 0,1", strokeColor: "#ffffff", strokeOpacity: 0.9, strokeWeight: 2, scale: 2 },
                            offset: "0",
                            repeat: "16px",
                        },
                    ],
                }),
            );
        }
        return () => drawn.forEach((line) => line.setMap(null));
    }, [map, lines]);

    return null;
}

/** What the station popup shows: build status, progress, landmark, and a link to its details. */
function StationCard({ station }: { station: LrtStation }) {
    const status = STATION_STATUS[station.status];
    return (
        <div className="w-60 space-y-2 text-sm text-foreground">
            <p className="flex items-center gap-1.5 text-xs font-medium">
                <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} aria-hidden />
                {status.label} · {station.progress}%
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${station.progress}%`, backgroundColor: status.color }} />
            </div>
            <p className="text-xs text-muted-foreground">{station.currentPhase}</p>
            {station.landmark && <p className="text-xs">Near {station.landmark}</p>}
            <Link
                to={`${PATHS.constructionInfo}?station=${station.code}`}
                className="inline-block text-xs font-semibold text-primary hover:underline"
            >
                Station details →
            </Link>
        </div>
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
