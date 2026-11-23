import { describe, expect, it } from "vitest";
import { classifyRisk } from "@/lib/risk";
import { isExperimentalHorizon } from "@/lib/prediction/horizons";
import { findHotspots } from "@/lib/analytics";
import type { CoastalSegment } from "@/lib/api/types";

describe("risk levels from yearly retreat", () => {
  it("2 m/yr or more is critical", () => {
    expect(classifyRisk(2)).toBe("critical");
    expect(classifyRisk(3.4)).toBe("critical");
  });
  it("1 to under 2 m/yr is high", () => {
    expect(classifyRisk(1)).toBe("high");
    expect(classifyRisk(1.99)).toBe("high");
  });
  it("0.5 to under 1 m/yr is moderate", () => {
    expect(classifyRisk(0.5)).toBe("moderate");
    expect(classifyRisk(0.99)).toBe("moderate");
  });
  it("under 0.5 m/yr or accretion is low", () => {
    expect(classifyRisk(0.49)).toBe("low");
    expect(classifyRisk(-1.2)).toBe("low");
  });
});

describe("prediction horizons", () => {
  it("1 year is the validated horizon", () => {
    expect(isExperimentalHorizon(1)).toBe(false);
  });
  it("3 and 5 years are experimental", () => {
    expect(isExperimentalHorizon(3)).toBe(true);
    expect(isExperimentalHorizon(5)).toBe(true);
  });
});

describe("erosion hotspots", () => {
  const seg = (id: string, historicalRate: number) => ({ id, historicalRate }) as CoastalSegment;
  it("keeps segments retreating at least the threshold, fastest first", () => {
    const result = findHotspots([seg("A", -0.9), seg("B", -2.4), seg("C", 0.8), seg("D", -1)], 1);
    expect(result.map((s) => s.id)).toEqual(["B", "D"]);
  });
});
