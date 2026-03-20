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

export interface PipelineStartResult {
  status: "valid" | "otp_sent" | "already_verified" | "blocked" | "error";
  e164?: string;
  error?: string;
}

export interface PipelineVerifyResult {
  status: "verified" | "invalid_code" | "expired" | "error";
  error?: string;
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
  /** Resend cooldown in seconds (0 = can resend) */
  resendCooldown: number;
  /** onChange handler for phone input */
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Submit phone through the pipeline */
  submitPhone: () => Promise<PipelineStartResult>;
  /** Submit a 6-digit OTP code */
  submitOtp: (code: string) => Promise<PipelineVerifyResult>;
  /** Resend OTP (respects cooldown) */
  resend: () => Promise<void>;
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
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      if (errorMsg) setErrorMsg("");
      if (phoneStatus === "invalid") setPhoneStatus("idle");
      handleChange(e);
    },
    [handleChange, errorMsg, phoneStatus]
  );

  /* ── submitPhone ─────────────────────────────────────── */

  const submitPhone = useCallback(async (): Promise<PipelineStartResult> => {
    setErrorMsg("");

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
    setPhoneStatus("sending_otp");
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone_e164: normalizedE164 },
      });

      if (error || !data?.success) {
        const msg = data?.error || "Failed to send verification code.";
        setPhoneStatus("otp_failed");
        setErrorMsg(msg);
        return { status: "error", error: msg };
      }

      setPhoneStatus("otp_sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      return { status: "otp_sent", e164: normalizedE164 };
    } catch {
      const msg = "Network error. Please try again.";
      setPhoneStatus("otp_failed");
      setErrorMsg(msg);
      return { status: "error", error: msg };
    }
  }, [rawDigits, mode, options?.externalPhoneE164]);

  /* ── submitOtp ───────────────────────────────────────── */

  const submitOtp = useCallback(
    async (code: string): Promise<PipelineVerifyResult> => {
      if (code.length < 6 || !activePhone) {
        return { status: "error", error: "Enter the full 6-digit code." };
      }

      setPhoneStatus("verifying");
      setErrorMsg("");

      try {
        const { data, error } = await supabase.functions.invoke("verify-otp", {
          body: {
            phone_e164: activePhone,
            code,
            scan_session_id: options?.scanSessionId || undefined,
          },
        });

        if (error || !data?.verified) {
          const msg = data?.error || "Invalid or expired code.";
          setPhoneStatus("otp_sent"); // allow retry
          setErrorMsg(msg);
          return { status: "invalid_code", error: msg };
        }

        setPhoneStatus("verified");
        options?.onVerified?.();
        return { status: "verified" };
      } catch {
        const msg = "Network error. Please try again.";
        setPhoneStatus("otp_sent");
        setErrorMsg(msg);
        return { status: "error", error: msg };
      }
    },
    [activePhone, options]
  );

  /* ── resend ──────────────────────────────────────────── */

  const resend = useCallback(async () => {
    if (cooldown > 0 || !activePhone) return;
    setErrorMsg("");
    setCooldown(RESEND_COOLDOWN_SECONDS);

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone_e164: activePhone },
      });
      if (error || !data?.success) {
        setErrorMsg(data?.error || "Failed to resend code.");
        setCooldown(0);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setCooldown(0);
    }
  }, [cooldown, activePhone]);

  /* ── reset ───────────────────────────────────────────── */

  const reset = useCallback(() => {
    setValue("");
    setPhoneStatus("idle");
    setErrorMsg("");
    setCooldown(0);
  }, [setValue]);

  return {
    displayValue,
    rawDigits,
    e164,
    inputComplete: isValid,
    phoneStatus,
    errorMsg,
    resendCooldown: cooldown,
    handlePhoneChange,
    submitPhone,
    submitOtp,
    resend,
    reset,
  };
}
