/**
 * Data contracts shared by the local demo dataset and the future FastAPI backend.
 * Each type mirrors one backend endpoint response (see src/lib/api/client.ts).
 */

export type RiskLevel = "low" | "moderate" | "high" | "critical";

/** Where a value comes from. "demo" marks simulated values that are not scientific results. */
export type Provenance = "historical" | "satellite" | "prediction" | "demo";

export type LatLng = [number, number];

export interface DatasetMeta {
  studyArea: string;
  generated: string;
  provenance: Provenance;
  notice: string;
  historyPeriod: [number, number];
  environmentPeriod: [string, string];
}

export interface CoastalSegment {
  id: string;
  name: string;
  zone: string;
  zoneCode: string;
  coordinates: LatLng[];
  centroid: LatLng;
  lengthKm: number;
  /** End-point rate over the history period, m/yr. Negative = erosion, positive = accretion. */
  historicalRate: number;
  /** Predicted shoreline retreat over the next year, m. Negative = accretion (seaward advance). */
  predictedRetreat1y: number;
  /** ± uncertainty on the 1-year prediction, m. */
  uncertainty1y: number;
  risk: RiskLevel;
  lastObservation: string;
  shorelineType: string;
  landCover: string;
  exposure: number;
  dataSource: string;
  provenance: Provenance;
}

/** GET /api/coastline/segments */
export interface SegmentsResponse {
  meta: DatasetMeta;
  segments: CoastalSegment[];
}

export interface ShorelineObservation {
  year: number;
  /** Shoreline position relative to the baseline year, m. Negative = landward. */
  position: number;
  source: "historical" | "satellite";
  sensor: string;
}

/** GET /api/coastline/history/{segment_id} */
export interface SegmentHistory {
  segmentId: string;
  baselineYear: number;
  observations: ShorelineObservation[];
  annualRates: { year: number; rate: number }[];
  provenance: Provenance;
}

export interface EnvironmentRecord {
  month: string;
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  windSpeed: number;
  seaLevelAnomaly: number;
  ndwi: number;
  mndwi: number;
}

/** GET /api/environment/{segment_id} */
export interface SegmentEnvironment {
  segmentId: string;
  exposure: number;
  series: EnvironmentRecord[];
  provenance: Provenance;
}

export type PredictionHorizon = 1 | 3 | 5;
export type LandCoverScenario = "baseline" | "urbanisation" | "dune_restoration";

/** POST /api/predictions request body */
export interface PredictionRequest {
  horizon: PredictionHorizon;
  modelId: string;
  waveHeight: number;
  waveDirection: number;
  wavePeriod: number;
  windSpeed: number;
  /** Sea-level rise rate, mm/yr */
  seaLevelRise: number;
  ndwi: number;
  mndwi: number;
  landCover: LandCoverScenario;
  segmentIds?: string[];
}

export interface SegmentPrediction {
  segmentId: string;
  /** Total retreat over the horizon, m. Negative = accretion. */
  retreat: number;
  lower: number;
  upper: number;
  /** Retreat expressed per year, used for risk classification. */
  annualRetreat: number;
  risk: RiskLevel;
  predictedShoreline: LatLng[];
}

/** POST /api/predictions response */
export interface PredictionResponse {
  runId: string;
  modelId: string;
  modelName: string;
  provenance: Provenance;
  horizon: PredictionHorizon;
  experimental: boolean;
  generatedAt: string;
  predictions: SegmentPrediction[];
}

export type ModelStatus = "awaiting_training" | "training" | "trained";

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
}

export interface ModelEntry {
  id: string;
  name: string;
  library: string;
  status: ModelStatus;
  trainedAt: string | null;
  metrics: ModelMetrics | null;
  actualVsPredicted: { segmentId: string; actual: number; predicted: number }[] | null;
  featureImportance: { feature: string; importance: number }[] | null;
}

/** GET /api/model/performance */
export interface ModelPerformanceResponse {
  status: ModelStatus;
  trainingDataset: string | null;
  target: string;
  validation: string;
  models: ModelEntry[];
  features: string[];
}
