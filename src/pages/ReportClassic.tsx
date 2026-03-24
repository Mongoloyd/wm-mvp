/**
 * ReportClassic — Smart Container for the Classic Truth Report route.
 * Route: /report/classic/:sessionId
 *
 * This mirrors Report.tsx (V2) but renders the Classic UI via TruthReportClassic.
 * It is the ONLY layer that touches Twilio / usePhonePipeline for the Classic flow.
 * TruthReportClassic and LockedOverlay remain pure UI — zero Twilio knowledge.
 *
 * Data source: useAnalysisData (existing hook, fetches via get_analysis_preview RPC)
 * County:      fetched from leads table via scan_sessions.lead_id join
 * Gate:        LockedOverlay props built from usePhonePipeline + funnel context
 *
 * STRICT UI CONSTRAINT: No visual changes to TruthReportClassic or LockedOverlay.
 * We only supply the correct props and callbacks.
 */

import { useState, useCallback, useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAnalysisData } from "@/hooks/useAnalysisData";
import { usePhonePipeline } from "@/hooks/usePhonePipeline";
import { useReportAccess } from "@/hooks/useReportAccess";
import { useScanFunnelSafe } from "@/state/scanFunnel";
import { supabase } from "@/integrations/supabase/client";
import TruthReportClassic from "@/components/TruthReportClassic";
import ContractorMatch from "@/components/ContractorMatch";
import type { GateMode, LockedOverlayProps } from "@/components/LockedOverlay";
import type { OtpVerifyOutcome } from "@/types/report-v2";

// ── ErrorBoundary for ContractorMatch ────────────────────────────────────────
class ContractorMatchErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ContractorMatch] render error caught by boundary:", error, info);
  }
  render() {
    if (this.state.hasError) return null; // Silent fail — report stays intact
    return this.props.children;
  }
}


// ── PipelineVerifyResult → OtpVerifyOutcome mapping ──────────────────────────
const PIPELINE_TO_OUTCOME: Record<string, OtpVerifyOutcome> = {
  verified: "verified",
  invalid_code: "invalid",
  expired: "expired",
  error: "error",
};

// ── GateMode derivation (same logic as PostScanReportSwitcher) ───────────────
function deriveGateMode(
  funnelPhoneStatus: string | undefined,
  funnelPhoneE164: string | null | undefined
): GateMode {
  if (funnelPhoneStatus === "otp_sent" || funnelPhoneStatus === "verified") {
    return "enter_code";
  }
  if (funnelPhoneE164) {
    return "send_code";
  }
  return "enter_phone";
}

