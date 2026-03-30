/**
 * PostScanReportSwitcher — In-page post-scan report orchestrator.
 *
 * CANONICAL: Always renders TruthReportClassic (findings-first removed).
 * Owns the real Twilio OTP pipeline for the in-page scan flow.
 * Owns CTA logic: generate-contractor-brief + voice-followup edge functions.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
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
  onSecondScan: () => void;
  scanSessionId?: string | null;
  /** Called after real OTP verification succeeds. Parent should call fetchFull(). */
  onVerified?: (phoneE164: string) => void;
  /** True when gated full data has been loaded */
  isFullLoaded?: boolean;
};

function deriveGateMode(
  funnelPhoneStatus: string | undefined,
  funnelPhoneE164: string | null | undefined,
  localGateOverride: GateMode | null
): GateMode {
  if (localGateOverride) return localGateOverride;
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

  // ── CTA state ──
  const [introRequested, setIntroRequested] = useState(false);
  const [reportCallRequested, setReportCallRequested] = useState(false);
  const [isCtaLoading, setIsCtaLoading] = useState(false);
  const [suggestedMatch, setSuggestedMatch] = useState<SuggestedMatch | null>(null);

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
      const phone = capturedPhone || funnel?.phoneE164 || pipeline.e164;
      if (phone) props.onVerified?.(phone);
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
      trackEvent({ event_name: "fetch_stall_retry", session_id: props.scanSessionId, metadata: { phone_last4: phone.slice(-4) } });
      setFetchStalled(false);
      props.onVerified?.(phone);
    }
  }, [capturedPhone, funnel?.phoneE164, pipeline.e164, props]);

  const gateMode = deriveGateMode(funnel?.phoneStatus, funnel?.phoneE164, localGateOverride);

  const handleOtpSubmit = useCallback(async () => {
    if (otpValue.length < 6) return;
    const result = await pipeline.submitOtp(otpValue);
    if (result.status === "verified" && result.e164) {
      setCapturedPhone(result.e164);
    }
  }, [otpValue, pipeline]);

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

  const handlePhoneSubmit = useCallback(async () => {
    if (isSendInFlight) return;
    setIsSendInFlight(true);
    trackEvent({ event_name: "phone_submitted", session_id: props.scanSessionId, metadata: {} });
    try {
      const result = await pipeline.submitPhone();
      if (result.status === "otp_sent" && result.e164) {
        funnel?.setPhone(result.e164, "otp_sent");
        setCapturedPhone(result.e164);
        setLocalGateOverride("enter_code");
      }
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

  const handleResend = useCallback(async () => { await pipeline.resend(); }, [pipeline]);

  // ── CTA A: Get Counter-Quote ──
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
      onContractorMatchClick={handleContractorMatchClick}
      onReportHelpCall={handleReportHelpCall}
      introRequested={introRequested}
      reportCallRequested={reportCallRequested}
      isCtaLoading={isCtaLoading}
      suggestedMatch={suggestedMatch}
    />
  );
}
