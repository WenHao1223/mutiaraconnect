import { useState } from "react";
import { APIProvider, Map, Marker, useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

/** Default view: George Town, Penang — the centre of the Mutiara LRT corridor. */
const PENANG_CENTER = { lat: 5.4141, lng: 100.3288 };

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

function MapPicker({ value, onChange, readOnly }: LocationPickerProps) {
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
        <div className="mt-1.5 space-y-2">
            <Map
                className="h-64 w-full overflow-hidden rounded-md border"
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

            <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground">
                    {!value && "Click the map (or drag the pin) to mark where your shop is."}
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
        </div>
    );
}
