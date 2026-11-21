import type { CoastalSegment, LatLng } from "@/lib/api/types";

export interface CoastalMapProps {
  segments: CoastalSegment[];
  selectedId?: string | null;
  /** Changing this value flies the map to the segment and opens its popup. */
  focusRequest?: { id: string; nonce: number } | null;
  onSelect?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  /** Visual exaggeration of historical / predicted shoreline offsets. */
  exaggeration?: number;
  /** Optional override of predicted shorelines (e.g. from a prediction run). */
  predictedShorelines?: Record<string, LatLng[]>;
  compact?: boolean;
  className?: string;
}
