import type { CoastalSegment, EnvironmentRecord, SegmentEnvironment, SegmentHistory } from "@/lib/api/types";

const r = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

type NumericKey = Exclude<keyof EnvironmentRecord, "month">;

/** Circular mean of directions in degrees. */
export function circularMean(degs: number[]) {
  let s = 0,
    c = 0;
  for (const d of degs) {
    s += Math.sin((d * Math.PI) / 180);
    c += Math.cos((d * Math.PI) / 180);
  }
  return (((Math.atan2(s, c) * 180) / Math.PI) + 360) % 360;
}

/** Month-by-month mean across segments (bay-wide series). */
export function meanSeries(envs: SegmentEnvironment[]): EnvironmentRecord[] {
  const first = envs[0];
  if (!first) return [];
  return first.series.map((rec, i) => {
    const rows = envs.map((e) => e.series[i]).filter((x): x is EnvironmentRecord => Boolean(x));
    const avg = (k: NumericKey) => rows.reduce((a, x) => a + x[k], 0) / rows.length;
    return {
      month: rec.month,
      waveHeight: r(avg("waveHeight")),
      wavePeriod: r(avg("wavePeriod")),
      waveDirection: Math.round(circularMean(rows.map((x) => x.waveDirection))),
      windSpeed: r(avg("windSpeed")),
      seaLevelAnomaly: r(avg("seaLevelAnomaly"), 1),
      ndwi: r(avg("ndwi"), 3),
      mndwi: r(avg("mndwi"), 3),
    };
  });
}

export function seriesMean(series: EnvironmentRecord[], key: NumericKey) {
  if (!series.length) return 0;
  if (key === "waveDirection") return circularMean(series.map((s) => s.waveDirection));
  return series.reduce((a, s) => a + s[key], 0) / series.length;
}

const SECTORS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Wave rose: share of months per 45° sector and mean wave height in that sector. */
export function directionRose(series: EnvironmentRecord[]) {
  const bins = SECTORS.map((sector) => ({ sector, count: 0, heightSum: 0 }));
  for (const s of series) {
    const idx = Math.round((((s.waveDirection % 360) + 360) % 360) / 45) % 8;
    const bin = bins[idx];
    if (bin) {
      bin.count += 1;
      bin.heightSum += s.waveHeight;
    }
  }
  return bins.map((b) => ({
    sector: b.sector,
    share: series.length ? r((b.count / series.length) * 100, 1) : 0,
    meanHeight: b.count ? r(b.heightSum / b.count) : 0,
  }));
}

/** Least-squares slope per year of a monthly series. */
export function trendPerYear(values: number[]) {
  const n = values.length;
  if (n < 2) return 0;
  const xs = values.map((_, i) => i / 12);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = values.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    den = 0;
  values.forEach((y, i) => {
    const x = xs[i] ?? 0;
    num += (x - mx) * (y - my);
    den += (x - mx) ** 2;
  });
  return den ? num / den : 0;
}

/** Segments whose historical erosion rate meets or exceeds the threshold (m/yr retreat). */
export function findHotspots(segments: CoastalSegment[], threshold: number) {
  return segments
    .filter((s) => -s.historicalRate >= threshold)
    .sort((a, b) => a.historicalRate - b.historicalRate);
}

/** Year × segment matrix of shoreline positions. */
export function positionMatrix(histories: SegmentHistory[]) {
  const years = histories[0]?.observations.map((o) => o.year) ?? [];
  const max = Math.max(1, ...histories.flatMap((h) => h.observations.map((o) => Math.abs(o.position))));
  return { years, max };
}

/** Mean annual rate across segments per year. */
export function bayAnnualRates(histories: SegmentHistory[]) {
  const first = histories[0];
  if (!first) return [];
  return first.annualRates.map((a, i) => ({
    year: a.year,
    rate: r(histories.reduce((acc, h) => acc + (h.annualRates[i]?.rate ?? 0), 0) / histories.length),
  }));
}
