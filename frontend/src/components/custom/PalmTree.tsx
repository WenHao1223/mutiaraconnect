import { cn } from "@/lib/utils";

/**
 * Coconut palm crown in viewBox units, crown base at (80, 62): long fronds arch up and droop, the
 * outer ones hanging below the crown. Back fronds are drawn first so front ones sit on top.
 */
const PALM_BACK_FRONDS = [
    "80.0,62.0 78.1,55.4 76.2,49.2 74.2,43.5 72.3,38.3 70.5,33.5 68.7,29.2 67.0,25.3 65.4,21.9 63.9,18.9 62.4,16.2 61.0,13.9 59.6,11.9 58.0,10.2 56.3,8.7 54.2,8.0 52.0,8.0 54.2,8.0 56.4,8.9 58.7,11.2 61.1,12.6 63.3,16.8 65.6,17.8 67.6,23.7 69.6,24.3 71.4,31.4 73.0,31.8 74.5,39.5 75.8,40.5 77.0,48.0 78.1,50.5 79.1,57.1",
    "80.0,62.0 80.7,55.1 81.4,48.6 82.3,42.6 83.3,37.0 84.5,31.8 85.9,27.1 87.6,22.9 89.4,19.1 91.4,15.8 93.7,13.1 96.1,10.9 98.6,9.4 101.1,8.4 103.5,8.1 105.8,8.0 108.0,8.0 105.8,8.0 103.7,8.9 101.8,11.2 100.1,12.6 98.4,16.8 96.8,17.8 95.2,23.7 93.6,24.3 91.9,31.4 90.2,31.8 88.5,39.5 86.8,40.5 85.1,48.0 83.4,50.5 81.7,57.1",
];
const PALM_FRONT_FRONDS = [
    "80.0,62.0 75.2,56.2 70.6,51.0 66.0,46.4 61.7,42.4 57.4,38.9 53.4,36.1 49.6,33.7 45.9,31.7 42.3,30.2 38.8,29.2 35.2,28.5 31.5,28.3 27.7,28.6 23.7,29.5 19.8,31.3 16.0,34.0 19.8,31.3 23.5,29.6 27.2,29.6 31.1,28.7 35.1,30.9 39.2,29.8 43.4,33.9 47.7,32.8 51.9,38.3 56.1,37.3 60.2,43.7 64.2,43.6 68.2,50.1 72.2,51.8 76.1,57.6",
    "80.0,62.0 83.7,55.4 87.5,49.4 91.3,44.0 95.2,39.1 99.2,34.9 103.3,31.3 107.5,28.4 111.9,26.3 116.3,24.8 120.6,24.2 124.9,24.3 129.0,25.2 132.9,26.7 136.6,28.9 140.2,31.3 144.0,34.0 140.2,31.3 136.3,29.6 132.4,29.6 128.6,28.7 124.8,30.9 121.1,29.8 117.4,33.9 113.7,32.8 109.9,38.3 105.9,37.3 101.9,43.7 97.7,43.6 93.4,50.1 89.0,51.8 84.5,57.6",
    "80.0,62.0 74.1,57.1 68.4,53.1 63.0,49.9 57.8,47.4 52.9,45.7 48.2,44.7 43.8,44.3 39.5,44.4 35.2,45.2 30.8,46.6 26.4,48.7 21.8,51.5 17.2,55.2 12.5,59.8 8.0,65.4 4.0,72.0 8.0,65.4 12.0,60.0 16.0,56.5 20.1,52.4 24.5,51.4 29.0,47.5 33.8,48.9 38.7,45.3 43.8,48.5 49.0,45.5 54.2,50.0 59.3,48.3 64.5,53.3 69.6,53.7 74.8,58.5",
    "80.0,62.0 85.0,56.2 90.1,51.1 95.1,46.8 100.3,43.3 105.5,40.7 110.8,39.0 116.2,38.3 121.5,38.6 126.6,39.9 131.5,42.1 136.0,45.3 140.3,49.2 144.3,53.9 148.1,59.4 152.0,65.4 156.0,72.0 152.0,65.4 147.6,60.0 143.1,56.5 138.6,52.4 134.1,51.4 129.6,47.5 125.2,48.9 120.7,45.3 116.2,48.5 111.6,45.5 106.8,50.0 101.8,48.3 96.7,53.3 91.3,53.7 85.7,58.5",
];

/** Sways a crown about its base, like a sea breeze; still for people who ask for reduced motion. */
export const PALM_SWAY = "animate-[palm-sway_4.5s_ease-in-out_infinite] motion-reduce:animate-none";

/** The crown's fronds and coconuts as SVG shapes; put it inside an <svg> with viewBox 0 0 160 90 or larger. */
export function PalmCrown({ front, back }: { front: string; back: string }) {
    return (
        <>
            {PALM_BACK_FRONDS.map((points) => (
                <polygon key={points} points={points} className={back} />
            ))}
            {PALM_FRONT_FRONDS.map((points) => (
                <polygon key={points} points={points} className={front} />
            ))}
            <circle cx="75" cy="65" r="4.6" className="fill-info" />
            <circle cx="85" cy="65" r="4.6" className="fill-info" />
            <circle cx="80" cy="69" r="4.6" className="fill-info" />
        </>
    );
}

/**
 * A whole Penang coconut palm, the same crown as the Home headline's "i"s on a curved, leaning trunk.
 * `front`/`back` colour the fronds and `trunk` the trunk (Tailwind fill classes). Decorative only.
 */
export default function PalmTree({
    front,
    back,
    trunk,
    className,
}: {
    front: string;
    back: string;
    trunk: string;
    className?: string;
}) {
    return (
        <svg viewBox="-80 -50 320 350" className={cn("overflow-visible", className)} aria-hidden>
            <path d="M66 300 Q 56 190 75 64 L 87 64 Q 78 190 98 300 Z" className={trunk} />
            {/* Rings on the trunk. */}
            <path
                d="M81 300 Q 67 190 81 64"
                className="fill-none stroke-logo-backdrop/40"
                strokeWidth="16"
                strokeDasharray="1.5 9"
            />
            <g className={cn("origin-[80px_62px] [transform-box:view-box]", PALM_SWAY)}>
                {/* Twice the headline crown, scaled about its base so it stays on top of the trunk. */}
                <g transform="translate(80 62) scale(2) translate(-80 -62)">
                    <PalmCrown front={front} back={back} />
                </g>
            </g>
        </svg>
    );
}
