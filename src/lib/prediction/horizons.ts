import type { PredictionHorizon } from "@/lib/api/types";

export interface HorizonOption {
  years: PredictionHorizon;
  label: string;
  experimental: boolean;
  note: string;
}

/** The model is designed for 1-year-ahead prediction; longer horizons are not validated. */
export const HORIZONS: HorizonOption[] = [
  { years: 1, label: "1 year", experimental: false, note: "Design horizon of the model" },
  { years: 3, label: "3 years", experimental: true, note: "Experimental — not validated" },
  { years: 5, label: "5 years", experimental: true, note: "Experimental — not validated" },
];

export function isExperimentalHorizon(h: PredictionHorizon) {
  return HORIZONS.find((o) => o.years === h)?.experimental ?? true;
}
