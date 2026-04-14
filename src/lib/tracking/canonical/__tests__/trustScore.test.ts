import { describe, expect, it } from "vitest";
import { evaluateQuoteTrust } from "../trustScore";
import type { WMTrustScoreInput } from "../types";

function baseInput(overrides: Partial<WMTrustScoreInput> = {}): WMTrustScoreInput {
  return {
    documentType: "impact_window_quote",
    isQuoteDocument: true,
    duplicateSuspected: false,
    impossibleValuesDetected: false,
    ocrConfidence: 0.95,
    completeness: 0.92,
    mathConsistency: 0.94,
    cohortFit: 0.9,
    scopeConsistency: 0.91,
    documentValidity: 0.96,
    identityStrength: 0.85,
    anomalyInput: {
      quoteAmount: 22000,
      pricePerOpening: 1400,
      depositPercent: 20,
      cohortStats: {
        median: 1500,
        mad: 180,
        p10: 1100,
        p25: 1250,
        p75: 1800,
        p90: 2200,
      },
    },
    ...overrides,
  };
}

describe("canonical trust scoring", () => {
  it("approves only safe quotes for index + ads", () => {
    const result = evaluateQuoteTrust(baseInput());

    expect(result.anomalyStatus).toBe("safe");
    expect(result.approvedForIndex).toBe(true);
    expect(result.approvedForAds).toBe(true);
    expect(result.manualReviewRequired).toBe(false);
  });

  it("rejects non-quote documents", () => {
    const result = evaluateQuoteTrust(baseInput({ isQuoteDocument: false, documentType: "receipt" }));

    expect(result.anomalyStatus).toBe("reject");
    expect(result.approvedForIndex).toBe(false);
    expect(result.approvedForAds).toBe(false);
    expect(result.reasons).toContain("document_not_quote");
  });

  it("rejects impossible values", () => {
    const result = evaluateQuoteTrust(baseInput({ impossibleValuesDetected: true }));

    expect(result.anomalyStatus).toBe("reject");
    expect(result.reasons).toContain("impossible_values_detected");
  });

  it("penalizes severe math mismatch and duplicate suspicion", () => {
    const clean = evaluateQuoteTrust(baseInput());
    const penalized = evaluateQuoteTrust(
      baseInput({
        mathConsistency: 0.2,
        duplicateSuspected: true,
      }),
    );

    expect(penalized.trustScore).toBeLessThan(clean.trustScore);
    expect(penalized.reasons).toContain("severe_math_mismatch");
    expect(penalized.reasons).toContain("duplicate_suspected");
  });

  it("blocks non-safe statuses from index + ads approvals", () => {
    const review = evaluateQuoteTrust(
      baseInput({
        ocrConfidence: 0.4,
        completeness: 0.45,
        mathConsistency: 0.45,
        cohortFit: 0.35,
        scopeConsistency: 0.4,
        documentValidity: 0.5,
        identityStrength: 0.2,
      }),
    );

    expect(["review", "quarantine", "reject"]).toContain(review.anomalyStatus);
    expect(review.approvedForIndex).toBe(false);
    expect(review.approvedForAds).toBe(false);
    expect(review.manualReviewRequired).toBe(true);
  });
});
