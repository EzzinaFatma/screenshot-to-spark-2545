import type { LatLng } from "@/lib/api/types";

const M_PER_DEG_LAT = 111_320;

/**
 * Offset a shoreline polyline by `meters` along its normal.
 * Lines are ordered NE → SW, so the left-hand normal points seaward.
 * Positive = seaward, negative = landward.
 */
export function offsetLine(coords: LatLng[], meters: number): LatLng[] {
  if (coords.length < 2 || meters === 0) return coords;
  return coords.map((c, i) => {
    const a = coords[Math.max(0, i - 1)] ?? c;
    const b = coords[Math.min(coords.length - 1, i + 1)] ?? c;
    const kx = Math.cos((c[0] * Math.PI) / 180) * M_PER_DEG_LAT;
    const dx = (b[1] - a[1]) * kx;
    const dy = (b[0] - a[0]) * M_PER_DEG_LAT;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return [c[0] + (ny * meters) / M_PER_DEG_LAT, c[1] + (nx * meters) / kx] as LatLng;
  });
}

export function boundsOf(coords: LatLng[]): [LatLng, LatLng] {
  let minLat = Infinity,
    minLng = Infinity,
    maxLat = -Infinity,
    maxLng = -Infinity;
  for (const [la, ln] of coords) {
    minLat = Math.min(minLat, la);
    maxLat = Math.max(maxLat, la);
    minLng = Math.min(minLng, ln);
    maxLng = Math.max(maxLng, ln);
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/** Named places for the map search. */
export const GAZETTEER: { name: string; hint: string; segmentId: string }[] = [
  { name: "El Mrezga", hint: "Northern beach, towards Nabeul", segmentId: "HMB-02" },
  { name: "Hammamet North", hint: "Hotel frontage east of the Medina", segmentId: "HMB-05" },
  { name: "Hammamet Medina", hint: "Historic kasbah headland", segmentId: "HMB-07" },
  { name: "Hammamet South", hint: "Tourist zone", segmentId: "HMB-09" },
  { name: "Yasmine Hammamet Marina", hint: "Marina breakwater", segmentId: "HMB-12" },
];
