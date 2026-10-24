import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ClosureMap from "@/components/map/ClosureMap";
import ClosurePanel from "@/components/map/ClosurePanel";
import MapLegend from "@/components/map/MapLegend";
import { useGeolocation } from "@/hooks/use-geolocation";
import { activeClosures } from "@/lib/admin/closures";
import type { ClosureKind } from "@/types/road-closure";

/** Main page: Google Map of planned/active road closures and access notices set by admins. */
export default function MapPage() {
    // Read once on mount; ended closures are not shown on the public map.
    const [closures] = useState(() => activeClosures());
    // "/?closure=RC-1042" (from the Road & Access page) opens the map with that pin selected.
    const [searchParams] = useSearchParams();
    const [selectedId, setSelectedId] = useState(() => searchParams.get("closure") ?? undefined);
    const [panelOpen, setPanelOpen] = useState(true);
    const [visible, setVisible] = useState<Record<ClosureKind, boolean>>({ closure: true, access: true });
    const { location, status: locationStatus, error: locationError, requestLocation } = useGeolocation();

    // Selecting a pin (on the map or in the list) reveals the details panel.
    const selectClosure = (id: string | undefined) => {
        setSelectedId(id);
        if (id) setPanelOpen(true);
    };

    const counts = useMemo(
        () => ({
            closure: closures.filter((c) => c.kind === "closure").length,
            access: closures.filter((c) => c.kind === "access").length,
        }),
        [closures],
    );
    const shown = useMemo(() => closures.filter((c) => visible[c.kind]), [closures, visible]);
    const selected = shown.find((c) => c.id === selectedId);

    return (
        <div className="relative flex min-h-[32rem] flex-1 bg-background" aria-label="Road closure map">
            <div className="absolute inset-0">
                <ClosureMap
                    closures={shown}
                    selectedId={selected?.id}
                    userLocation={location}
                    onSelect={selectClosure}
                />
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 p-3">
                <div className="pointer-events-auto inline-flex">
                    <MapLegend
                        visible={visible}
                        counts={counts}
                        onToggle={(kind) => setVisible((prev) => ({ ...prev, [kind]: !prev[kind] }))}
                    />
                </div>
            </div>

            <ClosurePanel
                closures={shown}
                selectedId={selected?.id}
                onSelect={selectClosure}
                open={panelOpen}
                onOpenChange={setPanelOpen}
                location={location}
                locationStatus={locationStatus}
                locationError={locationError}
                onRequestLocation={requestLocation}
            />
        </div>
    );
}
