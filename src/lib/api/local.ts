/**
 * Local demo data source: structured JSON in src/data (SIMULATED values).
 * Same response shapes as the future FastAPI endpoints.
 */
import segmentsJson from "@/data/segments.json";
import historyJson from "@/data/history.json";
import environmentJson from "@/data/environment.json";
import modelPerformanceJson from "@/data/model-performance.json";
import { runDemoPrediction } from "@/lib/prediction/demo-model";
import type {
  ModelPerformanceResponse,
  PredictionRequest,
  PredictionResponse,
  SegmentEnvironment,
  SegmentHistory,
  SegmentsResponse,
} from "./types";

const segmentsData = segmentsJson as unknown as SegmentsResponse;
const histories = historyJson as unknown as SegmentHistory[];
const environments = environmentJson as unknown as SegmentEnvironment[];
const modelPerformance = modelPerformanceJson as unknown as ModelPerformanceResponse;

export const localApi = {
  async getSegments(): Promise<SegmentsResponse> {
    return segmentsData;
  },
  async getSegmentHistory(segmentId: string): Promise<SegmentHistory> {
    const h = histories.find((x) => x.segmentId === segmentId);
    if (!h) throw new Error(`Unknown segment ${segmentId}`);
    return h;
  },
  async getEnvironment(segmentId: string): Promise<SegmentEnvironment> {
    const e = environments.find((x) => x.segmentId === segmentId);
    if (!e) throw new Error(`Unknown segment ${segmentId}`);
    return e;
  },
  async runPrediction(body: PredictionRequest): Promise<PredictionResponse> {
    // Small delay so the UI shows the run state like a real backend call.
    await new Promise((r) => setTimeout(r, 650));
    return runDemoPrediction(segmentsData.segments, body);
  },
  async getModelPerformance(): Promise<ModelPerformanceResponse> {
    return modelPerformance;
  },
};
