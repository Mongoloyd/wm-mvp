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
