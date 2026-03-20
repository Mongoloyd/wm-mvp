/**
 * Report access level hook.
 * Determines whether the user sees the teaser (preview) or full Truth Report.
 *
 * Reads verification state from ScanFunnelContext when available,
 * falls back to options for standalone usage.
 *
 * In dev mode: bypass forces "full" access for UI design iteration.
 *
 * SECURITY: This hook controls UI rendering only.
 * The backend MUST independently gate full_json behind verification.
 * This is a cosmetic toggle — not a security boundary.
 */

import { useScanFunnelSafe } from "@/state/ScanFunnelContext";

export type ReportAccessLevel = "preview" | "full";

const DEV_REPORT_BYPASS = import.meta.env.DEV;

interface UseReportAccessOptions {
  /** Will be true once we wire phone_verified_at check */
  isPhoneVerified?: boolean;
  /** Force a specific level (for testing) */
  forceLevel?: ReportAccessLevel;
}

export function useReportAccess(
  options: UseReportAccessOptions = {}
): ReportAccessLevel {
  const { isPhoneVerified = false, forceLevel } = options;

  // Explicit override takes priority
  if (forceLevel) return forceLevel;

  // Dev bypass: always show full report for design iteration
  if (DEV_REPORT_BYPASS) return "full";

  // Check ScanFunnelContext if available
  const funnel = useScanFunnelSafe();
  if (funnel?.phoneStatus === "verified") return "full";

  // Fallback: gate on verification state from options
  return isPhoneVerified ? "full" : "preview";
}
