import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { PostScanReportSwitcher } from "./PostScanReportSwitcher";

const { mockUseReportAccess, mockUseScanFunnelSafe, mockUsePhonePipeline } = vi.hoisted(() => ({
  mockUseReportAccess: vi.fn(),
  mockUseScanFunnelSafe: vi.fn(),
  mockUsePhonePipeline: vi.fn(),
}));

vi.mock("@/hooks/useReportAccess", () => ({
  useReportAccess: mockUseReportAccess,
}));

vi.mock("@/state/scanFunnel", () => ({
  useScanFunnelSafe: mockUseScanFunnelSafe,
}));

vi.mock("@/hooks/usePhonePipeline", () => ({
  usePhonePipeline: mockUsePhonePipeline,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));

vi.mock("../TruthReportClassic", () => ({
  default: ({ gateProps }: { gateProps?: any }) => (
    <div>
      <div data-testid="gate-mode">{gateProps?.gateMode ?? "none"}</div>
      <button onClick={gateProps?.onPhoneSubmit}>phone-submit</button>
      <button onClick={gateProps?.onChangePhone}>change-phone</button>
      <button onClick={gateProps?.onResend}>resend</button>
      <div data-testid="masked-phone">{gateProps?.maskedPhone ?? ""}</div>
    </div>
  ),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function baseProps() {
  return {
    grade: "C",
    flags: [],
    pillarScores: [],
    contractorName: null,
    county: "Miami-Dade",
    confidenceScore: 0.8,
    documentType: "quote",
    onSecondScan: vi.fn(),
    scanSessionId: null,
    onVerified: vi.fn(),
    isFullLoaded: false,
  };
}

describe("PostScanReportSwitcher OTP gating", () => {
  let funnelState: any;
  let submitPhoneMock: ReturnType<typeof vi.fn>;
  let resendMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReportAccess.mockReturnValue("preview");

    funnelState = {
      phoneE164: null,
      phoneStatus: "none",
      setPhone: vi.fn((e164: string, status: string) => {
        funnelState.phoneE164 = e164;
        funnelState.phoneStatus = status;
      }),
      setPhoneStatus: vi.fn((status: string) => {
        funnelState.phoneStatus = status;
      }),
      sessionId: "sess-1",
    };
    mockUseScanFunnelSafe.mockImplementation(() => funnelState);

    submitPhoneMock = vi.fn().mockResolvedValue({ status: "otp_sent", e164: "+13055551234" });
    resendMock = vi.fn().mockResolvedValue(undefined);
    mockUsePhonePipeline.mockReturnValue({
      displayValue: "",
      rawDigits: "",
      e164: null,
      inputComplete: false,
      phoneStatus: "idle",
      errorMsg: "",
      errorType: null,
      resendCooldown: 0,
      handlePhoneChange: vi.fn(),
      submitPhone: submitPhoneMock,
      submitOtp: vi.fn(),
      resend: resendMock,
      reset: vi.fn(),
    });
  });

  it("Scenario A: auto-sends once when upstream phone exists and transitions to code entry", async () => {
    funnelState.phoneE164 = "+13055551234";
    render(<PostScanReportSwitcher {...baseProps()} />);

    await waitFor(() => {
      expect(submitPhoneMock).toHaveBeenCalledTimes(1);
      expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("otp_sent");
    });
    expect(screen.getByTestId("gate-mode")).toHaveTextContent("enter_code");
  });

  it("Scenario B: requires phone submit when no upstream phone exists", async () => {
    render(<PostScanReportSwitcher {...baseProps()} />);

    expect(screen.getByTestId("gate-mode")).toHaveTextContent("enter_phone");
    expect(submitPhoneMock).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByText("phone-submit"));

    await waitFor(() => {
      expect(submitPhoneMock).toHaveBeenCalledTimes(1);
      expect(funnelState.setPhone).toHaveBeenCalledWith("+13055551234", "otp_sent");
    });
  });

  it("Scenario C: rerender does not duplicate auto-send", async () => {
    funnelState.phoneE164 = "+13055551234";
    const { rerender } = render(<PostScanReportSwitcher {...baseProps()} />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(1));

    rerender(<PostScanReportSwitcher {...baseProps()} />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(1));
  });

  it("Scenario D: change number allows new auto-send with new phone key", async () => {
    funnelState.phoneE164 = "+13055551234";
    const { rerender } = render(<PostScanReportSwitcher {...baseProps()} />);
    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(1));

    // Simulate user clicking "Wrong number?"
    fireEvent.click(screen.getByText("change-phone"));
    expect(funnelState.setPhone).toHaveBeenCalledWith("", "none");

    // New phone appears from user entry/upstream update.
    funnelState.phoneE164 = "+14075550199";
    funnelState.phoneStatus = "none";
    rerender(<PostScanReportSwitcher {...baseProps()} />);
    fireEvent.click(screen.getByText("phone-submit"));

    await waitFor(() => expect(submitPhoneMock).toHaveBeenCalledTimes(2));
  });

  it("Scenario E: manual resend still calls pipeline.resend", async () => {
    render(<PostScanReportSwitcher {...baseProps()} />);
    fireEvent.click(screen.getByText("resend"));
    await waitFor(() => expect(resendMock).toHaveBeenCalledTimes(1));
  });
});
