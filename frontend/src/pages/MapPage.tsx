import { useMemo, useState } from "react";
import ClosureInfoCard from "@/components/map/ClosureInfoCard";
import ClosureMap from "@/components/map/ClosureMap";
import MapLegend from "@/components/map/MapLegend";
import { activeClosures } from "@/lib/admin/closures";
import type { ClosureKind } from "@/types/road-closure";

/** Main page: Google Map of planned/active road closures and access notices set by admins. */
export default function MapPage() {
    // Read once on mount; ended closures are not shown on the public map.
    const [closures] = useState(() => activeClosures());
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [visible, setVisible] = useState<Record<ClosureKind, boolean>>({ closure: true, access: true });

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
                <ClosureMap closures={shown} selectedId={selected?.id} onSelect={setSelectedId} />
            </div>

            <div className="pointer-events-none relative flex w-full flex-col justify-between gap-3 p-3">
                <div className="pointer-events-auto self-start">
                    <MapLegend
                        visible={visible}
                        counts={counts}
                        onToggle={(kind) => setVisible((prev) => ({ ...prev, [kind]: !prev[kind] }))}
                    />
                </div>
                {selected && (
                    <div className="pointer-events-auto">
                        <ClosureInfoCard closure={selected} onClose={() => setSelectedId(undefined)} />
                    </div>
                )}
            </div>
        </div>
    );
}