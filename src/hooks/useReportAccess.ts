/**
 * Report access level hook.
 *
 * SECURITY: The primary gate is the backend RPC (get_analysis_full).
 * This hook is a UX convenience — it tells the UI whether to render
 * preview or full mode based on whether gated data has been fetched.
 *
 * Returns "full" ONLY when isFullLoaded is true, meaning the backend
 * has confirmed verification and released the data.
 */

export type ReportAccessLevel = "preview" | "full";

interface UseReportAccessOptions {
  /** True when get_analysis_full has successfully returned data */
  isFullLoaded?: boolean;
  /** Force a specific level (for dev fixtures / testing only) */
  forceLevel?: ReportAccessLevel;
}

export function useReportAccess(
  options: UseReportAccessOptions = {}
): ReportAccessLevel {
  const { isFullLoaded = false, forceLevel } = options;

  // Explicit override (dev/testing)
  if (forceLevel) return forceLevel;

  // The real gate: full data has been fetched from the backend
  if (isFullLoaded) return "full";

  return "preview";
}
