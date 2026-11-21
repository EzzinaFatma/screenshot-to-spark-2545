import type { Provenance } from "@/lib/api/types";

export const PROVENANCE_META: Record<Provenance, { label: string; description: string }> = {
  historical: {
    label: "Historical data",
    description: "Measured reference shorelines (surveys, digitised archives, World Bank dataset).",
  },
  satellite: {
    label: "Satellite observation",
    description: "Shorelines and indices derived from Landsat / Sentinel-2 imagery.",
  },
  prediction: {
    label: "AI prediction",
    description: "Model-generated estimates of future shoreline position.",
  },
  demo: {
    label: "Demo data",
    description: "Simulated values for demonstration only — not scientific results.",
  },
};
