import { describe, expect, it } from "vitest";
import { evaluateAnomaly, iqrFenceScore, robustZScore } from "../anomaly";

describe("canonical anomaly helpers", () => {
  it("computes robust z-score deterministically", () => {
    const z = robustZScore(2200, 1500, 200);
    expect(z).toBeCloseTo(2.36075, 4);
  });

  it("returns 0 when value is inside IQR fence", () => {
    const score = iqrFenceScore(1600, 1200, 1800);
    expect(score).toBe(0);
  });

  it("returns elevated score when value is outside IQR fence", () => {
    const score = iqrFenceScore(3500, 1200, 1800);
    expect(score).toBeGreaterThan(0.4);
  });

  it("flags impossible values immediately", () => {
    const result = evaluateAnomaly({ impossibleValuesDetected: true });
    expect(result.anomalyScoreContribution).toBe(1);
    expect(result.reasons).toContain("impossible_values_detected");
  });
});
