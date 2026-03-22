import { useState, useCallback } from "react";
import type { ReportEnvelope, ReportMode, GateState, OtpVerifyOutcome } from "@/types/report-v2";
import { ReportRevealContainer } from "./ReportRevealContainer";
import { OtpUnlockModal } from "./OtpUnlockModal";
import { ReportShellV2 } from "../report-v2/ReportShellV2";

// ── Outcome → GateState mapping ──────────────────────────────────────────────
// The shell translates rich outcomes from the page layer into its own GateState.
// This keeps the shell's state machine self-contained while allowing the page
// to return semantically meaningful results from the Twilio verification.
const OUTCOME_TO_GATE: Record<OtpVerifyOutcome, GateState> = {
  verified: "unlocked",
  invalid: "otp_invalid",
  expired: "otp_expired",
  error: "otp_invalid", // treat network/unknown errors as retryable
};

interface FindingsPageShellProps {
  report: ReportEnvelope;
  phoneMasked?: string;
  isDemoMode?: boolean;
  initialGateState?: GateState;
  // Wire these to your Twilio edge functions via usePhonePipeline in Report.tsx
  onSubmitOtp?: (code: string) => Promise<OtpVerifyOutcome>;
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
    async (code: string): Promise<OtpVerifyOutcome> => {
      setGateState("otp_submitting");

      if (onSubmitOtp) {
        // Real Twilio flow — page layer returns a rich outcome
        try {
          const outcome = await onSubmitOtp(code);
          const nextGate = OUTCOME_TO_GATE[outcome];
          setGateState(nextGate);

          if (outcome === "verified") {
            setReportMode("full");
            // Analytics: track('wm_report_unlocked', { sessionId: report.meta.analysisId })
          }

          return outcome;
        } catch {
          setGateState("otp_invalid");
          return "error";
        }
      } else {
        // Dev/demo fallback: simulate verification
        await new Promise((r) => setTimeout(r, 1200));
        setGateState("unlocked");
        setReportMode("full");
        return "verified";
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
