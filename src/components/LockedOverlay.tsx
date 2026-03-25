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
  const header =
    gateMode === "enter_phone"
      ? "Unlock Your Full Report"
      : "Enter Your Secure Code";

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
    gateMode === "enter_phone"
      ? 50 + (phoneDigitCount / 10) * 40
      : gateMode === "send_code"
        ? 85
        : 95;

  const stepLabel =
    gateMode === "enter_code" ? "STEP 2 OF 2" : "STEP 1 OF 2";
  const stepHint =
    gateMode === "enter_code" ? "FINAL STEP" : "ALMOST THERE";

  const canSubmitPhone = phoneIsValid && tcpaConsent && !isLoading;

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
              background: "#FFFFFF",
              border: "1.5px solid #FCA5A5",
              borderLeft: "4px solid #DC2626",
              borderRadius: 8,
              padding: "20px 20px 20px 24px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: "rgba(220,38,38,0.12)",
                borderRadius: 4,
                padding: "3px 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 700,
                color: "#DC2626",
              }}
            >
              ⚠ CRITICAL
            </span>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 17,
                fontWeight: 700,
                color: "#0F172A",
                marginTop: 8,
              }}
            >
              ██████████ ██████
            </p>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14,
                color: "#334155",
                marginTop: 6,
              }}
            >
              ████████ ██████ ████████ ██████████ ██████.
            </p>
          </div>
        ))}
      </div>

      {/* Gate overlay - Holographic Dark Glass */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          background: "rgba(15, 23, 42, 0.90)",
          borderRadius: 8,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            borderRadius: 16,
            padding: "28px 32px 32px",
            textAlign: "center",
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,149,42,0.2) inset, 0 1px 0 rgba(255,255,255,0.05) inset",
            border: "1px solid rgba(200,149,42,0.3)",
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
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "#B45309",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                {stepLabel}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "#64748B",
                  letterSpacing: "0.06em",
                }}
              >
                {stepHint}
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 4,
                background: "#E2E8F0",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" as const }}
                style={{
                  height: "100%",
                  borderRadius: 4,
                  background: "linear-gradient(90deg, #D97706, #F59E0B)",
                  boxShadow: "0 0 8px rgba(217,119,6,0.4)",
                }}
              />
            </div>
          </div>

          {/* ─── Lock icon + headline ─── */}
          <div style={{ marginBottom: 6 }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "#E2B04A",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              🔒 VERIFICATION REQUIRED
            </p>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
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
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14,
                color: "#CBD5E1",
                marginBottom: 4,
              }}
            >
              {subtext[0]}
            </p>
            <p
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14,
                color: "#CBD5E1",
                marginBottom: 20,
              }}
            >
              {subtext[1]}
            </p>
          </div>

          {/* ─── Error message with contextual recovery ─── */}
          {errorMsg && (
            <div style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 6,
              padding: "12px 16px",
              marginBottom: 12,
              textAlign: "center",
            }}>
              <div className="flex items-center justify-center gap-2" style={{ marginBottom: 4 }}>
                {errorType === "rate_limit" ? (
                  <Clock size={14} style={{ color: "#F59E0B", flexShrink: 0 }} />
                ) : (
                  <AlertCircle size={14} style={{ color: "#DC2626", flexShrink: 0 }} />
                )}
                <p style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: errorType === "rate_limit" ? "#F59E0B" : "#DC2626",
                  margin: 0,
                }}>
                  {errorMsg}
                </p>
              </div>

              {/* Recovery action based on error type */}
              {errorType === "expired_session" && gateMode === "enter_code" && (
                <button
                  onClick={onResend}
                  disabled={resendCooldown > 0}
                  className="flex items-center gap-1.5 mx-auto"
                  style={{
                    marginTop: 8,
                    background: "rgba(200,149,42,0.15)",
                    border: "1px solid rgba(200,149,42,0.3)",
                    borderRadius: 0,
                    padding: "6px 14px",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#E2B04A",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <RefreshCw size={12} />
                  {resendCooldown > 0 ? `Wait ${resendCooldown}s` : "Request New Code"}
                </button>
              )}

              {errorType === "network" && (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "#94A3B8",
                  marginTop: 6,
                  margin: 0,
                }}>
                  Check your connection and try again.
                </p>
              )}

              {errorType === "rate_limit" && (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "#94A3B8",
                  marginTop: 6,
                  margin: 0,
                }}>
                  This protects your phone from abuse. The limit resets shortly.
                </p>
              )}
            </div>
          )}

          {/* ─── Full-fetch stall recovery ─── */}
          {fetchStalled && (
            <div style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 0,
              padding: "16px 20px",
              marginBottom: 12,
              textAlign: "center",
            }}>
              <div className="flex items-center justify-center gap-2" style={{ marginBottom: 8 }}>
                <AlertCircle size={14} style={{ color: "#DC2626", flexShrink: 0 }} />
                <p style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#DC2626",
                  margin: 0,
                }}>
                  Report loading failed
                </p>
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: "#94A3B8",
                margin: "0 0 12px 0",
              }}>
                Your identity was verified, but the full report didn't load. Tap below to retry.
              </p>
              <button
                onClick={onRetryFetchFull}
                className="flex items-center gap-1.5 mx-auto"
                style={{
                  background: "linear-gradient(135deg, #C8952A, #E2B04A)",
                  border: "none",
                  borderRadius: 0,
                  padding: "10px 24px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "white",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(200,149,42,0.3)",
                }}
              >
                <RefreshCw size={14} />
                Tap to Retry
              </button>
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
                <div className="[&_input]:!bg-transparent [&_input]:!text-white">
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
                          className="!border-amber-700/40 !bg-slate-800/50 !text-white !w-12 !h-14 !text-xl !font-bold"
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
                    fontFamily: "'Inter', system-ui, sans-serif",
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
                    "Unlock Full Report"
                  )}
                </motion.button>

                {/* Resend + Wrong number */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={onResend}
                    disabled={resendCooldown > 0}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: resendCooldown > 0 ? "default" : "pointer",
                      fontFamily: "'Inter', system-ui, sans-serif",
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
                  {onChangePhone && (
                    <button
                      onClick={onChangePhone}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: 12,
                        color: "#64748B",
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
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: 54,
                    background:
                      "linear-gradient(135deg, #C8952A 0%, #E2B04A 50%, #C8952A 100%)",
                    backgroundSize: "200% 100%",
                    color: "white",
                    fontFamily: "'Inter', system-ui, sans-serif",
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
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontFamily: "var(--font-mono)",
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
                      background: "rgba(30, 41, 59, 0.5)",
                      border: phoneIsValid
                        ? "2px solid #C8952A"
                        : phoneDigitCount > 0
                          ? "2px solid rgba(200,149,42,0.3)"
                          : "2px solid rgba(200,149,42,0.2)",
                      borderRadius: 8,
                      padding: "0 16px 0 40px",
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: 19,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      textAlign: "center",
                      letterSpacing: "0.03em",
                      outline: "none",
                      transition:
                        "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                      boxShadow: phoneIsValid
                        ? "0 0 0 4px rgba(200,149,42,0.2), 0 2px 12px rgba(0,0,0,0.3)"
                        : "0 2px 12px rgba(0,0,0,0.3)",
                      caretColor: "#E2B04A",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.background = "rgba(30, 41, 59, 0.7)";
                      setTimeout(() => {
                        e.currentTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 300);
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = "rgba(30, 41, 59, 0.5)";
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
                      accentColor: "#C8952A",
                      width: 16,
                      height: 16,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontSize: 11,
                      color: "#64748B",
                      lineHeight: 1.5,
                    }}
                  >
                    I agree to receive a one-time verification code via SMS.
                    Msg & data rates may apply. No marketing texts.
                  </span>
                </label>

                <motion.button
                  whileHover={canSubmitPhone ? { scale: 1.02, y: -1 } : {}}
                  whileTap={canSubmitPhone ? { scale: 0.97 } : {}}
                  onClick={onPhoneSubmit}
                  disabled={!canSubmitPhone}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: 54,
                    background: canSubmitPhone
                      ? "linear-gradient(135deg, #C8952A 0%, #E2B04A 50%, #C8952A 100%)"
                      : "rgba(200,149,42,0.2)",
                    backgroundSize: "200% 100%",
                    color: canSubmitPhone ? "white" : "rgba(255,255,255,0.4)",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 17,
                    fontWeight: 800,
                    borderRadius: 0,
                    border: canSubmitPhone
                      ? "1px solid rgba(226,176,74,0.3)"
                      : "1px solid transparent",
                    cursor: canSubmitPhone ? "pointer" : "not-allowed",
                    boxShadow: canSubmitPhone
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
                    "Send Unlock Code"
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
