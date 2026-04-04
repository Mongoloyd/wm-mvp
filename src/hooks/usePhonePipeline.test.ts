import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePhonePipeline } from "./usePhonePipeline";

const { mockInvoke, mockUsePhoneInput } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockUsePhoneInput: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

vi.mock("@/hooks/usePhoneInput", () => ({
  usePhoneInput: mockUsePhoneInput,
}));

vi.mock("@/lib/trackEvent", () => ({
  trackEvent: vi.fn(),
}));

describe("usePhonePipeline resend cooldown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePhoneInput.mockReturnValue({
      displayValue: "(305) 555-1234",
      rawDigits: "3055551234",
      e164: "+13055551234",
      isValid: true,
      handleChange: vi.fn(),
      setValue: vi.fn(),
    });
    mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
  });

  it("sets a user-facing message when resend is blocked by cooldown", async () => {
    const { result } = renderHook(() =>
      usePhonePipeline("validate_and_send_otp", { externalPhoneE164: "+13055551234" })
    );

    await act(async () => {
      await result.current.resend();
    });

    let blockedResult: Awaited<ReturnType<typeof result.current.resend>> | null = null;
    await act(async () => {
      blockedResult = await result.current.resend();
    });

    expect(blockedResult?.status).toBe("blocked");
    expect(result.current.errorMsg).toBe("Please wait before requesting another code.");
  });
});

describe("usePhonePipeline submitOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePhoneInput.mockReturnValue({
      displayValue: "(305) 555-1234",
      rawDigits: "3055551234",
      e164: "+13055551234",
      isValid: true,
      handleChange: vi.fn(),
      setValue: vi.fn(),
    });
  });

  it("returns a verified result and calls onVerified on success", async () => {
    const onVerified = vi.fn();
    mockInvoke.mockResolvedValue({
      data: { verified: true, phone_e164: "+13055550000" },
      error: null,
    });

    const { result } = renderHook(() =>
      usePhonePipeline("validate_and_send_otp", {
        externalPhoneE164: "+13055551234",
        scanSessionId: "session_abc",
        onVerified,
      })
    );

    let verifyResult: Awaited<ReturnType<typeof result.current.submitOtp>> | null = null;
    await act(async () => {
      verifyResult = await result.current.submitOtp("123456");
    });

    expect(mockInvoke).toHaveBeenCalledWith("verify-otp", {
      body: {
        phone_e164: "+13055551234",
        code: "123456",
        scan_session_id: "session_abc",
      },
    });
    expect(verifyResult).toEqual({
      status: "verified",
      e164: "+13055550000",
    });
    expect(result.current.phoneStatus).toBe("verified");
    expect(onVerified).toHaveBeenCalledTimes(1);
  });

  it("returns a controlled invalid_code result on invalid OTP", async () => {
    const errorContextJson = vi.fn().mockResolvedValue({
      error: "Invalid verification code",
    });

    mockInvoke.mockResolvedValue({
      data: null,
      error: {
        context: {
          status: 400,
          json: errorContextJson,
        },
      },
    });

    const { result } = renderHook(() =>
      usePhonePipeline("validate_and_send_otp", {
        externalPhoneE164: "+13055551234",
        scanSessionId: "session_abc",
      })
    );

    let verifyResult: Awaited<ReturnType<typeof result.current.submitOtp>> | null = null;
    await act(async () => {
      verifyResult = await result.current.submitOtp("000000");
    });

    expect(verifyResult).toEqual({
      status: "invalid_code",
      error: "Invalid verification code",
    });
    expect(result.current.phoneStatus).toBe("otp_sent");
    expect(result.current.errorMsg).toBe("Invalid verification code");
    expect(result.current.errorType).toBe("invalid_code");
    expect(errorContextJson).toHaveBeenCalledTimes(1);
  });

  it("always includes phone and scan session context in the verify payload", async () => {
    mockInvoke.mockResolvedValue({
      data: { verified: true, phone_e164: "+13055551234" },
      error: null,
    });

    const { result } = renderHook(() =>
      usePhonePipeline("validate_and_send_otp", {
        externalPhoneE164: "+13055551234",
        scanSessionId: "session_xyz",
      })
    );

    await act(async () => {
      await result.current.submitOtp("123456");
    });

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke.mock.calls[0]).toEqual([
      "verify-otp",
      {
        body: {
          phone_e164: "+13055551234",
          code: "123456",
          scan_session_id: "session_xyz",
        },
      },
    ]);
  });

  it("returns a controlled error without calling verify-otp when the code is incomplete", async () => {
    const { result } = renderHook(() =>
      usePhonePipeline("validate_and_send_otp", {
        externalPhoneE164: "+13055551234",
        scanSessionId: "session_abc",
      })
    );

    let verifyResult: Awaited<ReturnType<typeof result.current.submitOtp>> | null = null;
    await act(async () => {
      verifyResult = await result.current.submitOtp("12345");
    });

    expect(verifyResult).toEqual({
      status: "error",
      error: "Enter the full 6-digit code.",
    });
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
