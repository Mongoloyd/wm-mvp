/**
 * LockedOverlay — Stateless verification gate for TruthReportClassic.
 *
 * Three visual states driven by `gateMode`:
 *   enter_code  — OTP input (best path, vast majority)
 *   send_code   — phone known, OTP not yet sent (fallback)
 *   enter_phone — no phone captured upstream (rare)
 *
 * All business logic lives in the parent orchestrator.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export type GateMode = "enter_code" | "send_code" | "enter_phone";

export interface LockedOverlayProps {
  /** Which gate state to render */
  gateMode: GateMode;
  /** Grade string for teaser headline */
  grade: string;
  /** Number of flags/issues found */
  flagCount: number;

  /* ── OTP entry (enter_code mode) ── */
  otpValue: string;
  onOtpChange: (value: string) => void;
  onOtpSubmit: () => void;

  /* ── Send code (send_code fallback) ── */
  onSendCode: () => void;

  /* ── Phone entry (rare path) ── */
  phoneDisplayValue?: string;
  phoneIsValid?: boolean;
  phoneDigitCount?: number;
  onPhoneChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneSubmit?: () => void;

  /* ── Shared pipeline state ── */
  isLoading: boolean;
  errorMsg: string;
  resendCooldown: number;
  onResend: () => void;
}

