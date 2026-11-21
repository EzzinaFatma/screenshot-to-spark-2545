/**
 * DEMONSTRATION CALCULATION — not a trained model.
 *
 * A transparent heuristic used until the Python ML backend (Random Forest / XGBoost)
 * is connected. It scales each segment's historical retreat by simple forcing ratios.
 * Results are flagged with provenance "demo" everywhere in the UI.
 */
import type {
  CoastalSegment,
  LandCoverScenario,
  PredictionRequest,
  PredictionResponse,
  SegmentPrediction,
} from "@/lib/api/types";
import { offsetLine } from "@/lib/geo";
import { classifyRisk } from "@/lib/risk";
import { isExperimentalHorizon } from "./horizons";

export const DEMO_MODEL_ID = "demo_heuristic";

/** Reference (baseline) forcing — the mean of the simulated environmental series. */
export const REFERENCE_INPUTS: Omit<PredictionRequest, "horizon" | "modelId"> = {
  waveHeight: 0.85,
  waveDirection: 85,
  wavePeriod: 5.2,
  windSpeed: 5.6,
  seaLevelRise: 3.1,
  ndwi: 0.31,
  mndwi: 0.39,
  landCover: "baseline",
};

const LAND_COVER_FACTOR: Record<LandCoverScenario, number> = {
  baseline: 1,
  urbanisation: 1.15,
  dune_restoration: 0.85,
};

/** Approximate shore-normal direction for the bay (waves arriving from ESE hit hardest). */
const SHORE_NORMAL_DEG = 115;

export function forcingFactor(input: PredictionRequest) {
  const r = REFERENCE_INPUTS;
  const energy = (input.waveHeight / r.waveHeight) ** 2 * (input.wavePeriod / r.wavePeriod);
  const angle = ((input.waveDirection - SHORE_NORMAL_DEG) * Math.PI) / 180;
  const refAngle = ((r.waveDirection - SHORE_NORMAL_DEG) * Math.PI) / 180;
  const direction = (0.7 + 0.3 * Math.cos(angle)) / (0.7 + 0.3 * Math.cos(refAngle));
  const wind = 1 + 0.04 * (input.windSpeed - r.windSpeed);
  const wetness = 1 + 1.5 * (input.mndwi - r.mndwi) + 0.8 * (input.ndwi - r.ndwi);
  return Math.max(0.1, energy * direction * wind * wetness * LAND_COVER_FACTOR[input.landCover]);
}

export function demoPredictSegment(
  segment: CoastalSegment,
  input: PredictionRequest,
): SegmentPrediction {
  const h = input.horizon;
  const base = -segment.historicalRate; // m/yr retreat (negative = accretion)
  const driver = forcingFactor(input);
  const slrTerm = 0.06 * (input.seaLevelRise - REFERENCE_INPUTS.seaLevelRise);
  const annual = (base >= 0 ? base * driver : base / driver) + slrTerm;
  const retreat = annual * h;
  const spread =
    segment.uncertainty1y *
    Math.sqrt(h) *
    (isExperimentalHorizon(h) ? 1.6 : 1) *
    (1 + Math.abs(driver - 1) * 0.5);
  const round = (v: number) => Math.round(v * 100) / 100;
  return {
    segmentId: segment.id,
    retreat: round(retreat),
    lower: round(retreat - spread),
    upper: round(retreat + spread),
    annualRetreat: round(annual),
    risk: classifyRisk(annual),
    predictedShoreline: offsetLine(segment.coordinates, -retreat),
  };
}

export function runDemoPrediction(
  segments: CoastalSegment[],
  input: PredictionRequest,
): PredictionResponse {
  const subset = input.segmentIds?.length
    ? segments.filter((s) => input.segmentIds?.includes(s.id))
    : segments;
  const now = new Date();
  return {
    runId: `DEMO-${now.getTime().toString(36).toUpperCase()}`,
    modelId: DEMO_MODEL_ID,
    modelName: "Demonstration heuristic",
    provenance: "demo",
    horizon: input.horizon,
    experimental: isExperimentalHorizon(input.horizon),
    generatedAt: now.toISOString(),
    predictions: subset.map((s) => demoPredictSegment(s, input)),
  };
}
