/**
 * LockedOverlay — Two-step verification gate for TruthReportClassic.
 *
 * Two visual states driven by `gateMode`:
 *   enter_phone — phone capture + TCPA consent (primary path, Just-in-Time)
 *   enter_code  — OTP input (after send succeeds)
 *
 * All business logic lives in the parent orchestrator (PostScanReportSwitcher).
 */

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export type GateMode = "enter_code" | "send_code" | "enter_phone";

export interface LockedOverlayProps {
  /** Which gate state to render */
  gateMode: GateMode;
  /** Grade string for teaser headline */
  grade: string;
  /** Number of flags/issues found */
  flagCount: number;
  /** Number of red (critical) flags */
  flagRedCount?: number;

  /* ── OTP entry (enter_code mode) ── */
  otpValue: string;
  onOtpChange: (value: string) => void;
  onOtpSubmit: () => void;

  /* ── Send code (send_code fallback — kept for backward compat) ── */
  onSendCode: () => void;

  /* ── Phone entry (primary path) ── */
  phoneDisplayValue?: string;
  phoneIsValid?: boolean;
  phoneDigitCount?: number;
  onPhoneChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneSubmit?: () => void;

  /* ── TCPA consent ── */
  tcpaConsent?: boolean;
  onTcpaChange?: (checked: boolean) => void;

  /* ── Masked phone for OTP step display ── */
  maskedPhone?: string;

  /* ── Wrong number — go back to phone entry ── */
  onChangePhone?: () => void;

  /* ── Shared pipeline state ── */
  isLoading: boolean;
  errorMsg: string;
  /** Classifies the error for richer UX */
  errorType?: "rate_limit" | "expired_session" | "invalid_code" | "network" | "generic";
  resendCooldown: number;
  onResend: () => void;
  /** True when fetchFull has stalled after OTP success */
  fetchStalled?: boolean;
  /** Retry fetchFull without resending OTP */
  onRetryFetchFull?: () => void;
}

