import { useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LrtLineSegment, LrtStation, StationConstructionStatus } from "@/types/lrt";

interface LrtRouteMapSvgProps {
    stations: LrtStation[];
    selectedStationId: string;
    onSelectStation: (station: LrtStation) => void;
    activeLineFilter?: LrtLineSegment | "all";
}

const statusFill: Record<StationConstructionStatus, string> = {
    completed: "#16a34a",
    ongoing: "#f59e0b",
    upcoming: "#0284c7",
};

const statusLabel: Record<StationConstructionStatus, string> = {
    completed: "Structure Completed",
    ongoing: "Active Construction",
    upcoming: "Upcoming / Preparatory",
};

export default function LrtRouteMapSvg({
    stations,
    selectedStationId,
    onSelectStation,
    activeLineFilter = "all",
}: LrtRouteMapSvgProps) {
    const [zoom, setZoom] = useState<number>(1);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const islandStations = stations
        .filter((station) => station.line === "island_mainline")
        .sort((a, b) => a.code.localeCompare(b.code));

    const bspStation = stations.find((station) => station.code === "S17");
    const sentralStation = stations.find((station) => station.code === "S20");

    const mainlinePoints = islandStations.map((station) => `${station.svgX},${station.svgY}`).join(" ");

    return (
        <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm">
            {/* Map top bar & controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Interactive Alignment Schematic
                    </p>
                    <h2 className="text-base font-semibold text-primary">
                        Penang LRT Mutiara Line Route Map (S01 – S20)
                    </h2>
                </div>

                <div className="flex items-center gap-1.5">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                        disabled={zoom <= 1}
                        aria-label="Zoom out route map"
                    >
                        <ZoomOut className="size-4" />
                    </Button>
                    <span className="min-w-12 text-center text-xs font-medium text-muted-foreground">
                        {Math.round(zoom * 100)}%
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom((z) => Math.min(1.75, +(z + 0.25).toFixed(2)))}
                        disabled={zoom >= 1.75}
                        aria-label="Zoom in route map"
                    >
                        <ZoomIn className="size-4" />
                    </Button>
                    {zoom > 1 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setZoom(1)}
                            aria-label="Reset zoom"
                        >
                            <RotateCcw className="size-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Scrollable SVG viewport */}
            <div className="overflow-x-auto bg-slate-950/95 p-3 sm:p-5">
                <div
                    className="mx-auto transition-transform duration-200 origin-top-left"
                    style={{
                        width: `${Math.round(100 * zoom)}%`,
                        minWidth: "740px",
                    }}
                >
                    <svg
                        viewBox="0 0 1020 510"
                        role="img"
                        aria-label="Interactive SVG transit route map of the Penang LRT Mutiara Line showing 20 stations across Penang Island and Penang Sentral"
                        className="h-auto w-full select-none"
                    >
                        <defs>
                            <linearGradient id="straitWater" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.45" />
                                <stop offset="100%" stopColor="#082f49" stopOpacity="0.75" />
                            </linearGradient>
                            <linearGradient id="islandLand" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
                            </linearGradient>
                            <filter id="stationGlow" x="-40%" y="-40%" width="180%" height="180%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Background Sea / Penang Strait */}
                        <rect x="0" y="0" width="1020" height="510" rx="14" fill="url(#straitWater)" />

                        {/* Subtle Coordinate Grid */}
                        <g stroke="#38bdf8" strokeOpacity="0.07" strokeWidth="1">
                            {[85, 170, 255, 340, 425].map((y) => (
                                <line key={`h-${y}`} x1="0" y1={y} x2="1020" y2={y} />
                            ))}
                            {[150, 300, 450, 600, 750, 900].map((x) => (
                                <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="510" />
                            ))}
                        </g>

                        {/* Stylized Penang Island Eastern Coastline Polygon */}
                        <path
                            d="M 20,25 L 855,25 Q 885,35 875,115 L 865,185 Q 800,150 715,190 L 580,275 L 405,380 L 230,468 L 20,468 Z"
                            fill="url(#islandLand)"
                            stroke="#334155"
                            strokeWidth="2"
                        />

                        {/* Stylized Silicon Island Reclamation Landmass */}
                        <path
                            d="M 45,420 L 170,420 Q 185,445 168,475 L 45,475 Q 32,450 45,420 Z"
                            fill="#1e293b"
                            stroke="#475569"
                            strokeDasharray="4 3"
                            strokeWidth="1.5"
                        />

                        {/* Stylized Seberang Perai (Butterworth / Mainland) Coastline */}
                        <path
                            d="M 915,25 L 1005,25 L 1005,485 L 925,485 Q 900,320 915,175 Z"
                            fill="url(#islandLand)"
                            stroke="#334155"
                            strokeWidth="2"
                        />

                        {/* Geographic Zone Labels */}
                        <text
                            x="48"
                            y="65"
                            fill="#64748b"
                            fontSize="13"
                            fontWeight="700"
                            letterSpacing="2"
                        >
                            PENANG ISLAND (TIMUR LAUT &amp; BARAT DAYA)
                        </text>
                        <text
                            x="875"
                            y="295"
                            fill="#38bdf8"
                            fillOpacity="0.55"
                            fontSize="11"
                            fontWeight="600"
                            letterSpacing="1.5"
                            textAnchor="middle"
                            transform="rotate(-78 875 295)"
                        >
                            PENANG STRAIT
                        </text>
                        <text
                            x="962"
                            y="70"
                            fill="#64748b"
                            fontSize="11"
                            fontWeight="700"
                            letterSpacing="1.5"
                            textAnchor="middle"
                        >
                            MAINLAND
                        </text>
                        <text
                            x="962"
                            y="85"
                            fill="#64748b"
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="middle"
                        >
                            (BUTTERWORTH)
                        </text>

                        {/* Corridor Zone Pills */}
                        <g fontSize="10" fontWeight="600" fill="#94a3b8">
                            <text x="108" y="492" textAnchor="middle">
                                SILICON ISLAND RECLAMATION
                            </text>
                            <text x="345" y="458" textAnchor="middle">
                                BAYAN LEPAS &amp; FIZ CORRIDOR
                            </text>
                            <text x="645" y="265" textAnchor="middle">
                                GELUGOR – USM – JELUTONG
                            </text>
                            <text x="745" y="52" textAnchor="end">
                                GEORGE TOWN HERITAGE BUFFER
                            </text>
                        </g>

                        {/* Cross-Channel Alignment Line (S17 Bandar Sri Pinang -> S20 Penang Sentral) */}
                        {bspStation && sentralStation && (
                            <g
                                opacity={
                                    activeLineFilter === "all" || activeLineFilter === "cross_channel"
                                        ? 1
                                        : 0.22
                                }
                            >
                                {/* Outer casing */}
                                <line
                                    x1={bspStation.svgX}
                                    y1={bspStation.svgY}
                                    x2={sentralStation.svgX}
                                    y2={sentralStation.svgY}
                                    stroke="#fef3c7"
                                    strokeOpacity="0.25"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                />
                                {/* Marine bridge dashed track */}
                                <line
                                    x1={bspStation.svgX}
                                    y1={bspStation.svgY}
                                    x2={sentralStation.svgX}
                                    y2={sentralStation.svgY}
                                    stroke="#f59e0b"
                                    strokeWidth="5"
                                    strokeDasharray="8 5"
                                    strokeLinecap="round"
                                />
                                <rect
                                    x={(bspStation.svgX + sentralStation.svgX) / 2 - 36}
                                    y={bspStation.svgY + 14}
                                    width="72"
                                    height="18"
                                    rx="4"
                                    fill="#0f172a"
                                    stroke="#f59e0b"
                                    strokeWidth="1"
                                />
                                <text
                                    x={(bspStation.svgX + sentralStation.svgX) / 2}
                                    y={bspStation.svgY + 26}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fontWeight="700"
                                    fill="#fbbf24"
                                >
                                    4.5 km Bridge
                                </text>
                            </g>
                        )}

                        {/* Main Island Alignment Polyline (S01 -> S19) */}
                        <g
                            opacity={
                                activeLineFilter === "all" || activeLineFilter === "island_mainline"
                                    ? 1
                                    : 0.22
                            }
                        >
                            <polyline
                                fill="none"
                                points={mainlinePoints}
                                stroke="#38bdf8"
                                strokeOpacity="0.2"
                                strokeWidth="14"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <polyline
                                fill="none"
                                points={mainlinePoints}
                                stroke="#0284c7"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </g>

                        {/* Station Nodes */}
                        {stations.map((station) => {
                            const isSelected = station.id === selectedStationId;
                            const isHovered = station.id === hoveredId;
                            const isInterchange = station.structureType === "Elevated Interchange";
                            const dimmed =
                                activeLineFilter !== "all" &&
                                station.line !== activeLineFilter &&
                                !(activeLineFilter === "cross_channel" && station.code === "S17");

                            const pos = station.labelPosition ?? "bottom";
                            let labelX = station.svgX;
                            let labelY = station.svgY + 22;
                            let textAnchor: "middle" | "start" | "end" = "middle";

                            if (pos === "top") {
                                labelY = station.svgY - 16;
                            } else if (pos === "left") {
                                labelX = station.svgX - 16;
                                labelY = station.svgY + 4;
                                textAnchor = "end";
                            } else if (pos === "right") {
                                labelX = station.svgX + 16;
                                labelY = station.svgY + 4;
                                textAnchor = "start";
                            }

                            return (
                                <g
                                    key={station.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${station.code} ${station.name} (${statusLabel[station.status]})`}
                                    opacity={dimmed ? 0.25 : 1}
                                    className="cursor-pointer focus:outline-none"
                                    onClick={() => onSelectStation(station)}
                                    onMouseEnter={() => setHoveredId(station.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            onSelectStation(station);
                                        }
                                    }}
                                >
                                    {/* Pulse ring when selected */}
                                    {(isSelected || isHovered) && (
                                        <circle
                                            cx={station.svgX}
                                            cy={station.svgY}
                                            r={isSelected ? 17 : 14}
                                            fill="none"
                                            stroke="#facc15"
                                            strokeWidth={isSelected ? "3" : "2"}
                                            filter="url(#stationGlow)"
                                        />
                                    )}

                                    {/* Outer station ring for interchanges */}
                                    {isInterchange && (
                                        <circle
                                            cx={station.svgX}
                                            cy={station.svgY}
                                            r={11}
                                            fill="#0f172a"
                                            stroke="#f8fafc"
                                            strokeWidth="2.5"
                                        />
                                    )}

                                    {/* Station Status Core Circle */}
                                    <circle
                                        cx={station.svgX}
                                        cy={station.svgY}
                                        r={isInterchange ? 7.5 : 6.5}
                                        fill={statusFill[station.status]}
                                        stroke="#0f172a"
                                        strokeWidth="2"
                                    />

                                    {/* Station Code + Name Label */}
                                    <g>
                                        <text
                                            x={labelX}
                                            y={labelY}
                                            textAnchor={textAnchor}
                                            fontSize={isSelected ? "11.5" : "10"}
                                            fontWeight={isSelected || isHovered ? "700" : "600"}
                                            fill={isSelected ? "#facc15" : "#f1f5f9"}
                                        >
                                            {station.code} {station.name}
                                        </text>
                                    </g>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Map Legend Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-card px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold text-foreground">Line Segments:</span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-1.5 w-5 rounded-full bg-sky-600" />
                        Mutiara Mainline (S01–S19)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-1.5 w-5 rounded-full border border-amber-500 bg-amber-500/80" />
                        Cross-Channel Link (S17–S20)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-3 rounded-full border-2 border-foreground bg-background" />
                        Interchange Hub
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold text-foreground">Station Status:</span>
                    {(["completed", "ongoing", "upcoming"] as StationConstructionStatus[]).map((status) => (
                        <span key={status} className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <span
                                className={cn("size-2.5 rounded-full")}
                                style={{ backgroundColor: statusFill[status] }}
                            />
                            {statusLabel[status]}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
