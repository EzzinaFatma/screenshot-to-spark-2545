import { useMemo } from "react";
import type { CoastalSegment } from "@/lib/api/types";
import { riskStrokeClass } from "@/lib/risk";
import { cn } from "@/lib/utils";

/**
 * Lightweight SVG schematic of the monitored coastline (no map tiles).
 * Used for hero art, mini locators and value choropleths.
 */
export function CoastlineLocator({
  segments,
  selectedId,
  onSelect,
  colorFor,
  tone = "light",
  showLabels = false,
  className,
  strokeWidth = 5,
}: {
  segments: CoastalSegment[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  colorFor?: (s: CoastalSegment) => string;
  tone?: "light" | "dark";
  showLabels?: boolean;
  className?: string;
  strokeWidth?: number;
}) {
  const { paths, labels, viewBox } = useMemo(() => {
    const all = segments.flatMap((s) => s.coordinates);
    const lats = all.map((c) => c[0]);
    const lngs = all.map((c) => c[1]);
    const minLat = Math.min(...lats),
      maxLat = Math.max(...lats),
      minLng = Math.min(...lngs),
      maxLng = Math.max(...lngs);
    const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
    const W = 400;
    const scale = W / ((maxLng - minLng) * k);
    const H = (maxLat - minLat) * scale;
    const pad = 24;
    const project = ([la, ln]: [number, number]) =>
      [pad + (ln - minLng) * k * scale, pad + (maxLat - la) * scale] as const;
    const paths = segments.map((s) => ({
      seg: s,
      d: s.coordinates.map((c, i) => `${i ? "L" : "M"}${project(c).map((v) => v.toFixed(1)).join(" ")}`).join(" "),
      mid: project(s.centroid),
    }));
    const zones = Array.from(new Set(segments.map((s) => s.zone)));
    const labels = zones.map((z) => {
      const segs = segments.filter((s) => s.zone === z);
      const mid = segs[Math.floor(segs.length / 2)];
      return { zone: z, at: mid ? project(mid.centroid) : ([0, 0] as const) };
    });
    return { paths, labels, viewBox: `0 0 ${W + pad * 2} ${H + pad * 2}` };
  }, [segments]);

  return (
    <svg viewBox={viewBox} className={cn("h-auto w-full", className)} role="img" aria-label="Schematic of monitored coastline segments">
      {paths.map(({ seg, d }) => (
        <path
          key={`halo-${seg.id}`}
          d={d}
          fill="none"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          className={tone === "dark" ? "seg-halo" : "stroke-card"}
        />
      ))}
      {paths.map(({ seg, d }) => {
        const selected = seg.id === selectedId;
        return (
          <path
            key={seg.id}
            d={d}
            fill="none"
            strokeWidth={selected ? strokeWidth + 4 : strokeWidth}
            strokeLinecap="round"
            className={cn(
              !colorFor && riskStrokeClass(seg.risk),
              onSelect && "cursor-pointer transition-[stroke-width] hover:opacity-80",
              selectedId && !selected && "opacity-40",
            )}
            style={colorFor ? { stroke: colorFor(seg) } : undefined}
            onClick={onSelect ? () => onSelect(seg.id) : undefined}
          >
            <title>{`${seg.id} · ${seg.name}`}</title>
          </path>
        );
      })}
      {selectedId
        ? paths
            .filter((p) => p.seg.id === selectedId)
            .map((p) => (
              <circle key="sel" cx={p.mid[0]} cy={p.mid[1]} r={strokeWidth + 5} fill="none" strokeWidth={1.5} className="stroke-foreground" />
            ))
        : null}
      {showLabels
        ? labels.map((l) => (
            <text
              key={l.zone}
              x={l.at[0] - 14}
              y={l.at[1] - 14}
              textAnchor="end"
              className={cn("font-mono text-[10px] uppercase tracking-wider", tone === "dark" ? "fill-navy-muted" : "fill-muted-foreground")}
            >
              {l.zone}
            </text>
          ))
        : null}
    </svg>
  );
}
