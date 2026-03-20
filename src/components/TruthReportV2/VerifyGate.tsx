/**
 * VerifyGate — Inline phone/OTP form placed between findings and evidence.
 * Includes Zeigarnik progress bar ("STEP 2 OF 2").
 *
 * Phase 2: resend cooldown, error-clearing on input, ARIA labels.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { usePhoneInput } from "@/hooks/usePhoneInput";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";

interface VerifyGateProps {
  issueCount: number;
  onVerified: () => void;
  scanSessionId?: string | null;
}

type Step = "phone" | "sending" | "otp" | "verifying";

const RESEND_COOLDOWN = 30;

const fadeUp = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay: 0.32, duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export function VerifyGate({ issueCount, onVerified, scanSessionId }: VerifyGateProps) {
  const { displayValue, rawDigits, e164, isValid, handleChange } = usePhoneInput();
  const [otpValue, setOtpValue] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const isPhoneStep = step === "phone" || step === "sending";
  const isOtpStep = step === "otp" || step === "verifying";
  const digitCount = rawDigits.length;
  const progressPercent = isPhoneStep ? 50 + (digitCount / 10) * 40 : 95;

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Clear error when phone input changes
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (errorMsg) setErrorMsg("");
      handleChange(e);
    },
    [handleChange, errorMsg]
  );

  // Clear error when OTP input changes
  const handleOtpChange = useCallback(
    (val: string) => {
      if (errorMsg) setErrorMsg("");
      setOtpValue(val);
    },
    [errorMsg]
  );

  const handleSendCode = async () => {
    if (!isValid || !e164) return;
    setStep("sending");
    setErrorMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone_e164: e164 },
      });
      if (error || !data?.success) {
        setErrorMsg(data?.error || "Failed to send code.");
        setStep("phone");
        return;
      }
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setErrorMsg("Network error. Try again.");
      setStep("phone");
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !e164) return;
    setErrorMsg("");
    setCooldown(RESEND_COOLDOWN);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone_e164: e164 },
      });
      if (error || !data?.success) {
        setErrorMsg(data?.error || "Failed to resend code.");
        setCooldown(0);
      }
    } catch {
      setErrorMsg("Network error. Try again.");
      setCooldown(0);
    }
  };

  const handleVerify = async () => {
    if (otpValue.length < 6 || !e164) return;
    setStep("verifying");
    setErrorMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone_e164: e164, code: otpValue, scan_session_id: scanSessionId || undefined },
      });
      if (error || !data?.verified) {
        setErrorMsg(data?.error || "Invalid or expired code.");
        setStep("otp");
        return;
      }
      onVerified();
    } catch {
      setErrorMsg("Network error. Try again.");
      setStep("otp");
    }
  };

  return (
    <motion.div
      {...fadeUp}
      className="mb-12 border border-gold/30 bg-gold/[0.03] px-5 sm:px-8 py-7"
      role="region"
      aria-label="Phone verification to unlock report"
    >
      {/* Progress bar */}
      <p className="text-gold text-sm font-bold mb-2">v2-rebuild-check</p>
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-[0.1em] text-gold font-bold">
            {isPhoneStep ? "STEP 2 OF 2" : "FINAL STEP"}
          </span>
          <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
            {isPhoneStep ? "ALMOST UNLOCKED" : "VERIFYING"}
          </span>
        </div>
        <div className="h-1 bg-surface-border overflow-hidden" role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-gold to-[#E2B04A] shadow-[0_0_8px_rgba(200,149,42,0.4)]"
          />
        </div>
      </div>

      {/* Headline */}
      <div className="flex items-center gap-2 mb-1">
        <Lock size={14} className="text-gold" aria-hidden="true" />
        <span className="font-mono text-[10px] tracking-[0.1em] text-gold font-bold">
          VERIFICATION REQUIRED
        </span>
      </div>
      <h3 className="font-heading text-xl font-black text-foreground leading-tight mb-1">
        We found {issueCount} issue{issueCount !== 1 ? "s" : ""} in your quote.
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Verify your number to see the full details.
      </p>

      {/* Error */}
      {errorMsg && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-vivid-orange mb-3 font-medium"
          role="alert"
        >
          {errorMsg}
        </motion.p>
      )}

      <AnimatePresence mode="wait">
        {isPhoneStep && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-[480px]"
          >
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground font-semibold pointer-events-none" aria-hidden="true">
                +1
              </span>
              <input
                type="tel"
                value={displayValue}
                onChange={handlePhoneChange}
                placeholder="(555) 555-5555"
                aria-label="US phone number"
                autoComplete="tel-national"
                className="w-full h-[50px] bg-surface text-foreground text-center text-lg font-semibold tracking-wide pl-10 pr-4 outline-none border-2 transition-all duration-200 caret-gold"
                style={{
                  borderColor: isValid ? "hsl(var(--gold))" : "hsl(var(--surface-border))",
                  boxShadow: isValid ? "0 0 0 4px hsl(var(--gold) / 0.12)" : "none",
                }}
              />
            </div>
            <button
              onClick={handleSendCode}
              disabled={!isValid || step === "sending"}
              aria-label={`Send verification code to unlock ${issueCount} issues`}
              className="h-[50px] px-6 font-bold text-sm flex items-center justify-center gap-2 shrink-0 transition-all active:scale-[0.97]"
              style={{
                background: isValid ? "linear-gradient(135deg, hsl(var(--gold)), #E2B04A)" : "hsl(var(--gold) / 0.2)",
                color: isValid ? "white" : "hsl(var(--foreground) / 0.4)",
                cursor: isValid && step !== "sending" ? "pointer" : "not-allowed",
                boxShadow: isValid ? "0 4px 16px hsl(var(--gold) / 0.3)" : "none",
              }}
            >
              {step === "sending" ? (
                <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…</>
              ) : (
                <>🔓 Reveal {issueCount} Issue{issueCount !== 1 ? "s" : ""}</>
              )}
            </button>
          </motion.div>
        )}

        {isOtpStep && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-start gap-3"
          >
            <p className="text-sm text-muted-foreground" id="otp-instructions">
              Enter the 6-digit code sent to your phone
            </p>
            <InputOTP maxLength={6} value={otpValue} onChange={handleOtpChange} aria-describedby="otp-instructions">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="!border-surface-border !bg-surface/60 !text-foreground !w-12 !h-14 !text-xl !font-bold"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="flex flex-col items-start gap-3 w-full">
              <button
                onClick={handleVerify}
                disabled={otpValue.length < 6 || step === "verifying"}
                aria-label="Verify code and unlock report"
                className="h-[50px] px-6 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{
                  background: otpValue.length === 6 ? "linear-gradient(135deg, hsl(var(--gold)), #E2B04A)" : "hsl(var(--gold) / 0.2)",
                  color: otpValue.length === 6 ? "white" : "hsl(var(--foreground) / 0.4)",
                  cursor: otpValue.length === 6 && step !== "verifying" ? "pointer" : "not-allowed",
                }}
              >
                {step === "verifying" ? (
                  <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Verifying…</>
                ) : (
                  "Verify & Unlock Report"
                )}
              </button>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-50 disabled:no-underline disabled:cursor-default transition-opacity"
                  aria-label={cooldown > 0 ? `Resend code available in ${cooldown} seconds` : "Resend verification code"}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
                <span className="text-muted-foreground/30">·</span>
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtpValue(""); setErrorMsg(""); setCooldown(0); }}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                >
                  Use a different number
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[11px] text-muted-foreground/50 mt-4">
        We'll text a 6-digit code. No spam, ever.
      </p>
    </motion.div>
  );
}
