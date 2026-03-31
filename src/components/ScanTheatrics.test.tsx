import { describe, it, expect, vi, beforeEach } from "vitest";
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
      phoneStatus: "none",
      scanSessionId: "scan-1",
      setPhoneStatus: vi.fn((status: string) => {
        funnelState.phoneStatus = status;
      }),
    };

    submitPhoneMock = vi.fn().mockResolvedValue({ status: "otp_sent", e164: "+13055551234" });
    mockUseScanPolling.mockReturnValue({ status: "processing", error: null });
    mockUseScanFunnelSafe.mockImplementation(() => funnelState);
    mockUsePhonePipeline.mockReturnValue({
      submitPhone: submitPhoneMock,
    });
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
    await waitFor(() => {
      expect(submitPhoneMock).toHaveBeenCalledTimes(0);
    });
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
    rerender(<ScanTheatrics isActive scanSessionId="scan-1" />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(2));

    rerender(<ScanTheatrics isActive scanSessionId="scan-2" />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(3));
  });
});
