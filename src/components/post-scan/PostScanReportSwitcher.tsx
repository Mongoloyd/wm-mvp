/**
 * PostScanReportSwitcher — In-page post-scan report orchestrator.
 *
 * CANONICAL: Always renders TruthReportClassic (findings-first removed).
 * Owns the real Twilio OTP pipeline for the in-page scan flow.
 * Owns CTA logic: generate-contractor-brief + voice-followup edge functions.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useReportAccess } from "@/hooks/useReportAccess";
import { trackEvent } from "@/lib/trackEvent";
import { useScanFunnelSafe } from "@/state/scanFunnel";
import { usePhonePipeline } from "@/hooks/usePhonePipeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TruthReportClassic from "../TruthReportClassic";
import type { SuggestedMatch } from "../TruthReportClassic";
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
  priceFairness?: string | null;
  markupEstimate?: string | null;
  negotiationLeverage?: string | null;
  onSecondScan: () => void;
  scanSessionId?: string | null;
  /** Called after real OTP verification succeeds. Parent should call fetchFull(). */
  onVerified?: (phoneE164: string) => void;
  /** True when gated full data has been loaded */
  isFullLoaded?: boolean;
  /** Error message from fetchFull — surfaces immediately instead of waiting for stall timer */
  fullFetchError?: string | null;
};

function deriveGateMode(
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
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // ── CTA state ──
  const [introRequested, setIntroRequested] = useState(false);
  const [reportCallRequested, setReportCallRequested] = useState(false);
  const [isCtaLoading, setIsCtaLoading] = useState(false);
  const [suggestedMatch, setSuggestedMatch] = useState<SuggestedMatch | null>(null);

  // ── compare-quotes state ──
  const [availableComparisons, setAvailableComparisons] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<Record<string, unknown> | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // ── Hydrate CTA state from DB on mount (prevents duplicates after refresh) ──
  useEffect(() => {
    if (!props.scanSessionId || !props.isFullLoaded) return;
    let cancelled = false;
    supabase
      .from("contractor_opportunities")
      .select("id, status, suggested_match_snapshot")
      .eq("scan_session_id", props.scanSessionId)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setIntroRequested(true);
        if (data.suggested_match_snapshot) {
          setSuggestedMatch(data.suggested_match_snapshot as unknown as SuggestedMatch);
        }
      });
    return () => { cancelled = true; };
  }, [props.scanSessionId, props.isFullLoaded]);

  // ── Hydrate phone from leads table on mount (handles page refresh) ──
  // If the user provided their phone in TruthGateFlow, it's in leads.phone_e164.
  // On fresh page load the funnel context is empty, so we read it back from DB
  // and inject it into the funnel. This makes the OTP gate skip to "send_code"
  // with the phone pre-filled instead of asking the user to type it again.
  useEffect(() => {
    if (!props.scanSessionId || funnel?.phoneE164) return;
    let cancelled = false;

    (async () => {
      try {
        const { data: session } = await supabase
          .from("scan_sessions")
          .select("lead_id")
          .eq("id", props.scanSessionId)
          .maybeSingle();

        if (cancelled || !session?.lead_id) return;

        const { data: lead } = await supabase
          .from("leads")
          .select("phone_e164")
          .eq("id", session.lead_id)
          .maybeSingle();

        if (cancelled || !lead?.phone_e164 || !funnel) return;

        funnel.setPhone(lead.phone_e164, "none");
      } catch (err) {
        console.warn("[PostScanReportSwitcher] phone hydration failed:", err);
      }
    })();

    return () => { cancelled = true; };
  }, [props.scanSessionId, funnel?.phoneE164]);

  const pipeline = usePhonePipeline("validate_and_send_otp", {
    scanSessionId: props.scanSessionId,
    externalPhoneE164: funnel?.phoneE164 ?? null,
    onVerified: () => {
      funnel?.setPhoneStatus("verified");
      // DO NOT call props.onVerified here — phone is not yet available.
      // The canonical phone handoff happens in handleOtpSubmit after
      // submitOtp returns result.e164.
    },
  });
