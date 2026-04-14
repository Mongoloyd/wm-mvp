import type { WMAnomalyStatus, WMQuotePayload, WMTrustResult } from "./types.ts";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function pctFromNullable(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return clamp01(value);
}

export function computeAnomalyScore(quote?: WMQuotePayload): number {
  if (!quote) return 0;

  let score = 0;
  if (quote.isWindowDoorQuote === false) score += 0.8;
  if (quote.impossibleValueDetected) score += 0.7;
  if (quote.quotedAmount !== null && quote.quotedAmount !== undefined && quote.quotedAmount <= 0) score += 0.7;

  // Lower quality inputs increase anomaly score
  score += (1 - pctFromNullable(quote.ocrConfidence)) * 0.1;
  score += (1 - pctFromNullable(quote.mathConsistency)) * 0.1;
  score += (1 - pctFromNullable(quote.documentValidity)) * 0.1;

  return Number(clamp01(score).toFixed(4));
}

export function routeQuoteTrust(trustScore: number, anomalyScore: number, quote?: WMQuotePayload): WMTrustResult {
  const reasons: string[] = [];
  let anomalyStatus: WMAnomalyStatus = "safe";

  if (quote?.isWindowDoorQuote === false) {
    reasons.push("not_window_door_quote");
    anomalyStatus = "reject";
  }

  if (quote?.impossibleValueDetected || (quote?.quotedAmount !== undefined && quote?.quotedAmount !== null && quote.quotedAmount <= 0)) {
    reasons.push("impossible_quote_value");
    anomalyStatus = "reject";
  }

  if (anomalyStatus !== "reject") {
    if (anomalyScore >= 0.8 || trustScore < 0.25) {
      anomalyStatus = "reject";
      reasons.push("severe_anomaly_signal");
    } else if (anomalyScore >= 0.65 || trustScore < 0.45) {
      anomalyStatus = "quarantine";
      reasons.push("quarantine_threshold");
    } else if (anomalyScore >= 0.4 || trustScore < 0.6) {
      anomalyStatus = "review";
      reasons.push("manual_review_threshold");
    }
  }

  const manualReviewRequired = anomalyStatus === "review" || anomalyStatus === "quarantine";
  const approvedForIndex = anomalyStatus === "safe";
  const approvedForAds = anomalyStatus === "safe";

  if (approvedForAds && trustScore < 0.65) {
    reasons.push("ads_trust_threshold_not_met");
  }

  return {
    trustScore,
    anomalyScore,
    anomalyStatus,
    manualReviewRequired,
    approvedForIndex,
    approvedForAds,
    reasons,
  };
}
