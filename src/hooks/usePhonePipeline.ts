/**
 * usePhonePipeline — Shared hook for all phone-bearing forms.
 *
 * Two modes:
 *   validate_only        — screen + normalize, no OTP
 *   validate_and_send_otp — screen + normalize + call send-otp
 *
 * Also supports:
 *   submitOtp()           — verify a 6-digit code against verify-otp
 *   resend()              — re-send OTP with cooldown
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { usePhoneInput } from "@/hooks/usePhoneInput";
import { screenPhone } from "@/utils/screenPhone";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/trackEvent";

/* ── Types ─────────────────────────────────────────────── */

export type PipelineMode = "validate_only" | "validate_and_send_otp";

export type PhoneStatus =
  | "idle"
  | "screening"
  | "invalid"
  | "valid"
  | "sending_otp"
  | "otp_sent"
  | "otp_failed"
  | "verifying"
  | "verified"
  | "error";

export type ErrorType = "rate_limit" | "blocked_prefix" | "expired_session" | "invalid_code" | "network" | "generic";

export interface PipelineStartResult {
  status: "valid" | "otp_sent" | "already_verified" | "blocked" | "error";
  e164?: string;
  error?: string;
}

export interface PipelineVerifyResult {
  status: "verified" | "invalid_code" | "expired" | "error";
  error?: string;
  /** Server-canonical phone in E.164 format, returned on successful verify */
  e164?: string;
}

export interface UsePhonePipelineReturn {
  /** Formatted display value for the input */
  displayValue: string;
  /** Raw digits */
  rawDigits: string;
  /** E.164 or null */
  e164: string | null;
  /** Whether raw input has 10 valid digits */
  inputComplete: boolean;
  /** Current pipeline status */
  phoneStatus: PhoneStatus;
  /** Human-readable error message (empty if none) */
  errorMsg: string;
  /** Classifies the error for richer UX */
  errorType: ErrorType | null;
  /** Resend cooldown in seconds (0 = can resend) */
  resendCooldown: number;
  /** onChange handler for phone input */
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Submit phone through the pipeline */
  submitPhone: () => Promise<PipelineStartResult>;
  /** Submit a 6-digit OTP code */
  submitOtp: (code: string) => Promise<PipelineVerifyResult>;
  /** Resend OTP (respects cooldown) */
  resend: () => Promise<PipelineStartResult>;
  /** Reset pipeline to idle */
  reset: () => void;
}

/* ── Constants ─────────────────────────────────────────── */

const RESEND_COOLDOWN_SECONDS = 30;

/* ── Hook ──────────────────────────────────────────────── */