export function LockedOverlay({
  gateMode,
  grade,
  flagCount,
  flagRedCount,
  otpValue,
  onOtpChange,
  onOtpSubmit,
  onSendCode,
  phoneDisplayValue = "",
  phoneIsValid = false,
  phoneDigitCount = 0,
  onPhoneChange,
  onPhoneSubmit,
  tcpaConsent = false,
  onTcpaChange,
  maskedPhone,
  onChangePhone,
  isLoading,
  errorMsg,
  errorType,
  resendCooldown,
  onResend,
  fetchStalled,
  onRetryFetchFull,
}: LockedOverlayProps) {
  const issueCount = flagCount;
  const redCount = flagRedCount ?? flagCount;

  // Header text per mode
  const header = gateMode === "enter_phone" ? "Unlock Your Full Report" : "Enter Your Secure Code";

  const subtext =
    gateMode === "enter_phone"
      ? [
          `We found ${issueCount} issue${issueCount !== 1 ? "s" : ""}, including ${redCount} critical flag${redCount !== 1 ? "s" : ""}.`,
          "Enter your mobile number and we'll send your secure unlock code.",
        ]
      : maskedPhone
        ? [`We sent a 6-digit code to ${maskedPhone}.`, "Enter it below to unlock your full report."]
        : ["Enter the code we texted you", "to unlock your full report."];

  const progressPercent =
    gateMode === "enter_phone" ? 50 + (phoneDigitCount / 10) * 40 : gateMode === "send_code" ? 85 : 95;

  const stepLabel = gateMode === "enter_code" ? "STEP 2 OF 2" : "STEP 1 OF 2";
  const stepHint = gateMode === "enter_code" ? "FINAL STEP" : "ALMOST THERE";

  const canSubmitPhone = phoneIsValid && tcpaConsent && !isLoading;

  return (
    <div className="relative min-h-[500px]">
      {/* Blurred redacted findings behind */}
      <div className="flex flex-col gap-3" style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="card-raised"
            style={{
              border: "1.5px solid #FECACA",
              borderLeft: "4px solid hsl(var(--color-danger))",
              padding: "20px 20px 20px 24px",
            }}
          >
            <span
              className="font-mono"
              style={{
                display: "inline-block",
                background: "hsl(var(--color-danger) / 0.12)",
                borderRadius: "var(--radius-btn)",
                padding: "3px 10px",
                fontSize: 10,
                fontWeight: 700,
                color: "hsl(var(--color-danger))",
              }}
            >
              ⚠ CRITICAL
            </span>
            <p
              className="font-body text-foreground"
              style={{
                fontSize: 17,
                fontWeight: 700,
                marginTop: 8,
              }}
            >
              ██████████ ██████
            </p>
            <p
              className="font-body text-foreground/90"
              style={{
                fontSize: 14,
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
          backdropFilter: "blur(2px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="card-dominant"
          style={{
            padding: "28px 32px 32px",
            textAlign: "center",
            boxShadow:
              "0 12px 48px rgba(15,31,53,0.45), 0 0 0 1px hsl(var(--color-gold-accent) / 0.12) inset, 0 1px 0 rgba(255,255,255,0.04) inset",
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* ─── Progress indicator (Zeigarnik) ─── */}
          <div style={{ marginBottom: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  color: "hsl(var(--color-gold-accent))",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                {stepLabel}
              </span>
              <span
                className="font-mono text-muted-foreground"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.06em",
                }}
              >
                {stepHint}
              </span>
            </div>
            <div
              className="bg-secondary overflow-hidden"
              style={{
                height: 4,
                borderRadius: "var(--radius-input)",
              }}
            >
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" as const }}
                style={{
                  height: "100%",
                  borderRadius: "var(--radius-input)",
                  background: "linear-gradient(90deg, #C8952A, #E2B04A)",
                  boxShadow: "0 0 8px hsl(var(--color-gold-accent) / 0.4)",
                }}
              />
            </div>
          </div>

          {/* ─── Lock icon + headline ─── */}
          <div style={{ marginBottom: 6 }}>
            <p
              className="font-mono"
              style={{
                fontSize: 11,
                color: "hsl(var(--color-gold-accent))",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              🔒 VERIFICATION REQUIRED
            </p>
            <p
              className="font-display text-foreground"
              style={{
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1.25,
                marginBottom: 6,
              }}
            >
              {header}
            </p>
            <p
              className="font-body text-muted-foreground"
              style={{
                fontSize: 14,
                marginBottom: 4,
              }}
            >
              {subtext[0]}
            </p>
            <p
              className="font-body text-muted-foreground"
              style={{
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {subtext[1]}
            </p>
          </div>

          {/* ─── Error message with contextual recovery ─── */}
          {errorMsg && (
            <div
              style={{
                background: "hsl(var(--color-danger) / 0.08)",
                border: "1px solid hsl(var(--color-danger) / 0.25)",
                borderRadius: "var(--radius-card)",
                padding: "12px 16px",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              <div className="flex items-center justify-center gap-2" style={{ marginBottom: 4 }}>
                {errorType === "rate_limit" ? (
                  <Clock size={14} style={{ color: "hsl(var(--color-caution))", flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={14} style={{ color: "hsl(var(--color-danger))", flexShrink: 0 }} />
                )}
                <p
                  className="font-body"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: errorType === "rate_limit" ? "hsl(var(--color-caution))" : "hsl(var(--color-danger))",
                    margin: 0,
                  }}
                >
                  {errorMsg}
                </p>
              </div>

              {/* Recovery action based on error type */}
              {errorType === "expired_session" && gateMode === "enter_code" && (
                <button
                  onClick={onResend}
                  disabled={resendCooldown > 0}
                  className="flex items-center gap-1.5 mx-auto font-body"
                  style={{
                    marginTop: 8,
                    background: "hsl(var(--color-gold-accent) / 0.15)",
                    border: "1px solid hsl(var(--color-gold-accent) / 0.3)",
                    borderRadius: "var(--radius-btn)",
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "hsl(var(--color-gold-accent))",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <RefreshCw size={12} />
                  {resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Request New Code"}
                </button>
              )}

              {errorType === "network" && (
                <p
                  className="font-body text-muted-foreground"
                  style={{
                    fontSize: 11,
                    marginTop: 6,
                    margin: 0,
                  }}
                >
                  Check your connection and try again.
                </p>
              )}

              {errorType === "rate_limit" && (
                <p
                  className="font-body text-muted-foreground"
                  style={{
                    fontSize: 11,
                    marginTop: 6,
                    margin: 0,
                  }}
                >
                  This protects your phone from abuse. The limit resets shortly.
                </p>
              )}
            </div>
          )}

          {/* ─── Full-fetch stall recovery ─── */}
          {fetchStalled && (
            <div
              style={{
                background: "hsl(var(--color-danger) / 0.08)",
                border: "1px solid hsl(var(--color-danger) / 0.25)",
                borderRadius: "var(--radius-card)",
                padding: "16px 20px",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              <div className="flex items-center justify-center gap-2" style={{ marginBottom: 8 }}>
                <AlertCircle size={14} style={{ color: "hsl(var(--color-danger))", flexShrink: 0 }} />
                <p
                  className="font-body"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "hsl(var(--color-danger))",
                    margin: 0,
                  }}
                >
                  Report loading failed
                </p>
              </div>
              <p
                className="font-body text-muted-foreground"
                style={{
                  fontSize: 12,
                  margin: "0 0 12px 0",
                }}
              >
                Your identity was verified, but the full report didn't load. Tap below to retry.
              </p>
              <button
                onClick={onRetryFetchFull}
                className="btn-depth-gold flex items-center gap-1.5 mx-auto py-2.5 px-6 text-sm"
              >
                <RefreshCw size={14} />
                Tap to Retry
              </button>
              {onResend && (
                <button
                  onClick={onResend}
                  disabled={resendCooldown > 0}
                  className="font-body text-muted-foreground"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: resendCooldown > 0 ? "default" : "pointer",
                    fontSize: 12,
                    textDecoration: resendCooldown > 0 ? "none" : "underline",
                    textUnderlineOffset: 2,
                    marginTop: 8,
                    display: "block",
                    width: "100%",
                  }}
                >
                  {resendCooldown > 0
                    ? `Resend code (0:${String(resendCooldown).padStart(2, "0")})`
                    : "Resend code instead"}
                </button>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ═══ ENTER CODE (Step 2) ═══ */}
            {gateMode === "enter_code" && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="[&_input]:!bg-transparent [&_input]:!text-foreground">
                  <InputOTP maxLength={6} value={otpValue} onChange={onOtpChange} autoFocus>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="!border-border !bg-secondary !text-foreground !w-12 !h-14 !text-xl !font-bold"
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
                  className={`w-full max-w-[320px] h-[54px] text-[17px] font-extrabold flex items-center justify-center gap-2 ${
                    otpValue.length === 6 ? "btn-depth-gold" : "btn-depth-gold--pending"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Unlock Full Report"
                  )}
                </motion.button>

                {/* Resend + Wrong number */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={onResend}
                    disabled={resendCooldown > 0}
                    className="font-body text-muted-foreground"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: resendCooldown > 0 ? "default" : "pointer",
                      fontSize: 12,
                      textDecoration: resendCooldown > 0 ? "none" : "underline",
                      textUnderlineOffset: 2,
                    }}
                  >
                    {resendCooldown > 0
                      ? `Didn't get it? Resend (0:${String(resendCooldown).padStart(2, "0")})`
                      : "Didn't get it? Resend code"}
                  </button>
                  {onChangePhone && (
                    <button
                      onClick={onChangePhone}
                      className="font-body text-muted-foreground/70"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                      }}
                    >
                      Wrong number?
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ═══ SEND CODE (legacy fallback — phone already known) ═══ */}
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
                  className="btn-depth-gold w-full max-w-[320px] h-[54px] text-[17px] font-extrabold flex items-center justify-center gap-2"
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

            {/* ═══ ENTER PHONE (Step 1 — primary path) ═══ */}
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
                    className="font-mono text-muted-foreground"
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 14,
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
                    className="font-body text-foreground wm-input-well"
                    style={{
                      width: "100%",
                      height: 54,
                      border: phoneIsValid
                        ? "2px solid hsl(var(--color-gold-accent))"
                        : phoneDigitCount > 0
                          ? "2px solid hsl(var(--border))"
                          : "2px solid hsl(var(--border))",
                      padding: "0 16px 0 40px",
                      fontSize: 19,
                      fontWeight: 600,
                      textAlign: "center",
                      letterSpacing: "0.03em",
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                      boxShadow: phoneIsValid
                        ? "0 0 0 4px hsl(var(--color-gold-accent) / 0.15), 0 2px 12px rgba(0,0,0,0.1)"
                        : "0 2px 12px rgba(0,0,0,0.1)",
                      caretColor: "hsl(var(--color-gold-accent))",
                    }}
                  />
                  {phoneDigitCount > 0 && phoneDigitCount < 10 && (
                    <span
                      className="font-mono text-muted-foreground/70"
                      style={{
                        position: "absolute",
                        right: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 11,
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
                        color: "hsl(var(--color-gold-accent))",
                        fontSize: 16,
                      }}
                    >
                      ✓
                    </motion.span>
                  )}
                </div>

                {/* TCPA Consent Checkbox */}
                <label
                  className="flex items-start gap-2 cursor-pointer"
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    textAlign: "left",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={tcpaConsent}
                    onChange={(e) => onTcpaChange?.(e.target.checked)}
                    style={{
                      marginTop: 3,
                      accentColor: "hsl(var(--color-gold-accent))",
                      width: 16,
                      height: 16,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="font-body text-muted-foreground/70"
                    style={{
                      fontSize: 11,
                      lineHeight: 1.5,
                    }}
                  >
                    I agree to receive a one-time verification code via SMS. Msg & data rates may apply.
                  </span>
                </label>

                <motion.button
                  whileHover={canSubmitPhone ? { scale: 1.02, y: -1 } : {}}
                  whileTap={canSubmitPhone ? { scale: 0.97 } : {}}
                  onClick={onPhoneSubmit}
                  disabled={!canSubmitPhone}
                  className={`w-full max-w-[320px] h-[54px] text-[17px] font-extrabold flex items-center justify-center gap-2 ${
                    canSubmitPhone ? "btn-depth-gold" : "btn-depth-gold--pending"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending Code…
                    </>
                  ) : (
                    "Send Unlock Code"
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Trust micro-copy ─── */}
          <p
            className="font-mono text-muted-foreground/70"
            style={{
              fontSize: 11,
              marginTop: 16,
              letterSpacing: "0.04em",
              lineHeight: 1.5,
            }}
          >
            Unlock Report + Your Free Review
          </p>
        </motion.div>
      </div>
    </div>
  );
}
