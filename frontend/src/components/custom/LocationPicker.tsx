import { useEffect, useRef, useState } from "react";
import { APIProvider, Map, Marker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Loader2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Default view: George Town, Penang — the centre of the Mutiara LRT corridor. */
const PENANG_CENTER = { lat: 5.4141, lng: 100.3288 };

/** Rough box around Penang so address search prefers matches on the island and Seberang Perai. */
const PENANG_BOUNDS = { south: 5.12, west: 100.17, north: 5.6, east: 100.56 };

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export interface PickedLocation {
    latitude: number;
    longitude: number;
    /** Address resolved from the pin via reverse geocoding (may be empty offline). */
    address: string;
}

interface LocationPickerProps {
    value: PickedLocation | null;
    onChange: (location: PickedLocation | null) => void;
    /** Display the pin without letting the user move or clear it. */
    readOnly?: boolean;
    /**
     * Changes whenever the shown place changes (e.g. the ticket id). Forces the map to
     * re-centre even when two places share the same coordinates.
     */
    recenterKey?: string;
    /** Hide the address/hint line under the map (for callers that already show the place). */
    hideCaption?: boolean;
    /** Drop the map's own margin, border and rounding (for callers that frame it in a card). */
    embedded?: boolean;
}

/** Loads the Maps JS API and renders the picker, or explains how to enable it. */
export default function LocationPicker(props: LocationPickerProps) {
    if (!MAPS_API_KEY) {
        return (
            <div className="mt-1.5 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Google Maps is unavailable. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to the
                <code> .env</code> file and restart the dev server to{" "}
                {props.readOnly ? "view the map" : "pick your shop location on the map"}.
            </div>
        );
    }

    return (
        <APIProvider apiKey={MAPS_API_KEY} region="MY" language="en">
            <MapPicker {...props} />
        </APIProvider>
    );
}

function MapPicker({ value, onChange, readOnly, recenterKey, hideCaption, embedded }: LocationPickerProps) {
    const geocoding = useMapsLibrary("geocoding");
    const [resolving, setResolving] = useState(false);

    async function moveTo(latitude: number, longitude: number) {
        // Show the pin straight away, then fill in the address once resolved.
        onChange({ latitude, longitude, address: value?.address ?? "" });
        if (!geocoding) return;
        setResolving(true);
        try {
            const geocoder = new geocoding.Geocoder();
            const { results } = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
            onChange({ latitude, longitude, address: results[0]?.formatted_address ?? "" });
        } catch {
            /* keep the bare coordinates when reverse geocoding fails */
        } finally {
            setResolving(false);
        }
    }

    return (
        <div className={cn("space-y-2", !embedded && "mt-1.5")}>
            {!readOnly && <AddressSearch onFound={(latitude, longitude) => void moveTo(latitude, longitude)} />}
            <Map
                className={cn("h-64 w-full overflow-hidden", !embedded && "rounded-md border")}
                defaultCenter={value ? { lat: value.latitude, lng: value.longitude } : PENANG_CENTER}
                defaultZoom={15}
                gestureHandling="cooperative"
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                onClick={(event) => {
                    if (readOnly) return;
                    const point = event.detail.latLng;
                    if (point) void moveTo(point.lat, point.lng);
                }}
            >
                {value && (
                    <RecenterOnChange
                        recenterKey={recenterKey ?? `${value.latitude},${value.longitude}`}
                        latitude={value.latitude}
                        longitude={value.longitude}
                    />
                )}
                {value && (
                    <Marker
                        position={{ lat: value.latitude, lng: value.longitude }}
                        draggable={!readOnly}
                        onDragEnd={(event) => {
                            if (readOnly) return;
                            const point = event.latLng;
                            if (point) void moveTo(point.lat(), point.lng());
                        }}
                    />
                )}
            </Map>

            {!hideCaption && (
                <div className="flex items-start gap-1.5 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p className="text-muted-foreground">
                        {!value && "Search an address, or click the map (or drag the pin) to mark the spot."}
                        {value && resolving && "Resolving address…"}
                        {value && !resolving && value.address}
                        {value && !resolving && !value.address && (
                            <span className="font-mono text-xs">
                                {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
                            </span>
                        )}
                    </p>
                    {value && !readOnly && (
                        <button
                            type="button"
                            className="ml-auto text-xs font-medium text-primary hover:underline"
                            onClick={() => onChange(null)}
                        >
                            Clear pin
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/** Pans the map when the shown place changes, but ignores the user's own panning. */
function RecenterOnChange({
    recenterKey,
    latitude,
    longitude,
}: {
    recenterKey: string;
    latitude: number;
    longitude: number;
}) {
    const map = useMap();
    const lastKey = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!map || lastKey.current === recenterKey) return;
        lastKey.current = recenterKey;
        map.panTo({ lat: latitude, lng: longitude });
    }, [map, recenterKey, latitude, longitude]);

    return null;
}

/** Type an address to find its coordinates; the pin then moves there like a map click. */
function AddressSearch({ onFound }: { onFound: (latitude: number, longitude: number) => void }) {
    const geocoding = useMapsLibrary("geocoding");
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string>();

    async function search() {
        const text = query.trim();
        if (!text || !geocoding) return;
        setSearching(true);
        setError(undefined);
        try {
            const geocoder = new geocoding.Geocoder();
            const { results } = await geocoder.geocode({
                address: text,
                bounds: PENANG_BOUNDS,
                componentRestrictions: { country: "MY" },
            });
            const match = results[0];
            if (!match) throw new Error("no match");
            onFound(match.geometry.location.lat(), match.geometry.location.lng());
        } catch {
            setError("Couldn't find that address. Add the area or postcode, or click the map instead.");
        } finally {
            setSearching(false);
        }
    }

    return (
        <div>
            <div className="flex gap-2">
                <Input
                    value={query}
                    placeholder="Search an address, e.g. 18 Jalan Jelutong, 11600"
                    aria-label="Search an address"
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setError(undefined);
                    }}
                    onKeyDown={(event) => {
                        // Search instead of submitting the surrounding form.
                        if (event.key === "Enter") {
                            event.preventDefault();
                            void search();
                        }
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    disabled={!query.trim() || !geocoding || searching}
                    onClick={() => void search()}
                >
                    {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                    Find
                </Button>
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
    );
}
