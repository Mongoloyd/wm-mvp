export const WM_EVENT_NAMES = [
  "lead_identified",
  "quote_upload_completed",
  "quote_validation_passed",
  "otp_verified",
  "report_revealed",
  "appointment_booked",
  "sale_confirmed",
] as const;

export const WM_ANOMALY_STATUSES = ["safe", "review", "quarantine", "reject"] as const;
export const WM_DISPATCH_STATUSES = ["pending", "processing", "sent", "suppressed", "failed", "dead_letter"] as const;
export const WM_PLATFORM_NAMES = ["meta", "google"] as const;
export const WM_IDENTITY_QUALITIES = ["none", "weak", "medium", "strong"] as const;

export const CANONICAL_SCHEMA_VERSION = "1.0.0";
export const CANONICAL_MODEL_VERSION = "2026-04-14";

export const TRUST_THRESHOLDS = {
  metaMinimum: 0.65,
  googleMinimum: 0.6,
} as const;

export const RETRY_DELAYS_MS = [0, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000] as const;