export function usePhonePipeline(
  mode: PipelineMode,
  options?: {
    scanSessionId?: string | null;
    onVerified?: () => void;
    /** Pre-known phone from upstream (e.g. ScanFunnelContext). When set,
     *  submitOtp / resend / submitPhone use this instead of local input. */
    externalPhoneE164?: string | null;
  }
): UsePhonePipelineReturn {
  const { displayValue, rawDigits, e164, isValid, handleChange, setValue } =
    usePhoneInput();

  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingRef = useRef(false);

  /**
   * The single source of truth for the phone number used by all actions.
   * Priority: external funnel phone > local input phone.
   */
  const activePhone = options?.externalPhoneE164 || e164;

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear error when user types
  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (errorMsg) { setErrorMsg(""); setErrorType(null); }
      if (phoneStatus === "invalid") setPhoneStatus("idle");
      handleChange(e);
    },
    [handleChange, errorMsg, phoneStatus]
  );

  /* ── submitPhone ─────────────────────────────────────── */

  const submitPhone = useCallback(async (): Promise<PipelineStartResult> => {
    // Guard against double-send race: if a send is already in-flight, bail out
    if (isSendingRef.current) {
      console.warn("[usePhonePipeline] submitPhone blocked — send already in-flight");
      return { status: "error", error: "Already sending. Please wait." };
    }
    setErrorMsg(""); setErrorType(null);

    // If we have an external phone, skip local screening entirely
    const hasExternal = !!options?.externalPhoneE164;
    let normalizedE164: string;

    if (hasExternal) {
      normalizedE164 = options!.externalPhoneE164!;
    } else {
      // Screen local input
      const screen = screenPhone(rawDigits);
      if (screen.ok === false) {
        setPhoneStatus("invalid");
        setErrorMsg(screen.reason);
        setErrorType("generic");
        return { status: "blocked", error: screen.reason };
      }
      normalizedE164 = screen.e164;
    }

    // validate_only — done
    if (mode === "validate_only") {
      setPhoneStatus("valid");
      return { status: "valid", e164: normalizedE164 };
    }

    // validate_and_send_otp — call send-otp
    isSendingRef.current = true;
    setPhoneStatus("sending_otp");
    console.log("[usePhonePipeline] submitPhone → calling send-otp", { phone: normalizedE164 });
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          phone_e164: normalizedE164,
          scan_session_id: options?.scanSessionId || undefined,
        },
      });

      // supabase.functions.invoke puts the body in `error` for non-2xx responses
      if (error) {
        let parsedMsg = "Failed to send verification code.";
        let classifiedType: ErrorType = "generic";
        try {
          if (error.context && typeof error.context.json === "function") {
            const body = await error.context.json();
            console.error("[usePhonePipeline] send-otp non-2xx response body:", body);
            parsedMsg = body?.error || parsedMsg;
            // Detect specific Twilio error types
            if (body?.twilio_code === 60410 || parsedMsg.toLowerCase().includes("blocked by our carrier")) {
              classifiedType = "blocked_prefix";
            } else if (error.context.status === 429 || parsedMsg.toLowerCase().includes("too many")) {
              classifiedType = "rate_limit";
            }
          } else {
            console.error("[usePhonePipeline] send-otp error (no context):", error);
          }
        } catch { console.error("[usePhonePipeline] send-otp error (unparseable):", error); }
        setPhoneStatus("otp_failed");
        setErrorMsg(parsedMsg);
        setErrorType(classifiedType);
        trackEvent({ event_name: classifiedType === "rate_limit" ? "rate_limit_hit" : "otp_send_failed", session_id: options?.scanSessionId, metadata: { error_type: classifiedType, error_msg: parsedMsg } });
        return { status: "error", error: parsedMsg };
      }

      if (!data?.success) {
        const msg = data?.error || "Failed to send verification code.";
        console.error("[usePhonePipeline] send-otp returned success=false:", data);
        setPhoneStatus("otp_failed");
        setErrorMsg(msg);
        setErrorType("generic");
        return { status: "error", error: msg };
      }

      console.log("[usePhonePipeline] send-otp SUCCESS");
      setPhoneStatus("otp_sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      trackEvent({ event_name: "otp_sent", session_id: options?.scanSessionId, metadata: { phone_last4: normalizedE164.slice(-4) } });
      return { status: "otp_sent", e164: normalizedE164 };
    } catch (err) {
      console.error("[usePhonePipeline] send-otp network exception:", err);
      const msg = "Network error. Check your connection and try again.";
      setPhoneStatus("otp_failed");
      setErrorMsg(msg);
      setErrorType("network");
      return { status: "error", error: msg };
    } finally {
      isSendingRef.current = false;
    }
  }, [rawDigits, mode, options?.externalPhoneE164]);

  /* ── submitOtp ───────────────────────────────────────── */

  const isVerifyingRef = useRef(false);

  const submitOtp = useCallback(
    async (code: string): Promise<PipelineVerifyResult> => {
      if (code.length < 6 || !activePhone) {
        return { status: "error", error: "Enter the full 6-digit code." };
      }
      if (isVerifyingRef.current) {
        console.warn("[usePhonePipeline] submitOtp suppressed — already in flight");
        return { status: "error", error: "Already verifying." };
      }
      isVerifyingRef.current = true;

      setPhoneStatus("verifying");
      setErrorMsg(""); setErrorType(null);

      console.log("[usePhonePipeline] submitOtp → calling verify-otp", {
        phone: activePhone, code, scanSessionId: options?.scanSessionId,
      });
      try {
        const { data, error } = await supabase.functions.invoke("verify-otp", {
          body: {
            phone_e164: activePhone,
            code,
            scan_session_id: options?.scanSessionId || undefined,
          },
        });

        // supabase.functions.invoke puts the body in `error` for non-2xx responses
        if (error) {
          let parsedMsg = "Invalid or expired code.";
          let classifiedType: ErrorType = "invalid_code";
          try {
            if (error.context && typeof error.context.json === "function") {
              const body = await error.context.json();
              console.error("[usePhonePipeline] verify-otp non-2xx response body:", body);
              parsedMsg = body?.error || parsedMsg;
              // Detect expired session (Twilio 20404)
              if (parsedMsg.toLowerCase().includes("expired") || parsedMsg.toLowerCase().includes("not found")) {
                classifiedType = "expired_session";
              }
            } else {
              console.error("[usePhonePipeline] verify-otp error (no context):", error);
            }
          } catch { console.error("[usePhonePipeline] verify-otp error (unparseable):", error); }
          setPhoneStatus("otp_sent"); // allow retry
          setErrorMsg(parsedMsg);
          setErrorType(classifiedType);
          trackEvent({ event_name: "otp_error", session_id: options?.scanSessionId, metadata: { error_type: classifiedType, error_msg: parsedMsg } });
          return { status: "invalid_code", error: parsedMsg };
        }

        if (!data?.verified) {
          const msg = data?.error || "Invalid or expired code.";
          console.error("[usePhonePipeline] verify-otp returned verified=false:", data);
          setPhoneStatus("otp_sent"); // allow retry
          setErrorMsg(msg);
          setErrorType("invalid_code");
          trackEvent({ event_name: "otp_error", session_id: options?.scanSessionId, metadata: { error_type: "invalid_code", error_msg: msg } });
          return { status: "invalid_code", error: msg };
        }

        // Use server-returned canonical phone if available, otherwise fall back to local
        const canonicalPhone = data?.phone_e164 || activePhone;
        console.log("[usePhonePipeline] verify-otp SUCCESS — canonical phone:", canonicalPhone);
        setPhoneStatus("verified");
        trackEvent({ event_name: "otp_verified", session_id: options?.scanSessionId, metadata: { phone_last4: canonicalPhone.slice(-4) } });
        options?.onVerified?.();
        return { status: "verified", e164: canonicalPhone };
      } catch (err) {
        console.error("[usePhonePipeline] verify-otp network exception:", err);
        const msg = "Network error. Check your connection and try again.";
        setPhoneStatus("otp_sent");
        setErrorMsg(msg);
        setErrorType("network");
        return { status: "error", error: msg };
      } finally {
        isVerifyingRef.current = false;
      }
    },
    [activePhone, options]
  );

  /* ── resend ──────────────────────────────────────────── */

  const resend = useCallback(async (resendOptions?: { scanSessionId?: string | null }): Promise<PipelineStartResult> => {
    if (cooldown > 0 || !activePhone) {
      const msg = "Please wait before requesting another code.";
      setErrorMsg(msg);
      setErrorType("generic");
      return { status: "blocked", error: msg };
    }
    setErrorMsg(""); setErrorType(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);

    try {
      setPhoneStatus("sending_otp");
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          phone_e164: activePhone,
          scan_session_id: resendOptions?.scanSessionId || options?.scanSessionId || undefined,
        },
      });

      if (error) {
        let parsedMsg = "Failed to resend code.";
        let classifiedType: ErrorType = "generic";
        try {
          if (error.context && typeof error.context.json === "function") {
            const body = await error.context.json();
            console.error("[usePhonePipeline] resend non-2xx response body:", body);
            parsedMsg = body?.error || parsedMsg;
            if (body?.twilio_code === 60410 || parsedMsg.toLowerCase().includes("blocked by our carrier")) {
              classifiedType = "blocked_prefix";
            } else if (error.context.status === 429 || parsedMsg.toLowerCase().includes("too many")) {
              classifiedType = "rate_limit";
            }
          } else {
            console.error("[usePhonePipeline] resend error (no context):", error);
          }
        } catch { console.error("[usePhonePipeline] resend error (unparseable):", error); }
        setErrorMsg(parsedMsg);
        setErrorType(classifiedType);
        setPhoneStatus("otp_failed");
        setCooldown(0);
        return { status: "error", error: parsedMsg };
      }

      if (!data?.success) {
        const msg = data?.error || "Failed to resend code.";
        setErrorMsg(msg);
        setErrorType("generic");
        setPhoneStatus("otp_failed");
        setCooldown(0);
        return { status: "error", error: msg };
      }

      setPhoneStatus("otp_sent");
      return { status: "otp_sent", e164: activePhone };
    } catch {
      const msg = "Network error. Please try again.";
      setErrorMsg(msg);
      setErrorType("network");
      setPhoneStatus("otp_failed");
      setCooldown(0);
      return { status: "error", error: msg };
    }
  }, [cooldown, activePhone, options?.scanSessionId]);

  /* ── reset ───────────────────────────────────────────── */

  const reset = useCallback(() => {
    setValue("");
    setPhoneStatus("idle");
    setErrorMsg("");
    setErrorType(null);
    setCooldown(0);
  }, [setValue]);

  return {
    displayValue,
    rawDigits,
    e164,
    inputComplete: isValid,
    phoneStatus,
    errorMsg,
    errorType,
    resendCooldown: cooldown,
    handlePhoneChange,
    submitPhone,
    submitOtp,
    resend,
    reset,
  };
}
