import { KIND_STYLE } from "@/lib/maps/mapConfig";
import type { ClosureKind } from "@/types/road-closure";

interface MapLegendProps {
    visible: Record<ClosureKind, boolean>;
    counts: Record<ClosureKind, number>;
    onToggle: (kind: ClosureKind) => void;
}

/** Legend that doubles as a layer filter: click an entry to show or hide that kind of pin. */
export default function MapLegend({ visible, counts, onToggle }: MapLegendProps) {
    return (
        <div className="flex flex-wrap gap-2 rounded-lg border bg-card/95 p-2 shadow-md backdrop-blur" role="group" aria-label="Map layers">
            {(Object.keys(KIND_STYLE) as ClosureKind[]).map((kind) => (
                <button
                    key={kind}
                    type="button"
                    aria-pressed={visible[kind]}
                    onClick={() => onToggle(kind)}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-medium transition-opacity ${visible[kind] ? "bg-muted" : "opacity-50"
                        }`}
                >
                    <span className="size-2.5 rounded-full" style={{ background: KIND_STYLE[kind].background }} aria-hidden />
                    {KIND_STYLE[kind].label} ({counts[kind]})
                </button>
            ))}
        </div>
    );
}