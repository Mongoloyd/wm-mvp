import type { WMIdentityPayload, WMIdentityQuality } from "./types";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function computeIdentityStrength(payload: WMIdentityPayload): number {
  let score = 0;

  if (payload.leadId) score += 0.15;
  if (payload.userId) score += 0.2;
  if (payload.emailPresent) score += 0.1;
  if (payload.phonePresent) score += 0.1;
  if (payload.phoneVerifiedAt) score += 0.25;
  if (payload.sameDeviceAsUpload) score += 0.1;

  if (payload.ipRiskLevel === "low") score += 0.1;
  if (payload.ipRiskLevel === "medium") score += 0.05;

  return clamp01(score);
}

export function computeIdentityQuality(payload: WMIdentityPayload): WMIdentityQuality {
  const strength = computeIdentityStrength(payload);

  if (strength >= 0.8) return "strong";
  if (strength >= 0.5) return "medium";
  if (strength > 0) return "weak";
  return "unknown";
}
