export const WM_EVENT_NAMES = [
  "virtual_page_view",
  "scan_initiated",
  "quote_uploaded",
  "teaser_viewed",
  "otp_started",
  "otp_sent",
  "phone_verified",
  "report_revealed",
  "contractor_match_requested",
  "appointment_booked",
  "sold",
] as const;

export const WM_ANOMALY_STATUSES = ["safe", "review", "quarantine", "reject"] as const;

export const WM_DISPATCH_STATUSES = [
  "not_applicable",
  "pending",
  "processing",
  "dispatched",
  "blocked",
  "failed",
] as const;

export const WM_PLATFORM_NAMES = ["meta", "google_ads", "ga4", "internal"] as const;

export const WM_IDENTITY_QUALITIES = ["unknown", "weak", "medium", "strong"] as const;

export const WM_TRUST_WEIGHTS = {
  ocrConfidence: 0.18,
  completeness: 0.16,
  mathConsistency: 0.18,
  cohortFit: 0.12,
  scopeConsistency: 0.12,
  documentValidity: 0.16,
  identityStrength: 0.08,
} as const;

export const WM_TRUST_THRESHOLDS = {
  safe: 0.78,
  review: 0.58,
  quarantine: 0.38,
} as const;
