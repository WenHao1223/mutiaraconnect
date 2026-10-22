import { useEffect, useRef } from "react";
import { AdvancedMarker, APIProvider, Map, Pin, useMap } from "@vis.gl/react-google-maps";
import { KIND_STYLE, MAP_ID, MAPS_API_KEY, PENANG_CENTER } from "@/lib/maps/mapConfig";
import type { RoadClosure } from "@/types/road-closure";

interface ClosureMapProps {
    closures: RoadClosure[];
    selectedId?: string;
    onSelect: (id: string | undefined) => void;
}

/** Google Map with one pin per closure / access notice. */
export default function ClosureMap({ closures, selectedId, onSelect }: ClosureMapProps) {
    if (!MAPS_API_KEY) {
        return (
            <div className="flex h-full min-h-80 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                <p>
                    Google Maps is unavailable. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to the{" "}
                    <code>.env</code> file and restart the dev server to view the map.
                </p>
            </div>
        );
    }

    return (
        <APIProvider apiKey={MAPS_API_KEY} region="MY" language="en">
            <Map
                className="h-full w-full"
                mapId={MAP_ID}
                defaultCenter={PENANG_CENTER}
                defaultZoom={13}
                gestureHandling="greedy"
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                onClick={() => onSelect(undefined)}
            >
                {closures.map((closure) => {
                    const style = KIND_STYLE[closure.kind];
                    const selected = closure.id === selectedId;
                    return (
                        <AdvancedMarker
                            key={closure.id}
                            position={{ lat: closure.latitude, lng: closure.longitude }}
                            title={closure.title}
                            zIndex={selected ? 10 : 1}
                            onClick={() => onSelect(closure.id)}
                        >
                            <Pin
                                background={style.background}
                                borderColor={style.border}
                                glyphColor="#ffffff"
                                scale={selected ? 1.4 : 1}
                            />
                        </AdvancedMarker>
                    );
                })}
                <FocusSelected closures={closures} selectedId={selectedId} />
            </Map>
        </APIProvider>
    );
}

/** Pans to the selected closure when the selection changes (not on the user's own panning). */
function FocusSelected({ closures, selectedId }: { closures: RoadClosure[]; selectedId?: string }) {
    const map = useMap();
    const lastId = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!map || !selectedId || lastId.current === selectedId) return;
        lastId.current = selectedId;
        const target = closures.find((closure) => closure.id === selectedId);
        if (!target) return;
        map.panTo({ lat: target.latitude, lng: target.longitude });
        if ((map.getZoom() ?? 0) < 15) map.setZoom(15);
    }, [map, closures, selectedId]);

    useEffect(() => {
        if (!selectedId) lastId.current = undefined;
    }, [selectedId]);

    return null;
}