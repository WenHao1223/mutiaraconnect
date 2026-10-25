import { distanceInKm } from "@/lib/maps/geo";
import type { Coordinates } from "@/lib/maps/maps";
import { extentOf, timeStatus } from "@/lib/road/closureDisplay";
import type { RoadClosure } from "@/types/road-closure";

/**
 * Driving routes that avoid closed roads, from OpenRouteService (openrouteservice.org).
 * Google's links can't avoid roads they don't know are closed, so the route is worked out here
 * and drawn on our map. Free key: sign up at openrouteservice.org, then set VITE_ORS_API_KEY.
 */
export const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY as string | undefined;

const ORS_URL = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";

/** Half the width of the band avoided around a closed road, in metres. */
const AVOID_HALF_WIDTH_M = 15;
/** A start or end point this close to a closed road is on it, so that road can't be avoided. */
const ON_ROAD_KM = 0.04;

/** A closed road this close to the route counts as one the route went around. */
const PASSES_NEAR_KM = 0.3;

export interface PlannedRoute {
    path: Coordinates[];
    distanceKm: number;
    minutes: number;
    /** Fully closed roads near the route that it was steered around. */
    avoided: RoadClosure[];
    /**
     * One point on the route beside each avoided road. Passed to Google Maps as stops so it takes
     * the same way round, without cluttering the trip with stops where nothing is closed.
     */
    steerPoints: Coordinates[];
    /** Partially closed roads the route still uses (passable, but expect delays). */
    partialOnRoute: RoadClosure[];
    /** Set when the shop is on a fully closed road: the drive stops at its open end and this is the walk. */
    walk?: { path: Coordinates[]; km: number; closure: RoadClosure };
}

const blockedNow = (closure: RoadClosure) =>
    closure.kind === "closure" && !!closure.path && closure.path.length > 1 && timeStatus(closure).state === "now";

/** A thin rectangle around each segment of the closed road, as [lng, lat] rings for GeoJSON. */
function bandAround(closure: RoadClosure): number[][][][] {
    const path = closure.path ?? [];
    return path.slice(1).map((end, i) => {
        const start = path[i];
        const metresPerDegLat = 111_320;
        const metresPerDegLng = 111_320 * Math.cos((start.latitude * Math.PI) / 180);
        // Unit vector along the segment in metres, then its perpendicular.
        const dx = (end.longitude - start.longitude) * metresPerDegLng;
        const dy = (end.latitude - start.latitude) * metresPerDegLat;
        const length = Math.hypot(dx, dy) || 1;
        const px = (-dy / length) * AVOID_HALF_WIDTH_M;
        const py = (dx / length) * AVOID_HALF_WIDTH_M;
        // Stretch a little past each end so junctions are covered too.
        const ex = (dx / length) * AVOID_HALF_WIDTH_M;
        const ey = (dy / length) * AVOID_HALF_WIDTH_M;
        const corner = (point: Coordinates, sx: number, sy: number) => [
            point.longitude + sx / metresPerDegLng,
            point.latitude + sy / metresPerDegLat,
        ];
        const ring = [
            corner(start, px - ex, py - ey),
            corner(end, px + ex, py + ey),
            corner(end, -px + ex, -py + ey),
            corner(start, -px - ex, -py - ey),
        ];
        return [[...ring, ring[0]]];
    });
}