// ── County fetcher (scan_sessions → leads.county) ────────────────────────────
function useCountyForSession(sessionId: string | undefined): string {
  const [county, setCounty] = useState("Your County");

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function fetchCounty() {
      try {
        // Step 1: get lead_id from scan_sessions
        const { data: session } = await supabase
          .from("scan_sessions")
          .select("lead_id")
          .eq("id", sessionId)
          .single();

        if (cancelled || !session?.lead_id) return;

        // Step 2: get county from leads
        const { data: lead } = await supabase
          .from("leads")
          .select("county")
          .eq("id", session.lead_id)
          .single();

        if (cancelled || !lead?.county) return;
        setCounty(lead.county);
      } catch {
        // Silently fall back to default
      }
    }

    fetchCounty();
    return () => { cancelled = true; };
  }, [sessionId]);

  return county;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReportClassic() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // ── Funnel context (safe — null when outside provider) ─────────────────
  const funnel = useScanFunnelSafe();

  // ── Data loading ───────────────────────────────────────────────────────
  const { data: analysisData, isLoading, error, fetchFull, isLoadingFull, isFullLoaded } = useAnalysisData(
    sessionId ?? null,
    !!sessionId
  );

  // ── County resolution ──────────────────────────────────────────────────
  const county = useCountyForSession(sessionId);

  // ── Access level (preview vs full) ─────────────────────────────────────
  const accessLevel = useReportAccess({ isFullLoaded });

  // ── Phone pipeline — the ONLY Twilio touchpoint ────────────────────────
  const pipeline = usePhonePipeline("validate_and_send_otp", {
    scanSessionId: sessionId ?? null,
    externalPhoneE164: funnel?.phoneE164 ?? null,
    onVerified: () => {
      funnel?.setPhoneStatus("verified");
      const phone = funnel?.phoneE164 || pipeline.e164;
      if (phone) fetchFull(phone);
    },
  });

  // If user already verified (returning visit), auto-fetch full data
  useEffect(() => {
    if (funnel?.phoneStatus === "verified" && !isFullLoaded && !isLoadingFull && funnel?.phoneE164) {
      fetchFull(funnel.phoneE164);
    }
  }, [funnel?.phoneStatus, funnel?.phoneE164, isFullLoaded, isLoadingFull, fetchFull]);

  // ── OTP value state (lives here in the smart container) ────────────────
  const [otpValue, setOtpValue] = useState("");

  // ── Contractor match visibility ────────────────────────────────────────
  const [contractorMatchVisible, setContractorMatchVisible] = useState(false);

  // ── Gate mode derived from funnel state ────────────────────────────────
  const gateMode = deriveGateMode(funnel?.phoneStatus, funnel?.phoneE164);

  // ── Gate callbacks ─────────────────────────────────────────────────────

  const handleOtpSubmit = useCallback(async () => {
    if (otpValue.length < 6) return;
    const result = await pipeline.submitOtp(otpValue);
    const outcome = PIPELINE_TO_OUTCOME[result.status] || "error";
    // On verified, accessLevel will flip to "full" via funnel.phoneStatus
    // On invalid/expired/error, LockedOverlay shows errorMsg from pipeline
    if (outcome === "verified") {
      setOtpValue("");
    }
  }, [otpValue, pipeline]);

  const handleSendCode = useCallback(async () => {
    if (!funnel?.phoneE164) return;
    const result = await pipeline.submitPhone();
    if (result.status === "otp_sent") {
      funnel.setPhoneStatus("otp_sent");
    }
  }, [funnel, pipeline]);

  const handlePhoneSubmit = useCallback(async () => {
    const result = await pipeline.submitPhone();
    if (result.status === "otp_sent" && result.e164) {
      funnel?.setPhone(result.e164, "otp_sent");
    }
  }, [pipeline, funnel]);

  const handleResend = useCallback(async () => {
    await pipeline.resend();
  }, [pipeline]);

  // ── CTA handlers ───────────────────────────────────────────────────────

  const handleContractorMatchClick = useCallback(() => {
    setContractorMatchVisible(true);
  }, []);

  const handleSecondScan = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, margin: "0 auto 16px",
            borderRadius: "50%",
            border: "2px solid rgba(200,149,42,0.3)",
            borderTopColor: "#C8952A",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9CA3AF" }}>
            Loading your report...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Terminal states (invalid document, failed, etc.) ─────────────────

  const TERMINAL_MESSAGES: Record<string, { title: string; body: string; cta: string }> = {
    invalid_document: {
      title: "Not a Window or Door Quote",
      body: "The document you uploaded doesn't appear to be an impact window or door contractor quote. Our scanner only analyzes quotes for impact-rated windows and doors.",
      cta: "Upload a Different Quote",
    },
    failed: {
      title: "Scan Failed",
      body: "Something went wrong while analyzing your document. This can happen with heavily formatted or image-heavy files.",
      cta: "Try Again",
    },
    error: {
      title: "Scan Error",
      body: "An unexpected error occurred during analysis. Please try uploading your quote again.",
      cta: "Try Again",
    },
    unreadable: {
      title: "Document Unreadable",
      body: "We couldn't extract enough information from this file. Try uploading a clearer photo or the original PDF.",
      cta: "Upload a Clearer Copy",
    },
  };

  const terminalStatus = analysisData?.analysisStatus;
  const terminalMsg = terminalStatus ? TERMINAL_MESSAGES[terminalStatus] : null;

  if (terminalMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-5">
          <div className="w-16 h-16 mx-auto mb-6 rounded-none border-2 border-destructive/40 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground uppercase tracking-wider mb-3">
            {terminalMsg.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            {terminalMsg.body}
          </p>
          <a
            href="/"
            className="inline-block bg-primary text-primary-foreground font-semibold text-sm px-8 py-3 rounded-none hover:bg-primary/90 transition-colors duration-150"
          >
            {terminalMsg.cta}
          </a>
        </div>
      </div>
    );
  }

  // ── Error / not-found state ────────────────────────────────────────────

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-5">
          <h1 className="font-heading text-xl font-bold text-foreground uppercase tracking-wider mb-2">
            Report Not Found
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "We couldn't find a report for this session."}
          </p>
          <a
            href="/"
            className="inline-block bg-muted border border-border text-muted-foreground text-sm font-semibold px-6 py-2.5 rounded-none hover:bg-muted/80 transition-colors duration-150"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // ── Build gateProps for LockedOverlay (EXACT same shape, no visual changes) ─

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
    isLoading:
      pipeline.phoneStatus === "sending_otp" ||
      pipeline.phoneStatus === "verifying" ||
      isLoadingFull,
    errorMsg: pipeline.errorMsg,
    resendCooldown: pipeline.resendCooldown,
    onResend: handleResend,
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
    <TruthReportClassic
      grade={analysisData.grade}
      flags={analysisData.flags}
      pillarScores={analysisData.pillarScores}
      contractorName={analysisData.contractorName}
      county={county}
      confidenceScore={analysisData.confidenceScore}
      documentType={analysisData.documentType}
      accessLevel={accessLevel}
      qualityBand={analysisData.qualityBand}
      hasWarranty={analysisData.hasWarranty}
      hasPermits={analysisData.hasPermits}
      pageCount={analysisData.pageCount}
      lineItemCount={analysisData.lineItemCount}
      flagCount={analysisData.flagCount}
      flagRedCount={analysisData.flagRedCount}
      flagAmberCount={analysisData.flagAmberCount}
      onContractorMatchClick={handleContractorMatchClick}
      onSecondScan={handleSecondScan}
      gateProps={accessLevel === "preview" ? gateProps : undefined}
    />
    <ContractorMatch
      isVisible={contractorMatchVisible}
      grade={analysisData.grade}
      county={county}
      scanSessionId={sessionId ?? null}
      isFullLoaded={isFullLoaded}
      phoneE164={funnel?.phoneE164 || pipeline.e164 || null}
    />
    </>
  );
}
