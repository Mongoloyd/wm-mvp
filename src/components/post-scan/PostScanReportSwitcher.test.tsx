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
      <div data-testid="is-loading">{String(!!gateProps?.isLoading)}</div>
      <div data-testid="error-msg">{gateProps?.errorMsg ?? ""}</div>
      <button onClick={gateProps?.onResend}>resend</button>
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

describe("PostScanReportSwitcher shared OTP status wiring", () => {
  let funnelState: any;
  let resendMock: ReturnType<typeof vi.fn>;
  let submitPhoneMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReportAccess.mockReturnValue("preview");

    funnelState = {
      phoneE164: null,
      phoneStatus: "none",
      setPhone: vi.fn(),
      setPhoneStatus: vi.fn(),
      sessionId: "sess-1",
    };
    mockUseScanFunnelSafe.mockImplementation(() => funnelState);

    resendMock = vi.fn().mockResolvedValue({ status: "otp_sent", e164: "+13055551234" });
    submitPhoneMock = vi.fn().mockResolvedValue({ status: "otp_sent", e164: "+13055551234" });
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

  it("shows code entry mode when shared status is otp_sent", () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "otp_sent";
    render(<PostScanReportSwitcher {...baseProps()} />);
    expect(screen.getByTestId("gate-mode")).toHaveTextContent("enter_code");
  });

  it("shows send_code mode and loading while shared status is sending_otp", () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "sending_otp";
    render(<PostScanReportSwitcher {...baseProps()} />);
    expect(screen.getByTestId("gate-mode")).toHaveTextContent("send_code");
    expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
  });

  it("shows fallback copy when shared status is send_failed", () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "send_failed";
    render(<PostScanReportSwitcher {...baseProps()} />);
    expect(screen.getByTestId("error-msg")).toHaveTextContent("Send or confirm your number to receive a code.");
  });

  it("keeps send_code non-loading only for screened_valid (pre-send), not for in-flight sending_otp", () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "screened_valid";
    render(<PostScanReportSwitcher {...baseProps()} />);
    expect(screen.getByTestId("gate-mode")).toHaveTextContent("send_code");
    expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
  });

  it("shows enter_phone mode when no phone exists", () => {
    render(<PostScanReportSwitcher {...baseProps()} />);
    expect(screen.getByTestId("gate-mode")).toHaveTextContent("enter_phone");
  });

  it("manual resend still calls pipeline.resend", async () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "otp_sent";
    render(<PostScanReportSwitcher {...baseProps()} />);
    fireEvent.click(screen.getAllByText("resend")[0]);
    await waitFor(() => expect(resendMock).toHaveBeenCalledTimes(1));
  });

  it("blocked resend does not downgrade shared status to send_failed", async () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "otp_sent";
    resendMock.mockResolvedValueOnce({ status: "blocked", error: "Please wait before requesting another code." });
    render(<PostScanReportSwitcher {...baseProps()} />);

    fireEvent.click(screen.getAllByText("resend")[0]);
    await waitFor(() => expect(resendMock).toHaveBeenCalledTimes(1));
    expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("sending_otp");
    expect(funnelState.setPhoneStatus).toHaveBeenCalledWith("otp_sent");
    expect(funnelState.setPhoneStatus).not.toHaveBeenCalledWith("send_failed");
  });

  it("does not auto-send on mount from PostScanReportSwitcher", async () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "screened_valid";
    render(<PostScanReportSwitcher {...baseProps()} />);
    await Promise.resolve();
    expect(submitPhoneMock).not.toHaveBeenCalled();
  });
});

describe("PostScanReportSwitcher — Identity Ladder full access (Level 2)", () => {
  let funnelState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReportAccess.mockReturnValue("full");

    funnelState = {
      phoneE164: "+13055551234",
      phoneStatus: "verified",
      setPhone: vi.fn(),
      setPhoneStatus: vi.fn(),
      sessionId: "sess-verified",
    };
    mockUseScanFunnelSafe.mockImplementation(() => funnelState);

    mockUsePhonePipeline.mockReturnValue({
      displayValue: "(305) 555-1234",
      rawDigits: "3055551234",
      e164: "+13055551234",
      inputComplete: true,
      phoneStatus: "verified",
      errorMsg: "",
      errorType: null,
      resendCooldown: 0,
      handlePhoneChange: vi.fn(),
      submitPhone: vi.fn(),
      submitOtp: vi.fn(),
      resend: vi.fn(),
      reset: vi.fn(),
    });
  });

  it("passes gateProps=undefined to TruthReportClassic when access is full", () => {
    render(
      <PostScanReportSwitcher
        {...baseProps()}
        isFullLoaded={true}
      />
    );
    // When accessLevel is "full", gateProps is not passed — gate-mode reads "none"
    expect(screen.getByTestId("gate-mode")).toHaveTextContent("none");
  });

  it("does not render a phone input gate when user is fully verified", () => {
    render(
      <PostScanReportSwitcher
        {...baseProps()}
        isFullLoaded={true}
      />
    );
    expect(screen.queryByTestId("gate-mode")).not.toHaveTextContent("enter_phone");
    expect(screen.queryByTestId("gate-mode")).not.toHaveTextContent("send_code");
    expect(screen.queryByTestId("gate-mode")).not.toHaveTextContent("enter_code");
  });
});

describe("PostScanReportSwitcher — Identity Ladder partial access (Level 0/1)", () => {
  let funnelState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReportAccess.mockReturnValue("preview");

    funnelState = {
      phoneE164: null,
      phoneStatus: "none",
      setPhone: vi.fn(),
      setPhoneStatus: vi.fn(),
      sessionId: "sess-anon",
    };
    mockUseScanFunnelSafe.mockImplementation(() => funnelState);

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
      submitPhone: vi.fn(),
      submitOtp: vi.fn(),
      resend: vi.fn(),
      reset: vi.fn(),
    });
  });

  it("shows enter_phone gate for anonymous user (no phone, no verification)", () => {
    render(<PostScanReportSwitcher {...baseProps()} isFullLoaded={false} />);
    expect(screen.getByTestId("gate-mode")).toHaveTextContent("enter_phone");
  });

  it("never shows gateMode=none when user is unverified (bypass prevention)", () => {
    render(<PostScanReportSwitcher {...baseProps()} isFullLoaded={false} />);
    expect(screen.getByTestId("gate-mode")).not.toHaveTextContent("none");
  });

  it("keeps the gate locked when phoneStatus is otp_failed", () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "otp_failed";
    render(<PostScanReportSwitcher {...baseProps()} isFullLoaded={false} />);
    // otp_failed should not unlock access; the user must remain gated.
    expect(screen.getByTestId("gate-mode")).not.toHaveTextContent("none");
  });

  it("blocks full report access even if phone is present but isFullLoaded is false", () => {
    funnelState.phoneE164 = "+13055551234";
    funnelState.phoneStatus = "otp_sent";
    render(<PostScanReportSwitcher {...baseProps()} isFullLoaded={false} />);
    // User is in OTP flow but full data has not been fetched from backend
    expect(screen.getByTestId("gate-mode")).toHaveTextContent("enter_code");
    expect(screen.getByTestId("gate-mode")).not.toHaveTextContent("none");
  });
});