/** Asks OpenRouteService for a driving route from `from` to `to` that keeps off fully closed roads. */
export async function planRoute(from: Coordinates, to: Coordinates, closures: RoadClosure[]): Promise<PlannedRoute> {
    if (!ORS_API_KEY) throw new Error("Route planning needs VITE_ORS_API_KEY in the .env file.");

    const blocked = closures.filter(blockedNow);
    // A road the trip starts or ends on can't be avoided; skip it rather than fail.
    // A shop on a fully closed road can't be driven to: drive to the nearest open end, then walk.
    const closedAtShop = blocked.find(
        (closure) => extentOf(closure) === "full" && distanceToPathKm(to, closure.path ?? []) <= ON_ROAD_KM,
    );
    const walk = closedAtShop ? walkFromOpenEnd(closedAtShop.path ?? [], to) : undefined;
    const driveTo = walk ? walk.path[0] : to;

    const toAvoid = blocked.filter(
        (closure) => extentOf(closure) === "full" && distanceToPathKm(from, closure.path ?? []) > ON_ROAD_KM,
    );

    const body: Record<string, unknown> = {
        coordinates: [
            [from.longitude, from.latitude],
            [driveTo.longitude, driveTo.latitude],
        ],
    };
    if (toAvoid.length > 0) {
        body.options = { avoid_polygons: { type: "MultiPolygon", coordinates: toAvoid.flatMap(bandAround) } };
    }

    const response = await fetch(ORS_URL, {
        method: "POST",
        headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(detail?.error?.message ?? `Route service error (${response.status}).`);
    }

    const data = (await response.json()) as {
        features: { geometry: { coordinates: [number, number][] }; properties: { summary: { distance: number; duration: number } } }[];
    };
    const feature = data.features[0];
    if (!feature) throw new Error("No route found between these points.");

    const path = feature.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
    const partialOnRoute = blocked.filter(
        (closure) =>
            extentOf(closure) === "partial" && path.some((point) => distanceToPathKm(point, closure.path ?? []) <= 0.02),
    );

    // Only closures the route actually passes near; for each, the route point closest to it.
    const avoided: RoadClosure[] = [];
    const steerPoints: Coordinates[] = [];
    for (const closure of toAvoid) {
        let nearest: Coordinates | undefined;
        let nearestKm = Infinity;
        for (const point of path.slice(1, -1)) {
            const km = Math.min(...(closure.path ?? []).map((node) => distanceInKm(point, node)));
            if (km < nearestKm) {
                nearestKm = km;
                nearest = point;
            }
        }
        if (nearest && nearestKm <= PASSES_NEAR_KM) {
            avoided.push(closure);
            // A stop right next to the start or end adds nothing; Google gets there the same way anyway.
            if (distanceInKm(nearest, from) > 0.1 && distanceInKm(nearest, driveTo) > 0.1) steerPoints.push(nearest);
        }
    }

    return {
        path,
        distanceKm: feature.properties.summary.distance / 1000,
        minutes: Math.max(1, Math.round(feature.properties.summary.duration / 60)),
        avoided,
        steerPoints,
        partialOnRoute,
        walk: walk && closedAtShop ? { ...walk, closure: closedAtShop } : undefined,
    };
}

/* --- Geometry helpers, in metres on a flat local projection (fine at street scale). --- */

const toXY = (point: Coordinates, origin: Coordinates) => ({
    x: (point.longitude - origin.longitude) * 111_320 * Math.cos((origin.latitude * Math.PI) / 180),
    y: (point.latitude - origin.latitude) * 111_320,
});

const fromXY = (x: number, y: number, origin: Coordinates): Coordinates => ({
    latitude: origin.latitude + y / 111_320,
    longitude: origin.longitude + x / (111_320 * Math.cos((origin.latitude * Math.PI) / 180)),
});

/** Where `point` lands on `path`: the segment index, how far along it (0–1), and the distance in km. */
function projectOnPath(point: Coordinates, path: Coordinates[]) {
    let best = { index: 0, t: 0, km: Infinity };
    path.slice(1).forEach((end, index) => {
        const a = toXY(path[index], point);
        const b = toXY(end, point);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lengthSq = dx * dx + dy * dy || 1;
        const t = Math.min(1, Math.max(0, -(a.x * dx + a.y * dy) / lengthSq));
        const km = Math.hypot(a.x + t * dx, a.y + t * dy) / 1000;
        if (km < best.km) best = { index, t, km };
    });
    return best;
}

/** Shortest distance from a point to a drawn road, measured to its segments, not just its corners. */
function distanceToPathKm(point: Coordinates, path: Coordinates[]): number {
    return path.length < 2 ? Infinity : projectOnPath(point, path).km;
}

/**
 * For a shop on a fully closed road: the walk from just outside the nearer open end of the
 * closure, along the road, to the shop. The first point is where the drive should stop.
 */
function walkFromOpenEnd(path: Coordinates[], shop: Coordinates): { path: Coordinates[]; km: number } {
    const { index, t } = projectOnPath(shop, path);
    const segmentKm = path.slice(1).map((end, i) => distanceInKm(path[i], end));
    const alongKm = segmentKm.slice(0, index).reduce((sum, km) => sum + km, 0) + t * segmentKm[index];
    const totalKm = segmentKm.reduce((sum, km) => sum + km, 0);
    const fromStart = alongKm <= totalKm - alongKm;

    // Nodes from the chosen end up to the shop's spot on the road.
    const nodes = fromStart ? path.slice(0, index + 1) : path.slice(index + 1).reverse();
    const end = nodes[0];
    const inward = nodes[1] ?? shop;

    // Step 30 m beyond the end, away from the closure, so the drive stays off the closed road.
    const e = toXY(end, end);
    const i = toXY(inward, end);
    const length = Math.hypot(i.x - e.x, i.y - e.y) || 1;
    const outside = fromXY(((e.x - i.x) / length) * 30, ((e.y - i.y) / length) * 30, end);

    const a = toXY(path[index], path[index]);
    const b = toXY(path[index + 1], path[index]);
    const onRoad = fromXY(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y), path[index]);

    const walkPath = [outside, ...nodes, onRoad, shop];
    const km = walkPath.slice(1).reduce((sum, point, n) => sum + distanceInKm(walkPath[n], point), 0);
    return { path: walkPath, km };
}
