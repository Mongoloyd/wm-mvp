/**
 * PostScanReportSwitcher — In-page post-scan report orchestrator.
 *
 * CANONICAL: Always renders TruthReportClassic (findings-first removed).
 * Owns the real Twilio OTP pipeline for the in-page scan flow.
 * After OTP success, calls onVerified(phoneE164) so parent can trigger fetchFull().
 */

import React, { useState, useCallback } from "react";
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

function deriveGateMode(
  funnelPhoneStatus: string | undefined,
  funnelPhoneE164: string | null | undefined
): GateMode {
  if (funnelPhoneStatus === "otp_sent" || funnelPhoneStatus === "verified") return "enter_code";
  if (funnelPhoneE164) return "send_code";
  return "enter_phone";
}

export function PostScanReportSwitcher(props: Props) {
  const accessLevel = useReportAccess({ isFullLoaded: props.isFullLoaded });
  const funnel = useScanFunnelSafe();
  const [otpValue, setOtpValue] = useState("");
  const [isSendInFlight, setIsSendInFlight] = useState(false);

  const pipeline = usePhonePipeline("validate_and_send_otp", {
    scanSessionId: props.scanSessionId,
    externalPhoneE164: funnel?.phoneE164 ?? null,
    onVerified: () => {
      funnel?.setPhoneStatus("verified");
      const phone = funnel?.phoneE164 || pipeline.e164;
      if (phone) props.onVerified?.(phone);
    },
  });

  const gateMode = deriveGateMode(funnel?.phoneStatus, funnel?.phoneE164);

  const handleOtpSubmit = useCallback(async () => {
    if (otpValue.length < 6) return;
    await pipeline.submitOtp(otpValue);
  }, [otpValue, pipeline]);

  const handleSendCode = useCallback(async () => {
    if (!funnel?.phoneE164 || isSendInFlight) return;
    setIsSendInFlight(true);
    try {
      const result = await pipeline.submitPhone();
      if (result.status === "otp_sent") funnel.setPhoneStatus("otp_sent");
    } finally {
      setIsSendInFlight(false);
    }
  }, [funnel, pipeline, isSendInFlight]);

  const handlePhoneSubmit = useCallback(async () => {
    if (isSendInFlight) return;
    setIsSendInFlight(true);
    try {
      const result = await pipeline.submitPhone();
      if (result.status === "otp_sent" && result.e164) funnel?.setPhone(result.e164, "otp_sent");
    } finally {
      setIsSendInFlight(false);
    }
  }, [pipeline, funnel, isSendInFlight]);

  const handleResend = useCallback(async () => { await pipeline.resend(); }, [pipeline]);

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
      isSendInFlight ||
      pipeline.phoneStatus === "sending_otp" ||
      pipeline.phoneStatus === "verifying",
    errorMsg: pipeline.errorMsg,
    resendCooldown: pipeline.resendCooldown,
    onResend: handleResend,
  };

  return (
    <TruthReportClassic
      {...props}
      accessLevel={accessLevel}
      gateProps={accessLevel === "preview" ? gateProps : undefined}
    />
  );
}
