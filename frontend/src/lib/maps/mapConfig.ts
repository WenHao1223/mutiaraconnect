import type { ClosureKind, ClosureStatus } from "@/types/road-closure";

/** Default view: George Town, Penang — the centre of the Mutiara LRT corridor. */
export const PENANG_CENTER = { lat: 5.4141, lng: 100.3288 };

export const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

/**
 * Advanced markers need a Map ID. "DEMO_MAP_ID" is Google's built-in id for development;
 * set VITE_GOOGLE_MAP_ID to your own (Cloud Console → Map Management) for production.
 */
export const MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined) || "DEMO_MAP_ID";

/** Pin colours per kind: red = road closure, amber = business access notice. */
export const KIND_STYLE: Record<
    ClosureKind,
    { label: string; background: string; border: string }
> = {
    closure: { label: "Road closure", background: "#dc2626", border: "#7f1d1d" },
    access: { label: "Access notice", background: "#f59e0b", border: "#92400e" },
};

/** Closure status order, as shown in the admin status picker. */
export const CLOSURE_STATUSES: ClosureStatus[] = ["active", "ended"];

/** Picker wording: "Active" lets the dates decide; "Ended" stops it early. */
export const CLOSURE_STATUS_LABEL: Record<ClosureStatus, string> = {
    active: "Active (follow the dates)",
    ended: "Ended",
};
