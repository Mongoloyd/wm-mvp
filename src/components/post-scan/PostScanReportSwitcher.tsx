import React, { useState, useCallback } from "react";
import { useAnalysisViewMode } from "../../state/analysisViewMode";
import { useReportAccess } from "@/hooks/useReportAccess";
import { useScanFunnelSafe } from "@/state/scanFunnel";
import { usePhonePipeline } from "@/hooks/usePhonePipeline";

import TruthReportClassic from "../TruthReportClassic";
import { TruthReportFindings } from "../TruthReportFindings/TruthReportFindings";

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
  onContractorMatchClick: () => void;
  onSecondScan: () => void;
  scanSessionId?: string | null;
};

/**
 * Derives gateMode from funnel state.
 *
 * Priority:
 *   1. otp_sent → enter_code (best path)
 *   2. phone known but no OTP → send_code (fallback)
 *   3. no phone → enter_phone (rare)
 */
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

export function PostScanReportSwitcher(props: Props) {
  const { mode, isReady } = useAnalysisViewMode();
  const accessLevel = useReportAccess();
  const funnel = useScanFunnelSafe();

  // OTP value state (lives here in the orchestrator)
  const [otpValue, setOtpValue] = useState("");

  // Phone pipeline — used for send_code and enter_phone modes
  const pipeline = usePhonePipeline("validate_and_send_otp", {
    scanSessionId: props.scanSessionId,
    externalPhoneE164: funnel?.phoneE164 ?? null,
    onVerified: () => {
      funnel?.setPhoneStatus("verified");
    },
  });

  const gateMode = deriveGateMode(funnel?.phoneStatus, funnel?.phoneE164);

  // ── Gate actions ──

  const handleOtpSubmit = useCallback(async () => {
    if (otpValue.length < 6) return;
    await pipeline.submitOtp(otpValue);
  }, [otpValue, pipeline]);

  const handleSendCode = useCallback(async () => {
    // Use the phone from funnel context
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

  if (!isReady) return null;

  // Build gate props for locked state
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
      pipeline.phoneStatus === "verifying",
    errorMsg: pipeline.errorMsg,
    resendCooldown: pipeline.resendCooldown,
    onResend: handleResend,
  };

  if (mode === "findings") {
    return <TruthReportFindings analysis={{ ...props, accessLevel }} />;
  }

  return (
    <TruthReportClassic
      {...props}
      accessLevel={accessLevel}
      gateProps={accessLevel === "preview" ? gateProps : undefined}
    />
  );
}
