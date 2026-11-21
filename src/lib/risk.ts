import type { RiskLevel } from "@/lib/api/types";

export const RISK_LEVELS: RiskLevel[] = ["low", "moderate", "high", "critical"];

export const RISK_META: Record<RiskLevel, { label: string; range: string; colorVar: string }> = {
  low: { label: "Low", range: "< 0.5 m/yr retreat, or accretion", colorVar: "var(--risk-low)" },
  moderate: { label: "Moderate", range: "0.5 – 1.0 m/yr retreat", colorVar: "var(--risk-moderate)" },
  high: { label: "High", range: "1.0 – 2.0 m/yr retreat", colorVar: "var(--risk-high)" },
  critical: { label: "Critical", range: "≥ 2.0 m/yr retreat", colorVar: "var(--risk-critical)" },
};

/**
 * Classify erosion risk from an annual shoreline retreat (m/yr).
 * Positive = landward retreat; zero or negative (accretion) is low risk.
 */
export function classifyRisk(annualRetreat: number): RiskLevel {
  if (annualRetreat >= 2) return "critical";
  if (annualRetreat >= 1) return "high";
  if (annualRetreat >= 0.5) return "moderate";
  return "low";
}

export function riskStrokeClass(risk: RiskLevel) {
  return `seg-risk-${risk}`;
}