export function LockedOverlay({
  gateMode,
  grade,
  flagCount,
  otpValue,
  onOtpChange,
  onOtpSubmit,
  onSendCode,
  phoneDisplayValue = "",
  phoneIsValid = false,
  phoneDigitCount = 0,
  onPhoneChange,
  onPhoneSubmit,
  isLoading,
  errorMsg,
  resendCooldown,
  onResend,
}: LockedOverlayProps) {
  const issueCount = flagCount;

  // Header text per mode
  const header = `Your ${grade} has ${issueCount} red flag${issueCount !== 1 ? "s" : ""}.`;
  const subtext =
    gateMode === "enter_code"
      ? ["Enter the code we texted you", "to unlock your full report."]
      : gateMode === "send_code"
        ? ["We need to verify your number", "to show you what we found."]
        : ["Enter your number to verify", "and unlock your full report."];

  const progressPercent =
    gateMode === "enter_phone"
      ? 50 + (phoneDigitCount / 10) * 40
      : gateMode === "send_code"
        ? 85
        : 95;

  const stepLabel =
    gateMode === "enter_code" ? "FINAL STEP" : "STEP 2 OF 2";
  const stepHint =
    gateMode === "enter_code" ? "VERIFYING" : "ALMOST UNLOCKED";

  return (
    <div className="relative">
      {/* Blurred redacted findings behind */}
      <div
        className="flex flex-col gap-3"
        style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "#0A0A0A",
              border: "1.5px solid #FECACA",
              borderLeft: "4px solid #DC2626",
              borderRadius: 0,
              padding: "20px 20px 20px 24px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: "rgba(220,38,38,0.12)",
                borderRadius: 0,
                padding: "3px 10px",
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: "#DC2626",
              }}
            >
              ⚠ CRITICAL
            </span>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 17,
                fontWeight: 700,
                color: "#FFFFFF",
                marginTop: 8,
              }}
            >
              ██████████ ██████
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#E5E7EB",
                marginTop: 6,
              }}
            >
              ████████ ██████ ████████ ██████████ ██████.
            </p>
          </div>
        ))}
      </div>

      {/* Gate overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          background: "rgba(10,10,10,0.85)",
          borderRadius: 0,
          backdropFilter: "blur(2px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "#0A0A0A",
            borderRadius: 0,
            padding: "28px 32px 32px",
            textAlign: "center",
            boxShadow:
              "0 12px 48px rgba(15,31,53,0.45), 0 0 0 1px rgba(200,149,42,0.12) inset, 0 1px 0 rgba(255,255,255,0.04) inset",
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* ─── Progress indicator (Zeigarnik) ─── */}
          <div style={{ marginBottom: 20 }}>
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: 6 }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#C8952A",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                {stepLabel}
              </span>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: "#94A3B8",
                  letterSpacing: "0.06em",
                }}
              >
                {stepHint}
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 0,
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" as const }}
                style={{
                  height: "100%",
                  borderRadius: 0,
                  background: "linear-gradient(90deg, #C8952A, #E2B04A)",
                  boxShadow: "0 0 8px rgba(200,149,42,0.4)",
                }}
              />
            </div>
          </div>

          {/* ─── Lock icon + headline ─── */}
          <div style={{ marginBottom: 6 }}>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#C8952A",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              🔒 VERIFICATION REQUIRED
            </p>
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.25,
                marginBottom: 6,
              }}
            >
              {header}
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#94A3B8",
                marginBottom: 4,
              }}
            >
              {subtext[0]}
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: "#94A3B8",
                marginBottom: 20,
              }}
            >
              {subtext[1]}
            </p>
          </div>

          {/* ─── Error message ─── */}
          {errorMsg && (
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "#DC2626",
                marginBottom: 12,
              }}
            >
              {errorMsg}
            </p>
          )}

          <AnimatePresence mode="wait">
            {/* ═══ ENTER CODE ═══ */}
            {gateMode === "enter_code" && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="[&_input]:!bg-transparent [&_input]:!text-[#f7f7f7]">
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={onOtpChange}
                    autoFocus
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="!border-[#f7f7f733] !bg-[rgba(255,255,255,0.06)] !text-[#f7f7f7] !w-12 !h-14 !text-xl !font-bold"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <motion.button
                  whileHover={otpValue.length === 6 ? { scale: 1.02 } : {}}
                  whileTap={otpValue.length === 6 ? { scale: 0.97 } : {}}
                  onClick={onOtpSubmit}
                  disabled={otpValue.length < 6 || isLoading}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: 54,
                    background:
                      otpValue.length === 6
                        ? "linear-gradient(135deg, #C8952A, #E2B04A)"
                        : "rgba(200,149,42,0.2)",
                    color:
                      otpValue.length === 6
                        ? "white"
                        : "rgba(255,255,255,0.4)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 17,
                    fontWeight: 800,
                    borderRadius: 0,
                    border:
                      otpValue.length === 6
                        ? "1px solid rgba(226,176,74,0.3)"
                        : "1px solid transparent",
                    cursor:
                      otpValue.length === 6 && !isLoading
                        ? "pointer"
                        : "not-allowed",
                    boxShadow:
                      otpValue.length === 6
                        ? "0 6px 24px rgba(200,149,42,0.4)"
                        : "none",
                    transition: "all 0.3s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & Unlock Report"
                  )}
                </motion.button>

                {/* Resend */}
                <button
                  onClick={onResend}
                  disabled={resendCooldown > 0}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: resendCooldown > 0 ? "default" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: "#94A3B8",
                    textDecoration: resendCooldown > 0 ? "none" : "underline",
                    textUnderlineOffset: 2,
                  }}
                >
                  {resendCooldown > 0
                    ? `Didn't get it? Resend (0:${String(resendCooldown).padStart(2, "0")})`
                    : "Didn't get it? Resend code"}
                </button>
              </motion.div>
            )}

            {/* ═══ SEND CODE ═══ */}
            {gateMode === "send_code" && (
              <motion.div
                key="send-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onSendCode}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: 54,
                    background:
                      "linear-gradient(135deg, #C8952A 0%, #E2B04A 50%, #C8952A 100%)",
                    backgroundSize: "200% 100%",
                    color: "white",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 17,
                    fontWeight: 800,
                    borderRadius: 0,
                    border: "1px solid rgba(226,176,74,0.3)",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow:
                      "0 6px 24px rgba(200,149,42,0.4), 0 2px 8px rgba(200,149,42,0.2)",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    letterSpacing: "0.01em",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending Code…
                    </>
                  ) : (
                    "Get Your Code →"
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* ═══ ENTER PHONE ═══ */}
            {gateMode === "enter_phone" && (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-3"
              >
                <div style={{ width: "100%", maxWidth: 320, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 14,
                      color: "#94A3B8",
                      fontWeight: 600,
                      pointerEvents: "none",
                    }}
                  >
                    +1
                  </div>
                  <input
                    type="tel"
                    value={phoneDisplayValue}
                    onChange={onPhoneChange}
                    placeholder="(555) 555-5555"
                    autoFocus
                    style={{
                      width: "100%",
                      height: 54,
                      background: "rgba(255,255,255,0.07)",
                      border: phoneIsValid
                        ? "2px solid #C8952A"
                        : phoneDigitCount > 0
                          ? "2px solid rgba(255,255,255,0.2)"
                          : "2px solid rgba(255,255,255,0.1)",
                      borderRadius: 0,
                      padding: "0 16px 0 40px",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 19,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      textAlign: "center",
                      letterSpacing: "0.03em",
                      outline: "none",
                      transition:
                        "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                      boxShadow: phoneIsValid
                        ? "0 0 0 4px rgba(200,149,42,0.15), 0 2px 12px rgba(0,0,0,0.2)"
                        : "0 2px 12px rgba(0,0,0,0.2)",
                      caretColor: "#C8952A",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    }}
                  />
                  {phoneDigitCount > 0 && phoneDigitCount < 10 && (
                    <span
                      style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 11,
                        color: "#64748B",
                      }}
                    >
                      {phoneDigitCount}/10
                    </span>
                  )}
                  {phoneIsValid && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#C8952A",
                        fontSize: 16,
                      }}
                    >
                      ✓
                    </motion.span>
                  )}
                </div>

                <motion.button
                  whileHover={phoneIsValid ? { scale: 1.02, y: -1 } : {}}
                  whileTap={phoneIsValid ? { scale: 0.97 } : {}}
                  onClick={onPhoneSubmit}
                  disabled={!phoneIsValid || isLoading}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: 54,
                    background: phoneIsValid
                      ? "linear-gradient(135deg, #C8952A 0%, #E2B04A 50%, #C8952A 100%)"
                      : "rgba(200,149,42,0.2)",
                    backgroundSize: "200% 100%",
                    color: phoneIsValid ? "white" : "rgba(255,255,255,0.4)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 17,
                    fontWeight: 800,
                    borderRadius: 0,
                    border: phoneIsValid
                      ? "1px solid rgba(226,176,74,0.3)"
                      : "1px solid transparent",
                    cursor:
                      phoneIsValid && !isLoading ? "pointer" : "not-allowed",
                    boxShadow: phoneIsValid
                      ? "0 6px 24px rgba(200,149,42,0.4), 0 2px 8px rgba(200,149,42,0.2)"
                      : "none",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    letterSpacing: "0.01em",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending Code…
                    </>
                  ) : (
                    <>🔓 Send Code</>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Trust micro-copy ─── */}
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: "#64748B",
              marginTop: 16,
              letterSpacing: "0.04em",
              lineHeight: 1.5,
            }}
          >
            one code · one time · one call
          </p>
        </motion.div>
      </div>
    </div>
  );
}
