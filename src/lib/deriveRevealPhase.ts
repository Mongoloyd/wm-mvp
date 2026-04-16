/**
 * deriveRevealPhase — Pure function that produces the canonical RevealPhase.
 *
 * This is the SINGLE source of truth for which render state the
 * canonical reveal path should display. No component should make
 * independent access-state decisions — all decisions flow from
 * the phase returned here.
 *
 * Priority order (first match wins):
 *   1. full_ready  — full data loaded, show full report
 *   2. full_stalled — verified but full fetch stalled or errored
 *   3. full_loading — verified, full fetch in progress
 *   4. locked      — preview available, gate shown
 */

import type { GateMode } from "@/components/LockedOverlay";
import type { RevealPhase, RevealPhaseInputs } from "@/types/revealPhase";

export function deriveRevealPhase(inputs: RevealPhaseInputs): RevealPhase {
  const {
    isFullLoaded,
    isLoadingFull,
    fullFetchError,
    funnelPhoneStatus,
    funnelPhoneE164,
    localGateOverride,
    fetchStallTimerFired,
  } = inputs;

  // ── 1. Full report ready ────────────────────────────────────────────────
  if (isFullLoaded) {
    return { phase: "full_ready" };
  }

  // ── 2. Verified but full fetch stalled / errored ────────────────────────
  // fullFetchError is set when the RPC returned an error after OTP success.
  // fetchStallTimerFired is set when the 5s timer fires (verified but no data).
  if (fullFetchError || fetchStallTimerFired) {
    return { phase: "full_stalled" };
  }

  // ── 3. Full fetch in progress ──────────────────────────────────────────
  if (isLoadingFull) {
    return { phase: "full_loading" };
  }

  // ── 4. Locked — preview shown, gate visible ────────────────────────────
  // Derive gateMode from funnel state, identical to prior deriveGateMode logic.
  const gateMode = resolveGateMode(funnelPhoneStatus, funnelPhoneE164, localGateOverride);
  return { phase: "locked", gateMode };
}

/**
 * Resolve the gate mode within the locked phase.
 * Extracted from PostScanReportSwitcher's prior inline deriveGateMode.
 * Logic is preserved exactly.
 */
function resolveGateMode(
  funnelPhoneStatus: string | undefined,
  funnelPhoneE164: string | null | undefined,
  localGateOverride: GateMode | null
): GateMode {
  if (localGateOverride) return localGateOverride;
  if (funnelPhoneStatus === "sending_otp") return "send_code";
  if (funnelPhoneStatus === "otp_sent" || funnelPhoneStatus === "verified") return "enter_code";
  if (funnelPhoneE164) return "send_code";
  return "enter_phone";
}

// ── Convenience helpers for downstream consumers ──────────────────────────

/** Derive the accessLevel prop for TruthReportClassic from a RevealPhase. */
export function phaseToAccessLevel(phase: RevealPhase): "preview" | "full" {
  return phase.phase === "full_ready" ? "full" : "preview";
}

/** True when the phase implies the gate overlay should be shown. */
export function phaseShowsGate(phase: RevealPhase): boolean {
  return phase.phase === "locked" || phase.phase === "full_stalled";
}
