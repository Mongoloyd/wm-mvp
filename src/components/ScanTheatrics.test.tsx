import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import ScanTheatrics from "./ScanTheatrics";

const { mockUseScanPolling, mockUseScanFunnelSafe, mockUsePhonePipeline } = vi.hoisted(() => ({
  mockUseScanPolling: vi.fn(),
  mockUseScanFunnelSafe: vi.fn(),
  mockUsePhonePipeline: vi.fn(),
}));

vi.mock("@/hooks/useScanPolling", () => ({
  ScanStatus: {},
  useScanPolling: mockUseScanPolling,
}));

vi.mock("@/state/scanFunnel", () => ({
  useScanFunnelSafe: mockUseScanFunnelSafe,
}));

vi.mock("@/hooks/usePhonePipeline", () => ({
  usePhonePipeline: mockUsePhonePipeline,
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("ScanTheatrics OTP auto-send", () => {
  let funnelState: any;
  let submitPhoneMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));

    funnelState = {
      phoneE164: "+13055551234",
      phoneStatus: "screened_valid",
      scanSessionId: "scan-1",
      setPhoneStatus: vi.fn((status: string) => {
        funnelState.phoneStatus = status;
      }),
    };

    submitPhoneMock = vi.fn().mockResolvedValue({ status: "otp_sent", e164: "+13055551234" });
    mockUseScanPolling.mockReturnValue({ status: "preview_ready", error: null });
    mockUseScanFunnelSafe.mockImplementation(() => funnelState);
    mockUsePhonePipeline.mockReturnValue({
      submitPhone: submitPhoneMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fires auto-send once when active with phone+session and marks sending->otp_sent", async () => {
    render(<ScanTheatrics isActive scanSessionId="scan-1" />);

    await waitFor(() => {
      expect(submitPhoneMock).toHaveBeenCalledTimes(1);
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("sending_otp");
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("otp_sent");
    });
  });

  it("does not auto-send when theatrics is inactive/hidden", async () => {
    render(<ScanTheatrics isActive={false} scanSessionId="scan-1" />);
    await Promise.resolve();
    expect(submitPhoneMock).not.toHaveBeenCalled();
  });

  it("does not lose otp_sent transition when rerender happens during sending_otp", async () => {
    let resolveSend: ((value: { status: "otp_sent"; e164: string }) => void) | null = null;
    submitPhoneMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        })
    );

    const { rerender } = render(<ScanTheatrics isActive scanSessionId="scan-1" />);

    await waitFor(() => expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("sending_otp"));
    rerender(<ScanTheatrics isActive scanSessionId="scan-1" />);

    resolveSend?.({ status: "otp_sent", e164: "+13055551234" });
    await waitFor(() => expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("otp_sent"));
  });

  it("preserves sending_otp on unmount cancellation (no rollback to screened_valid)", async () => {
    submitPhoneMock.mockImplementationOnce(() => new Promise(() => {}));
    const { unmount } = render(<ScanTheatrics isActive scanSessionId="scan-1" />);

    await waitFor(() => expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("sending_otp"));
    unmount();

    expect(funnelState.setPhoneStatus).not.toHaveBeenCalledWith("screened_valid");
  });

  it("does not auto-send before quote is classified as valid", async () => {
    mockUseScanPolling.mockReturnValueOnce({ status: "processing", error: null });
    render(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await Promise.resolve();
    expect(submitPhoneMock).not.toHaveBeenCalled();
  });

  it("does not auto-send for invalid quote classification", async () => {
    mockUseScanPolling.mockReturnValueOnce({ status: "invalid_document", error: null });
    render(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await Promise.resolve();
    expect(submitPhoneMock).not.toHaveBeenCalled();
  });

  it("does not auto-send when phone is not screened_valid", async () => {
    funnelState.phoneStatus = "none";
    render(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await Promise.resolve();
    expect(submitPhoneMock).not.toHaveBeenCalled();
  });

  it("does not duplicate auto-send on rerender for same session+phone key", async () => {
    const { rerender } = render(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(1));
    rerender(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(1));
  });

  it("marks send_failed on failure and does not infinite-retry on rerender", async () => {
    submitPhoneMock.mockResolvedValueOnce({ status: "error" });
    const { rerender } = render(<ScanTheatrics isActive scanSessionId="scan-1" />);

    await waitFor(() => {
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("sending_otp");
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("send_failed");
      expect(submitPhoneMock).toHaveBeenCalledTimes(1);
    });

    rerender(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(1));
  });

  it("allows fresh auto-send when phone or session changes", async () => {
    const { rerender } = render(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(1));

    funnelState.phoneE164 = "+14075550199";
    funnelState.phoneStatus = "screened_valid";
    rerender(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(2));

    funnelState.phoneStatus = "screened_valid";
    rerender(<ScanTheatrics isActive scanSessionId="scan-2" />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(3));
  });

  it("writes otp_sent to shared funnel after unmount instead of staying stuck in sending_otp", async () => {
    // Deferred promise we control — simulates in-flight OTP send
    let resolveOtp!: (val: { status: string; e164: string }) => void;
    submitPhoneMock.mockImplementationOnce(
      () => new Promise((resolve) => { resolveOtp = resolve; })
    );

    const { unmount } = render(<ScanTheatrics isActive scanSessionId="scan-1" />);

    await waitFor(() => {
      expect(submitPhoneMock).toHaveBeenCalledTimes(1);
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("sending_otp");
    });

    // Unmount before OTP promise resolves (simulates handoff to PostScan)
    unmount();

    // Resolve OTP send *after* unmount
    resolveOtp({ status: "otp_sent", e164: "+13055551234" });
    await waitFor(() => {
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("otp_sent");
    });
  });

  it("writes send_failed to shared funnel after unmount on OTP error", async () => {
    let rejectOtp!: (err: Error) => void;
    submitPhoneMock.mockImplementationOnce(
      () => new Promise((_, reject) => { rejectOtp = reject; })
    );

    const { unmount } = render(<ScanTheatrics isActive scanSessionId="scan-1" />);

    await waitFor(() => {
      expect(submitPhoneMock).toHaveBeenCalledTimes(1);
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("sending_otp");
    });

    unmount();

    // Reject after unmount
    rejectOtp(new Error("network failure"));
    await waitFor(() => {
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("send_failed");
    });
  });
});
