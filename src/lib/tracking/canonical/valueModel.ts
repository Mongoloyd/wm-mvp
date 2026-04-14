import type { WMOptimizationPayload, WMTrustScoreResult } from "./types";

interface WMValueModelInput {
  quoteAmount?: number;
  openingCount?: number;
  trustResult: WMTrustScoreResult;
}

function clampPriority(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildOptimizationPayload(input: WMValueModelInput): WMOptimizationPayload {
  const { trustResult, quoteAmount = 0, openingCount = 0 } = input;

  const baseValue = quoteAmount > 0 ? quoteAmount * 0.02 : 0;
  const openingBonus = openingCount > 0 ? Math.min(250, openingCount * 12) : 0;
  const trustMultiplier = trustResult.trustScore;

  const valueUsd = Number((baseValue * trustMultiplier + openingBonus).toFixed(2));

  const priority = clampPriority(
    trustResult.trustScore * 65 +
      (trustResult.anomalyStatus === "safe" ? 20 : 0) +
      (trustResult.manualReviewRequired ? -20 : 15),
  );

  return {
    approvedForIndex: trustResult.approvedForIndex,
    approvedForAds: trustResult.approvedForAds,
    manualReviewRequired: trustResult.manualReviewRequired,
    valueUsd,
    priority,
  };
}
