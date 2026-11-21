/**
 * CoastGuard AI data layer.
 *
 * Without VITE_COASTGUARD_API_URL the app reads the local demo JSON (src/data).
 * Set VITE_COASTGUARD_API_URL to a FastAPI server exposing:
 *   GET  /api/coastline/segments
 *   GET  /api/coastline/history/{segment_id}
 *   GET  /api/environment/{segment_id}
 *   POST /api/predictions
 *   GET  /api/model/performance
 * and every page switches to real responses with no UI changes.
 */
import { localApi } from "./local";
import type {
  ModelPerformanceResponse,
  PredictionRequest,
  PredictionResponse,
  SegmentEnvironment,
  SegmentHistory,
  SegmentsResponse,
} from "./types";

const API_BASE: string | undefined = import.meta.env.VITE_COASTGUARD_API_URL;

export const isLiveBackend = Boolean(API_BASE);

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CoastGuard API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export const api = {
  getSegments: (): Promise<SegmentsResponse> =>
    API_BASE ? http("/api/coastline/segments") : localApi.getSegments(),
  getSegmentHistory: (id: string): Promise<SegmentHistory> =>
    API_BASE
      ? http(`/api/coastline/history/${encodeURIComponent(id)}`)
      : localApi.getSegmentHistory(id),
  getEnvironment: (id: string): Promise<SegmentEnvironment> =>
    API_BASE ? http(`/api/environment/${encodeURIComponent(id)}`) : localApi.getEnvironment(id),
  runPrediction: (body: PredictionRequest): Promise<PredictionResponse> =>
    API_BASE
      ? http("/api/predictions", { method: "POST", body: JSON.stringify(body) })
      : localApi.runPrediction(body),
  getModelPerformance: (): Promise<ModelPerformanceResponse> =>
    API_BASE ? http("/api/model/performance") : localApi.getModelPerformance(),
};
