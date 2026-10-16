import { useEffect, useRef } from "react";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import type { Ticket } from "@/types/ticket";

/** Default view: George Town, Penang — the centre of the Mutiara LRT corridor. */
const PENANG_CENTER = { lat: 5.4141, lng: 100.3288 };

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

interface TicketsMapProps {
    tickets: Ticket[];
    /** Ticket to bring into view when the list selection changes. */
    selectedId?: string;
}

/** Pins every geolocated report so admins can see where tickets are being raised. */
export default function TicketsMap({ tickets, selectedId }: TicketsMapProps) {
    const pinned = tickets.filter(
        (ticket) => typeof ticket.latitude === "number" && typeof ticket.longitude === "number",
    );

    if (!MAPS_API_KEY) {
        return (
            <div className="flex h-96 items-center justify-center rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Google Maps is unavailable. Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to the
                <code> .env</code> file and restart the dev server to view ticket locations.
            </div>
        );
    }

    return (
        <APIProvider apiKey={MAPS_API_KEY} region="MY" language="en">
            <Map
                className="h-96 w-full overflow-hidden rounded-md border"
                defaultCenter={PENANG_CENTER}
                defaultZoom={13}
                gestureHandling="cooperative"
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
            >
                {pinned.map((ticket) => (
                    <Marker
                        key={ticket.id}
                        position={{ lat: ticket.latitude as number, lng: ticket.longitude as number }}
                        title={`${ticket.id} · ${ticket.location}`}
                    />
                ))}
                <RecenterOnSelect ticket={pinned.find((ticket) => ticket.id === selectedId)} />
            </Map>
        </APIProvider>
    );
}

/** Pans the map to the selected ticket when it changes. */
function RecenterOnSelect({ ticket }: { ticket?: Ticket }) {
    const map = useMap();
    const lastId = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!map || !ticket || lastId.current === ticket.id) return;
        lastId.current = ticket.id;
        map.panTo({ lat: ticket.latitude as number, lng: ticket.longitude as number });
    }, [map, ticket]);

    return null;
}
