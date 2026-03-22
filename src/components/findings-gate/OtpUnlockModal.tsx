import { useState, useRef, useEffect, useCallback } from "react";
import { ShieldCheck, ArrowRight, AlertCircle, RotateCcw, Pencil } from "lucide-react";
import type { GateState, OtpVerifyOutcome } from "@/types/report-v2";

interface OtpUnlockModalProps {
  open: boolean;
  phoneMasked: string;
  status: GateState;
  secondsRemaining?: number;
  /** Rich outcome callback — page layer returns the Twilio result, not a boolean. */
  onSubmitCode: (code: string) => Promise<OtpVerifyOutcome>;
  onResend: () => void;
  onEditPhone?: () => void;
  onClose?: () => void;
}

const STATUS_MESSAGES: Partial<Record<GateState, { text: string; color: string }>> = {
  otp_invalid: { text: "That code didn't match. Please try again.", color: "text-red-400" },
  otp_expired: { text: "Your code has expired. Tap resend below.", color: "text-amber-400" },
};

export function OtpUnlockModal({
  open,
  phoneMasked,
  status,
  secondsRemaining = 0,
  onSubmitCode,
  onResend,
  onEditPhone,
}: OtpUnlockModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Autofocus first input on open
  useEffect(() => {
    if (open && status === "otp_required") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open, status]);

  // Clear on error
  useEffect(() => {
    if (status === "otp_invalid" || status === "otp_expired") {
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [status]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      // Handle paste of full code
      if (value.length > 1) {
        const pasted = value.replace(/\D/g, "").slice(0, 6);
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || "";
        }
        setDigits(newDigits);
        if (pasted.length === 6) {
          onSubmitCode(pasted);
        } else {
          inputRefs.current[Math.min(pasted.length, 5)]?.focus();
        }
        return;
      }

      // Single digit
      const digit = value.replace(/\D/g, "");
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);

      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 6 filled
      if (digit && index === 5) {
        const code = newDigits.join("");
        if (code.length === 6) {
          onSubmitCode(code);
        }
      }
    },
    [digits, onSubmitCode]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handleSubmit = () => {
    const code = digits.join("");
    if (code.length === 6) {
      onSubmitCode(code);
    }
  };

  const isSubmitting = status === "otp_submitting";
  const statusMessage = STATUS_MESSAGES[status];
  const canResend = secondsRemaining <= 0 && !isSubmitting;
  const isFilled = digits.every((d) => d !== "");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop — frosted, not too dark. Report must sell value underneath. */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal card — bottom-sheet mobile, centered desktop */}
      <div
        className={`
          relative w-full sm:max-w-md
          rounded-t-3xl sm:rounded-2xl
          bg-slate-950/98 ring-1 ring-white/10
          shadow-2xl shadow-black/50
          overflow-hidden
          animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95
          duration-300 ease-out
        `}
      >
        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#1A6FD4] via-cyan-500 to-[#1A6FD4]" />

        {/* Mobile drag indicator */}
        <div className="flex justify-center py-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="px-6 pb-8 pt-4 sm:px-8 sm:pt-8">
          {/* Icon + headline */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A6FD4]/15 ring-1 ring-[#1A6FD4]/25">
              <ShieldCheck className="h-7 w-7 text-[#1A6FD4]" />
            </div>

            <h2
              className="text-xl font-bold text-white sm:text-2xl"
              style={{ letterSpacing: "-0.02em", lineHeight: "1.2" }}
            >
              Enter the code we just sent
            </h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Your secure findings report is ready. Verify to unlock the full
              proof, action plan, and pricing benchmarks.
            </p>
          </div>

          {/* Phone display */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-sm font-medium text-slate-300 font-mono">
              {phoneMasked}
            </span>
            {onEditPhone && (
              <button
                onClick={onEditPhone}
                className="rounded-md p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                aria-label="Edit phone number"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* 6-digit input */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-4">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={6} // Allow paste
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={isSubmitting}
                className={`
                  h-14 w-11 sm:w-12 rounded-xl
                  bg-slate-900/80 text-center text-xl font-bold font-mono
                  text-white placeholder-slate-700
                  ring-1 transition-all duration-150
                  focus:outline-none focus:ring-2
                  ${
                    status === "otp_invalid"
                      ? "ring-red-500/50 focus:ring-red-400"
                      : "ring-white/10 focus:ring-[#1A6FD4]"
                  }
                  ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                `}
                placeholder="·"
              />
            ))}
          </div>

          {/* Status message */}
          {statusMessage && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertCircle className={`h-3.5 w-3.5 ${statusMessage.color}`} />
              <p className={`text-xs font-medium ${statusMessage.color}`}>
                {statusMessage.text}
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!isFilled || isSubmitting}
            className={`
              w-full h-13 rounded-xl text-base font-bold
              flex items-center justify-center gap-2.5
              transition-all duration-200
              ${
                isFilled && !isSubmitting
                  ? "bg-gradient-to-r from-[#E85A1B] to-[#BB2D00] text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }
            `}
            style={{ height: "52px" }}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Access Full Audit
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Resend */}
          <div className="mt-4 text-center">
            {canResend ? (
              <button
                onClick={onResend}
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Resend code
              </button>
            ) : secondsRemaining > 0 ? (
              <p className="text-xs text-slate-600">
                Resend available in {secondsRemaining}s
              </p>
            ) : null}
          </div>

          {/* Security note */}
          <div className="mt-5 rounded-lg bg-white/[0.03] ring-1 ring-white/5 px-4 py-3 flex gap-3 items-start">
            <ShieldCheck className="h-4 w-4 text-[#1A6FD4] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              This verification protects your quote data from unauthorized
              access. Your phone number is never shared or sold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
