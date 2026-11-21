import { queryOptions } from "@tanstack/react-query";
import { api } from "./client";

export const segmentsQuery = queryOptions({
  queryKey: ["coastline", "segments"],
  queryFn: api.getSegments,
  staleTime: 5 * 60_000,
});

export const historyQuery = (segmentId: string) =>
  queryOptions({
    queryKey: ["coastline", "history", segmentId],
    queryFn: () => api.getSegmentHistory(segmentId),
    staleTime: 5 * 60_000,
  });

export const environmentQuery = (segmentId: string) =>
  queryOptions({
    queryKey: ["environment", segmentId],
    queryFn: () => api.getEnvironment(segmentId),
    staleTime: 5 * 60_000,
  });

/** All histories (one request per segment, as the backend contract defines). */
export const allHistoriesQuery = queryOptions({
  queryKey: ["coastline", "history", "all"],
  queryFn: async () => {
    const { segments } = await api.getSegments();
    return Promise.all(segments.map((s) => api.getSegmentHistory(s.id)));
  },
  staleTime: 5 * 60_000,
});

export const allEnvironmentQuery = queryOptions({
  queryKey: ["environment", "all"],
  queryFn: async () => {
    const { segments } = await api.getSegments();
    return Promise.all(segments.map((s) => api.getEnvironment(s.id)));
  },
  staleTime: 5 * 60_000,
});

export const modelPerformanceQuery = queryOptions({
  queryKey: ["model", "performance"],
  queryFn: api.getModelPerformance,
  staleTime: 5 * 60_000,
});