// ── Send report email on first preview load (fire-and-forget) ──
useEffect(() => {
  if (!props.scanSessionId || !props.grade) return;
  // Non-blocking: send email in background
  supabase.functions
    .invoke("send-report-email", {
      body: {
        scan_session_id: props.scanSessionId,
        email_type: "preview",
      },
    })
    .then(({ data, error }) => {
      if (error) console.warn("[PostScanReportSwitcher] report email failed:", error);
      else if (data?.success) console.log("[PostScanReportSwitcher] report email sent");
      else if (data?.skipped) console.log("[PostScanReportSwitcher] email skipped:", data.reason);
    });
}, [props.scanSessionId, props.grade]);
  // Resolve phone for CTA calls
  const phoneE164 = capturedPhone || funnel?.phoneE164 || pipeline.e164 || null;

  // ── Stall detection ──
  useEffect(() => {
    // If fetchFull already failed, surface error immediately — no need to wait 5s
    if (props.fullFetchError && !props.isFullLoaded) {
      setFetchStalled(true);
      return;
    }
    if (funnel?.phoneStatus === "verified" && !props.isFullLoaded) {
      stallTimerRef.current = setTimeout(() => setFetchStalled(true), 5000);
      return () => { if (stallTimerRef.current) clearTimeout(stallTimerRef.current); };
    }
    if (props.isFullLoaded && fetchStalled) setFetchStalled(false);
    if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
  }, [funnel?.phoneStatus, props.isFullLoaded, props.fullFetchError, fetchStalled]);

  const handleRetryFetchFull = useCallback(() => {
    const phone = capturedPhone || funnel?.phoneE164 || pipeline.e164;
    if (!phone) {
      toast.error("Unable to retry. Please resend your verification code.");
      return;
    }
    if (!props.onVerified) {
      toast.error("Unable to retry. Please refresh the page and try again.");
      return;
    }
    trackEvent({ event_name: "fetch_stall_retry", session_id: props.scanSessionId, metadata: { phone_last4: phone.slice(-4) } });
    setFetchStalled(false);
    props.onVerified(phone);
    // Restart the stall timer so the retry button reappears if the fetch stalls again
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => setFetchStalled(true), 5000);
  }, [capturedPhone, funnel?.phoneE164, pipeline.e164, props]);

  const gateMode = deriveGateMode(funnel?.phoneStatus, funnel?.phoneE164, localGateOverride);

  const verifyLockRef = useRef(false);


  const handleOtpSubmit = useCallback(async () => {
    if (otpValue.length < 6 || verifyLockRef.current) return;
    verifyLockRef.current = true;
    setIsVerifyingOtp(true);
    try {
      const result = await pipeline.submitOtp(otpValue);
      if (result.status === "verified" && result.e164) {
        setCapturedPhone(result.e164);
        // Canonical phone handoff: use server-returned phone to trigger fetchFull
        props.onVerified?.(result.e164);
      }
    } finally {
      setIsVerifyingOtp(false);
      verifyLockRef.current = false;
    }
  }, [otpValue, pipeline, props]);

  const handleSendCode = useCallback(async () => {
    if (!funnel?.phoneE164 || isSendInFlight) return;
    funnel.setPhoneStatus("sending_otp");
    setIsSendInFlight(true);
    try {
      const result = await pipeline.submitPhone();
      if (result.status === "otp_sent") {
        funnel.setPhoneStatus("otp_sent");
        setCapturedPhone(funnel.phoneE164);
        setLocalGateOverride("enter_code");
      } else {
        funnel.setPhoneStatus("send_failed");
      }
    } catch {
      funnel.setPhoneStatus("send_failed");
    } finally {
      setIsSendInFlight(false);
    }
  }, [funnel, pipeline, isSendInFlight]);

  // Auto-send OTP when phone is pre-filled (e.g. hydrated from leads table)
  const autoSendFiredRef = useRef(false);
  useEffect(() => {
    if (autoSendFiredRef.current) return;
    if (gateMode === "send_code" && funnel?.phoneE164 && !isSendInFlight) {
      autoSendFiredRef.current = true;
      handleSendCode();
    }
  }, [gateMode, funnel?.phoneE164, isSendInFlight, handleSendCode]);

  const handlePhoneSubmit = useCallback(async () => {
    if (isSendInFlight) return;
    funnel?.setPhoneStatus("sending_otp");
    setIsSendInFlight(true);
    trackEvent({ event_name: "phone_submitted", session_id: props.scanSessionId, metadata: {} });
    try {
      const result = await pipeline.submitPhone();
      if (result.status === "otp_sent" && result.e164) {
        funnel?.setPhone(result.e164, "otp_sent");
        setCapturedPhone(result.e164);
        setLocalGateOverride("enter_code");
      } else {
        funnel?.setPhoneStatus("send_failed");
      }
    } catch {
      funnel?.setPhoneStatus("send_failed");
    } finally {
      setIsSendInFlight(false);
    }
  }, [pipeline, funnel, isSendInFlight, props.scanSessionId]);

  const handleChangePhone = useCallback(() => {
    pipeline.reset();
    setOtpValue("");
    setCapturedPhone(null);
    setLocalGateOverride("enter_phone");
    funnel?.setPhone("", "none");
  }, [pipeline, funnel]);

  const handleResend = useCallback(async () => {
    if (!funnel?.phoneE164) return;
    funnel.setPhoneStatus("sending_otp");
    const result = await pipeline.resend();
    if (result.status === "otp_sent") {
      funnel.setPhoneStatus("otp_sent");
      return;
    }
    if (result.status === "blocked") {
      // Keep OTP-ready state for cooldown UX; do not downgrade to send_failed.
      funnel.setPhoneStatus("otp_sent");
      return;
    }
    funnel.setPhoneStatus("send_failed");
  }, [pipeline, funnel]);

  // ── Detect 2+ completed analyses for this lead via SECURITY DEFINER RPC ──
  // Direct queries to scan_sessions and analyses are blocked for anon users (no
  // SELECT RLS policy). get_comparable_sessions() runs as SECURITY DEFINER and
  // returns the session IDs for completed analyses belonging to the same lead.
  useEffect(() => {
    if (!props.scanSessionId || !props.isFullLoaded) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await (supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>)(
        "get_comparable_sessions",
        { p_scan_session_id: props.scanSessionId }
      );

      if (cancelled || error || !data) return;
      const sessionIds = (data as unknown as { scan_session_id: string }[]).map((r) => r.scan_session_id);
      if (sessionIds.length >= 2) {
        setAvailableComparisons(sessionIds);
      }
    })();

    return () => { cancelled = true; };
  }, [props.scanSessionId, props.isFullLoaded]);

  // ── CTA C: Compare My Quotes ──
  const handleCompareQuotes = useCallback(async () => {
    if (availableComparisons.length < 2 || !phoneE164) return;
    setComparisonLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("compare-quotes", {
        body: {
          scan_session_ids: availableComparisons,
          phone_e164: phoneE164,
        },
      });
      if (error || !data?.success) {
        console.error("[compare-quotes] failed:", error || data);
        toast.error("Comparison failed. Please try again.");
      } else {
        setComparisonResult(data.comparison);
      }
    } catch (err) {
      console.error("[compare-quotes] error:", err);
      toast.error("Connection error. Please try again.");
    } finally {
      setComparisonLoading(false);
    }
  }, [availableComparisons, phoneE164]);
  const handleContractorMatchClick = useCallback(async () => {
    if (!props.scanSessionId || !phoneE164) {
      toast.error("Unable to process request. Please verify your phone number first.");
      return;
    }
    setIsCtaLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-contractor-brief", {
        body: { scan_session_id: props.scanSessionId, phone_e164: phoneE164, cta_source: "intro_request" },
      });
      if (fnError || !data?.success) {
        console.error("[PostScanReportSwitcher] brief generation failed", fnError || data);
        toast.error("Something went wrong. Please try again.");
        setIsCtaLoading(false);
        return;
      }
      if (data.suggested_match) {
        setSuggestedMatch(data.suggested_match);
      }
      // Fire voice followup
      supabase.functions.invoke("voice-followup", {
        body: {
          scan_session_id: props.scanSessionId,
          phone_e164: phoneE164,
          call_intent: "contractor_intro",
          cta_source: "intro_request",
          opportunity_id: data.opportunity_id,
        },
      }).catch(err => console.warn("[PostScanReportSwitcher] voice followup failed", err));
      setIntroRequested(true);
    } catch (err) {
      console.error("[PostScanReportSwitcher] unexpected error", err);
      toast.error("Connection error. Please try again.");
    } finally {
      setIsCtaLoading(false);
    }
  }, [props.scanSessionId, phoneE164]);

  // ── CTA B: Call WindowMan About My Report ──
  const handleReportHelpCall = useCallback(async () => {
    if (!props.scanSessionId || !phoneE164) {
      toast.error("Unable to process request. Please verify your phone number first.");
      return;
    }
    setIsCtaLoading(true);
    try {
      await supabase.functions.invoke("voice-followup", {
        body: {
          scan_session_id: props.scanSessionId,
          phone_e164: phoneE164,
          call_intent: "report_explainer",
          cta_source: "report_help",
        },
      });
      setReportCallRequested(true);
    } catch (err) {
      console.error("[PostScanReportSwitcher] report help call failed", err);
      toast.error("Connection error. Please try again.");
    } finally {
      setIsCtaLoading(false);
    }
  }, [props.scanSessionId, phoneE164]);

  const maskedPhone = capturedPhone ? maskPhone(capturedPhone) : funnel?.phoneE164 ? maskPhone(funnel.phoneE164) : undefined;
  const sharedSendFailed = funnel?.phoneStatus === "send_failed";
  const effectiveErrorMsg =
    pipeline.errorMsg || (sharedSendFailed ? "Send or confirm your number to receive a code." : "");

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
      funnel?.phoneStatus === "sending_otp" ||
      isVerifyingOtp,
    errorMsg: effectiveErrorMsg,
    errorType: pipeline.errorType ?? (sharedSendFailed ? "generic" : undefined),
    resendCooldown: pipeline.resendCooldown,
    onResend: handleResend,
    fetchStalled,
    onRetryFetchFull: handleRetryFetchFull,
  };

  return (
    <>
      <TruthReportClassic
        {...props}
        accessLevel={accessLevel}
        gateProps={accessLevel === "preview" ? gateProps : undefined}
        onContractorMatchClick={handleContractorMatchClick}
        onReportHelpCall={handleReportHelpCall}
        introRequested={introRequested}
        reportCallRequested={reportCallRequested}
        isCtaLoading={isCtaLoading}
        suggestedMatch={suggestedMatch}
      />
      {availableComparisons.length >= 2 && !comparisonResult && (
        <div className="px-4 pb-6 pt-2">
          <button
            onClick={handleCompareQuotes}
            disabled={comparisonLoading}
            className="btn-depth-primary w-full"
            style={{ height: 54, fontSize: 16 }}
          >
            {comparisonLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Comparing Quotes...
              </span>
            ) : (
              `Compare My ${availableComparisons.length} Quotes Side-by-Side →`
            )}
          </button>
        </div>
      )}
      {comparisonResult && (
        <div className="glass-card-strong mx-4 mb-6 p-4 rounded-xl">
          <p className="text-sm font-semibold text-white mb-1">Quote Comparison Ready</p>
          <p className="text-xs text-white/60">
            {typeof comparisonResult.summary === "string"
              ? comparisonResult.summary
              : "Your quotes have been compared. Contact your advisor for details."}
          </p>
        </div>
      )}
    </>
  );
}
