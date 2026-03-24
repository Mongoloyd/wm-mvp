/**
 * PostScanReportSwitcher — In-page post-scan report orchestrator.
 *
 * CANONICAL: Always renders TruthReportClassic (findings-first removed).
 * Owns the real Twilio OTP pipeline for the in-page scan flow.
 *
 * Just-in-Time OTP Architecture:
 *   1. Phone is NOT collected in TruthGateFlow (lead has phone_e164 = null).
 *   2. LockedOverlay renders as "enter_phone" (primary path).
 *   3. User enters phone → submitPhone() → send-otp → transitions to "enter_code".
 *   4. User enters OTP → submitOtp() → verify-otp → vault opens.
 *   5. onVerified(phoneE164) fires → parent calls fetchFull().
 *
 * scan_session_id is threaded through usePhonePipeline → verify-otp
 * so the backend can bind phone_verifications.lead_id via scan_sessions.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useReportAccess } from "@/hooks/useReportAccess";
import { useScanFunnelSafe } from "@/state/scanFunnel";
import { usePhonePipeline } from "@/hooks/usePhonePipeline";
import TruthReportClassic from "../TruthReportClassic";
import type { GateMode, LockedOverlayProps } from "@/components/LockedOverlay";
import type { AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";

type Props = {
  grade: string;
  flags: AnalysisFlag[];
  pillarScores: PillarScore[];
  contractorName: string | null;
  county: string;
  confidenceScore: number | null;
  documentType: string | null;
  qualityBand?: "good" | "fair" | "poor" | null;
  hasWarranty?: boolean | null;
  hasPermits?: boolean | null;
  pageCount?: number | null;
  lineItemCount?: number | null;
  flagCount?: number;
  flagRedCount?: number;
  flagAmberCount?: number;
  onContractorMatchClick: () => void;
  onSecondScan: () => void;
  scanSessionId?: string | null;
  /** Called after real OTP verification succeeds. Parent should call fetchFull(). */
  onVerified?: (phoneE164: string) => void;
  /** True when gated full data has been loaded */
  isFullLoaded?: boolean;
};

/**
 * Derive gate mode from funnel state.
 * Just-in-Time: primary path is "enter_phone" (no phone captured upstream).
 * Legacy compat: if phone was already captured (e.g. localStorage from old session),
 * skip to "send_code" or "enter_code".
 */
function deriveGateMode(
  funnelPhoneStatus: string | undefined,
  funnelPhoneE164: string | null | undefined,
  localGateOverride: GateMode | null
): GateMode {
  // If we've explicitly set a local override (e.g. after send succeeds), use it
  if (localGateOverride) return localGateOverride;
  // Legacy: phone already known from a previous session
  if (funnelPhoneStatus === "otp_sent" || funnelPhoneStatus === "verified") return "enter_code";
  if (funnelPhoneE164) return "send_code";
  // Primary path: no phone yet
  return "enter_phone";
}

/** Mask phone for display: (***) ***-1234 */
function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return `(***) ***-${last4}`;
}

