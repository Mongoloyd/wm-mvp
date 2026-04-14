import type { WMIdentityQuality, WMQuotePayload } from "./types.ts";

interface TrustInput {
  quote?: WMQuotePayload;
  identityQuality: WMIdentityQuality;
}

const WEIGHTS = {
  ocrConfidence: 0.2,
  completeness: 0.2,
  mathConsistency: 0.15,
  cohortFit: 0.15,
  scopeConsistency: 0.1,
  documentValidity: 0.1,
  identityStrength: 0.1,
} as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function metric(value: number | null | undefined, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return clamp01(value);
}

function identityStrength(identityQuality: WMIdentityQuality): number {
  switch (identityQuality) {
    case "strong": return 1;
    case "medium": return 0.75;
    case "weak": return 0.45;
    default: return 0;
  }
}

export function computeTrustScore({ quote, identityQuality }: TrustInput): number {
  if (!quote) return identityStrength(identityQuality) * 0.2;

  const weighted =
    metric(quote.ocrConfidence) * WEIGHTS.ocrConfidence +
    metric(quote.completeness) * WEIGHTS.completeness +
    metric(quote.mathConsistency) * WEIGHTS.mathConsistency +
    metric(quote.cohortFit) * WEIGHTS.cohortFit +
    metric(quote.scopeConsistency) * WEIGHTS.scopeConsistency +
    metric(quote.documentValidity) * WEIGHTS.documentValidity +
    identityStrength(identityQuality) * WEIGHTS.identityStrength;

  return Number(clamp01(weighted).toFixed(4));
}
