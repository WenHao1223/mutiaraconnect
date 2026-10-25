import { useEffect } from "react";
import { AdvancedMarker, APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { Eraser, Undo2 } from "lucide-react";
import { AddressSearch } from "@/components/custom/LocationPicker";
import { Button } from "@/components/ui/button";
import { MAP_ID, MAPS_API_KEY, PENANG_CENTER } from "@/lib/maps/mapConfig";
import { LINE_COLOR } from "@/lib/road/closureDisplay";
import type { ClosureExtent, RoadPoint } from "@/types/road-closure";

interface RoadPathPickerProps {
    path: RoadPoint[];
    onPathChange: (path: RoadPoint[]) => void;
    /** Colours the closed road the same way the public map will. */
    extent: ClosureExtent;
}

/** Admin tool: click along the closed road to draw it. Lines are straight between clicks, so click at each bend. */
export default function RoadPathPicker(props: RoadPathPickerProps) {
    if (!MAPS_API_KEY) {
        return (
            <div className="mt-1.5 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Google Maps is unavailable. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to the <code>.env</code> file and
                restart the dev server to draw the closed road.
            </div>
        );
    }

    return (
        <APIProvider apiKey={MAPS_API_KEY} region="MY" language="en">
            <PathEditor {...props} />
        </APIProvider>
    );
}

function PathEditor({ path, onPathChange, extent }: RoadPathPickerProps) {
    const map = useMap();

    return (
        <div className="mt-1.5 space-y-2">
            <AddressSearch onFound={(latitude, longitude) => map?.panTo({ lat: latitude, lng: longitude })} />

            <Map
                className="h-72 w-full overflow-hidden rounded-md border"
                mapId={MAP_ID}
                defaultCenter={PENANG_CENTER}
                defaultZoom={15}
                gestureHandling="cooperative"
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                clickableIcons={false}
                onClick={(event) => {
                    const point = event.detail.latLng;
                    if (point) onPathChange([...path, { latitude: point.lat, longitude: point.lng }]);
                }}
            >
                <DrawnLine path={path} color={LINE_COLOR[extent]} />
                {path.map((point, index) => (
                    <AdvancedMarker key={index} position={{ lat: point.latitude, lng: point.longitude }}>
                        <span className="block size-3 rounded-full border-2 border-white bg-foreground shadow" />
                    </AdvancedMarker>
                ))}
            </Map>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    {path.length < 2
                        ? "Click along the closed road, at each end and at every bend."
                        : `${path.length} points drawn. Keep clicking to extend it.`}
                </p>
                <div className="flex gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={path.length === 0}
                        onClick={() => onPathChange(path.slice(0, -1))}
                    >
                        <Undo2 className="size-4" /> Undo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={path.length === 0} onClick={() => onPathChange([])}>
                        <Eraser className="size-4" /> Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}

/** The line being drawn, updated as points are added or removed. */
function DrawnLine({ path, color }: { path: RoadPoint[]; color: string }) {
    const map = useMap();

    useEffect(() => {
        if (!map || path.length < 2) return;
        const line = new google.maps.Polyline({
            map,
            path: path.map((point) => ({ lat: point.latitude, lng: point.longitude })),
            strokeColor: color,
            strokeWeight: 6,
            strokeOpacity: 0.9,
            clickable: false,
        });
        return () => line.setMap(null);
    }, [map, path, color]);

    return null;
}
