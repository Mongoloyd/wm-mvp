/**
 * revealPhase — Canonical access-state model for the scanner/OTP/report path.
 *
 * One discriminated union governs ALL render decisions on the canonical
 * reveal path. No component should independently infer access state —
 * derive it from this model.
 *
 * The orchestrator (PostScanReportSwitcher) derives a RevealPhase once
 * per render and passes the appropriate props downstream.
 */

import type { GateMode } from "@/components/LockedOverlay";

// ── Canonical phase union ────────────────────────────────────────────────────

export type RevealPhase =
  | { phase: "locked"; gateMode: GateMode }
  | { phase: "full_loading" }
  | { phase: "full_stalled" }
  | { phase: "full_ready" };

// ── Inputs required to derive the phase ──────────────────────────────────────

export interface RevealPhaseInputs {
  /** True when gated full data has been loaded */
  isFullLoaded: boolean;
  /** True when full data fetch is in-flight */
  isLoadingFull: boolean;
  /** Error from fetchFull (null if none) */
  fullFetchError: string | null;
  /** Funnel-level phone status (from ScanFunnelContext) */
  funnelPhoneStatus: string | undefined;
  /** Funnel-level phone E.164 (from ScanFunnelContext) */
  funnelPhoneE164: string | null | undefined;
  /** Local gate override (e.g. after phone submit transitions to enter_code) */
  localGateOverride: GateMode | null;
  /** True when the stall timer has fired (verified but full not loaded after timeout) */
  fetchStallTimerFired: boolean;
}
