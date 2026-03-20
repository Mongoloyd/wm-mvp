/**
 * ScanFunnelContext — Funnel-scoped state for the quote-upload flow.
 *
 * Tracks phone, OTP, lead, session, and scan state so that
 * downstream components (ScanTheatrics, VerifyGate, TruthReportFindings)
 * can branch correctly without prop-threading.
 *
 * Wrap the quote-upload funnel subtree with <ScanFunnelProvider>.
 * This is NOT a global store — it resets on unmount.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

/* ── Types ─────────────────────────────────────────────── */

export type PhoneFunnelStatus =
  | "none"          // no phone entered yet
  | "validated"     // passed screenPhone, mode was validate_only
  | "otp_sent"      // OTP dispatched, waiting for code
  | "otp_failed"    // OTP send failed, needs retry
  | "verified";     // OTP verified successfully

export interface ScanFunnelState {
  /** Normalized E.164 phone, null until validated */
  phoneE164: string | null;
  /** Current phone verification status in the funnel */
  phoneStatus: PhoneFunnelStatus;
  /** Lead ID from leads table */
  leadId: string | null;
  /** Browser session ID (localStorage-based) */
  sessionId: string | null;
  /** scan_sessions.id for the current upload */
  scanSessionId: string | null;
  /** quote_files.id for the current upload */
  quoteFileId: string | null;
}

export interface ScanFunnelActions {
  /** Set phone after validation/screening */
  setPhone: (e164: string, status: PhoneFunnelStatus) => void;
  /** Update just the phone status (e.g. otp_sent → verified) */
  setPhoneStatus: (status: PhoneFunnelStatus) => void;
  /** Set lead ID */
  setLeadId: (id: string) => void;
  /** Set session ID */
  setSessionId: (id: string) => void;
  /** Set scan session ID */
  setScanSessionId: (id: string) => void;
  /** Set quote file ID */
  setQuoteFileId: (id: string) => void;
  /** Reset all funnel state */
  resetFunnel: () => void;
}

type ScanFunnelContextValue = ScanFunnelState & ScanFunnelActions;

/* ── Defaults ──────────────────────────────────────────── */

const DEFAULT_STATE: ScanFunnelState = {
  phoneE164: null,
  phoneStatus: "none",
  leadId: null,
  sessionId: null,
  scanSessionId: null,
  quoteFileId: null,
};

/* ── Context ───────────────────────────────────────────── */

const ScanFunnelContext = createContext<ScanFunnelContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────── */

export function ScanFunnelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ScanFunnelState>(DEFAULT_STATE);

  const setPhone = useCallback((e164: string, status: PhoneFunnelStatus) => {
    setState((s) => ({ ...s, phoneE164: e164, phoneStatus: status }));
  }, []);

  const setPhoneStatus = useCallback((status: PhoneFunnelStatus) => {
    setState((s) => ({ ...s, phoneStatus: status }));
  }, []);

  const setLeadId = useCallback((id: string) => {
    setState((s) => ({ ...s, leadId: id }));
  }, []);

  const setSessionId = useCallback((id: string) => {
    setState((s) => ({ ...s, sessionId: id }));
  }, []);

  const setScanSessionId = useCallback((id: string) => {
    setState((s) => ({ ...s, scanSessionId: id }));
  }, []);

  const setQuoteFileId = useCallback((id: string) => {
    setState((s) => ({ ...s, quoteFileId: id }));
  }, []);

  const resetFunnel = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value = useMemo<ScanFunnelContextValue>(
    () => ({
      ...state,
      setPhone,
      setPhoneStatus,
      setLeadId,
      setSessionId,
      setScanSessionId,
      setQuoteFileId,
      resetFunnel,
    }),
    [state, setPhone, setPhoneStatus, setLeadId, setSessionId, setScanSessionId, setQuoteFileId, resetFunnel]
  );

  return (
    <ScanFunnelContext.Provider value={value}>
      {children}
    </ScanFunnelContext.Provider>
  );
}

/* ── Hooks ─────────────────────────────────────────────── */

export function useScanFunnel(): ScanFunnelContextValue {
  const ctx = useContext(ScanFunnelContext);
  if (!ctx) {
    throw new Error("useScanFunnel must be used within a <ScanFunnelProvider>");
  }
  return ctx;
}

/** Safe version — returns null when outside provider (for shared hooks like useReportAccess) */
export function useScanFunnelSafe(): ScanFunnelContextValue | null {
  return useContext(ScanFunnelContext);
}
