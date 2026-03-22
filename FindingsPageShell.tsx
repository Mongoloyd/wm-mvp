import { useState, useCallback } from "react";
import type { ReportEnvelope, ReportMode, GateState } from "@/types/report-v2";
import { ReportRevealContainer } from "./ReportRevealContainer";
import { OtpUnlockModal } from "./OtpUnlockModal";
import { ReportShellV2 } from "../report-v2/ReportShellV2";

interface FindingsPageShellProps {
  report: ReportEnvelope;
  phoneMasked?: string;
  isDemoMode?: boolean;
  initialGateState?: GateState;
  // Wire these to your Twilio edge functions
  onSubmitOtp?: (code: string) => Promise<boolean>;
  onResendOtp?: () => Promise<void>;
  onEditPhone?: () => void;
}

export function FindingsPageShell({
  report,
  phoneMasked = "(•••) •••-••34",
  isDemoMode = false,
  initialGateState = "otp_required",
  onSubmitOtp,
  onResendOtp,
  onEditPhone,
}: FindingsPageShellProps) {
  const [gateState, setGateState] = useState<GateState>(initialGateState);
  const [resendTimer, setResendTimer] = useState(30);
  const [reportMode, setReportMode] = useState<ReportMode>(
    initialGateState === "unlocked" ? "full" : "partial_reveal"
  );

  const isLocked = gateState !== "unlocked";

  // ── OTP handlers ───────────────────────────────────────────────────────

  const handleSubmitCode = useCallback(
    async (code: string) => {
      setGateState("otp_submitting");

      if (onSubmitOtp) {
        // Real Twilio flow
        try {
          const success = await onSubmitOtp(code);
          if (success) {
            setGateState("unlocked");
            setReportMode("full");
            // Analytics: track('wm_report_unlocked', { sessionId: report.meta.analysisId })
          } else {
            setGateState("otp_invalid");
          }
        } catch {
          setGateState("otp_invalid");
        }
      } else {
        // Dev/demo fallback: simulate verification
        await new Promise((r) => setTimeout(r, 1200));
        setGateState("unlocked");
        setReportMode("full");
      }
    },
    [onSubmitOtp, report.meta.analysisId]
  );

  const handleResend = useCallback(async () => {
    if (onResendOtp) {
      await onResendOtp();
    }
    setResendTimer(30);
    setGateState("otp_required");

    // Countdown timer
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onResendOtp]);

  // ── Build the report with current mode ─────────────────────────────────

  const displayReport: ReportEnvelope = {
    ...report,
    mode: reportMode,
    meta: {
      ...report.meta,
      render: {
        ...report.meta.render,
        partialReveal: isLocked,
        evidenceBlurred: isLocked,
        benchmarksVisible: !isLocked,
        appendixVisible: !isLocked,
      },
    },
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <ReportRevealContainer
      isLocked={isLocked}
      overlay={
        <OtpUnlockModal
          open={isLocked}
          phoneMasked={isDemoMode ? "(555) 012-3456" : phoneMasked}
          status={gateState}
          secondsRemaining={resendTimer}
          onSubmitCode={handleSubmitCode}
          onResend={handleResend}
          onEditPhone={onEditPhone}
        />
      }
    >
      <ReportShellV2
        report={displayReport}
        mode={reportMode}
        gateState={gateState}
        onUnlock={() => {
          // Scroll to top when unlock CTA clicked inside report
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </ReportRevealContainer>
  );
}