export function PostScanReportSwitcher(props: Props) {
  const accessLevel = useReportAccess({ isFullLoaded: props.isFullLoaded });
  const funnel = useScanFunnelSafe();
  const [otpValue, setOtpValue] = useState("");
  const [isSendInFlight, setIsSendInFlight] = useState(false);
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [localGateOverride, setLocalGateOverride] = useState<GateMode | null>(null);
  const [capturedPhone, setCapturedPhone] = useState<string | null>(null);
  const [fetchStalled, setFetchStalled] = useState(false);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pipeline = usePhonePipeline("validate_and_send_otp", {
    scanSessionId: props.scanSessionId,
    externalPhoneE164: funnel?.phoneE164 ?? null,
    onVerified: () => {
      funnel?.setPhoneStatus("verified");
      const phone = capturedPhone || funnel?.phoneE164 || pipeline.e164;
      if (phone) props.onVerified?.(phone);
    },
  });

  // ── Stall detection: if verified but full report not loaded after 5s ──
  useEffect(() => {
    if (pipeline.phoneStatus === "verified" && !props.isFullLoaded) {
      stallTimerRef.current = setTimeout(() => setFetchStalled(true), 5000);
      return () => { if (stallTimerRef.current) clearTimeout(stallTimerRef.current); };
    }
    if (props.isFullLoaded && fetchStalled) setFetchStalled(false);
    if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
  }, [pipeline.phoneStatus, props.isFullLoaded, fetchStalled]);

  const handleRetryFetchFull = useCallback(() => {
    const phone = capturedPhone || funnel?.phoneE164 || pipeline.e164;
    if (phone) {
      setFetchStalled(false);
      props.onVerified?.(phone);
    }
  }, [capturedPhone, funnel?.phoneE164, pipeline.e164, props]);

  const gateMode = deriveGateMode(funnel?.phoneStatus, funnel?.phoneE164, localGateOverride);

  const handleOtpSubmit = useCallback(async () => {
    if (otpValue.length < 6) return;
    await pipeline.submitOtp(otpValue);
  }, [otpValue, pipeline]);

  // Legacy: phone already known, just send code
  const handleSendCode = useCallback(async () => {
    if (!funnel?.phoneE164 || isSendInFlight) return;
    setIsSendInFlight(true);
    try {
      const result = await pipeline.submitPhone();
      if (result.status === "otp_sent") {
        funnel.setPhoneStatus("otp_sent");
        setCapturedPhone(funnel.phoneE164);
        setLocalGateOverride("enter_code");
      }
    } finally {
      setIsSendInFlight(false);
    }
  }, [funnel, pipeline, isSendInFlight]);

  // Primary path: phone entered in LockedOverlay → send OTP
  const handlePhoneSubmit = useCallback(async () => {
    if (isSendInFlight) return;
    setIsSendInFlight(true);
    try {
      const result = await pipeline.submitPhone();
      if (result.status === "otp_sent" && result.e164) {
        // Persist phone to funnel context + localStorage
        funnel?.setPhone(result.e164, "otp_sent");
        setCapturedPhone(result.e164);
        // Transition to OTP entry
        setLocalGateOverride("enter_code");
      }
    } finally {
      setIsSendInFlight(false);
    }
  }, [pipeline, funnel, isSendInFlight]);

  // "Wrong number?" — go back to phone entry
  const handleChangePhone = useCallback(() => {
    pipeline.reset();
    setOtpValue("");
    setCapturedPhone(null);
    setLocalGateOverride("enter_phone");
    funnel?.setPhone("", "none");
  }, [pipeline, funnel]);

  const handleResend = useCallback(async () => { await pipeline.resend(); }, [pipeline]);

  const maskedPhone = capturedPhone ? maskPhone(capturedPhone) : funnel?.phoneE164 ? maskPhone(funnel.phoneE164) : undefined;

  const gateProps: Omit<LockedOverlayProps, "grade" | "flagCount"> = {
    gateMode,
    otpValue,
    onOtpChange: setOtpValue,
    onOtpSubmit: handleOtpSubmit,
    onSendCode: handleSendCode,
    phoneDisplayValue: pipeline.displayValue,
    phoneIsValid: pipeline.inputComplete,
    phoneDigitCount: pipeline.rawDigits.length,
    onPhoneChange: pipeline.handlePhoneChange,
    onPhoneSubmit: handlePhoneSubmit,
    tcpaConsent,
    onTcpaChange: setTcpaConsent,
    maskedPhone,
    onChangePhone: handleChangePhone,
    flagRedCount: props.flagRedCount,
    isLoading:
      isSendInFlight ||
      pipeline.phoneStatus === "sending_otp" ||
      pipeline.phoneStatus === "verifying",
    errorMsg: pipeline.errorMsg,
    errorType: pipeline.errorType ?? undefined,
    resendCooldown: pipeline.resendCooldown,
    onResend: handleResend,
    fetchStalled,
    onRetryFetchFull: handleRetryFetchFull,
  };

  return (
    <TruthReportClassic
      {...props}
      accessLevel={accessLevel}
      gateProps={accessLevel === "preview" ? gateProps : undefined}
    />
  );
}
