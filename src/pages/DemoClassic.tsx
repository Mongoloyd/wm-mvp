import { useEffect, useState } from "react";
import LinearHeader from "@/components/LinearHeader";
import TruthReportClassic from "@/components/TruthReportClassic";
import type { GateMode, LockedOverlayProps } from "@/components/LockedOverlay";

const FIXTURE_FLAGS = [
  { id: 1, severity: "red" as const, label: "Missing NOA Codes", detail: "No product approval numbers listed.", tip: "Ask for NOA numbers.", pillar: "safety_code" as const },
  { id: 2, severity: "red" as const, label: "Permit Fees TBD", detail: "Permit costs not included.", tip: "Request a fixed permit fee.", pillar: "fine_print" as const },
  { id: 3, severity: "amber" as const, label: "No Disposal Terms", detail: "No mention of old window removal.", tip: "Ask for disposal in writing.", pillar: "install_scope" as const },
  { id: 4, severity: "amber" as const, label: "Generic Glass Spec", detail: "Glass listed as 'impact rated' without specifics.", tip: "Request exact product series.", pillar: "safety_code" as const },
  { id: 5, severity: "green" as const, label: "Line Items Present", detail: "Per-unit pricing is broken out.", tip: null, pillar: "price_fairness" as const },
  { id: 6, severity: "amber" as const, label: "Warranty Unclear", detail: "Duration not specified.", tip: "Get exact warranty term in writing.", pillar: "warranty" as const },
];

const FIXTURE_PILLARS = [
  { key: "safety_code", label: "Safety & Code Match", score: null, status: "fail" as const },
  { key: "install_scope", label: "Install & Scope Clarity", score: null, status: "warn" as const },
  { key: "price_fairness", label: "Price Fairness", score: null, status: "pass" as const },
  { key: "fine_print", label: "Fine Print & Transparency", score: null, status: "fail" as const },
  { key: "warranty", label: "Warranty Value", score: null, status: "warn" as const },
];

const GATE_MODES: GateMode[] = ["enter_code", "send_code", "enter_phone"];

const DemoClassic = () => {
  const [gateMode, setGateMode] = useState<GateMode>("enter_code");
  const [otpValue, setOtpValue] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = "Demo Classic — Gate Mode Test";
  }, []);

  const mockAction = (label: string) => {
    setIsLoading(true);
    setErrorMsg("");
    setTimeout(() => {
      setIsLoading(false);
      setErrorMsg(`[mock] ${label} — no backend wired`);
    }, 1200);
  };

  const gateProps: Omit<LockedOverlayProps, "grade" | "flagCount"> = {
    gateMode,
    otpValue,
    onOtpChange: setOtpValue,
    onOtpSubmit: () => mockAction("submitOtp"),
    onSendCode: () => mockAction("sendCode"),
    phoneDisplayValue: phoneDisplay,
    phoneIsValid: phoneDisplay.replace(/\D/g, "").length >= 10,
    phoneDigitCount: phoneDisplay.replace(/\D/g, "").length,
    onPhoneChange: (e) => setPhoneDisplay(e.target.value),
    onPhoneSubmit: () => mockAction("submitPhone"),
    isLoading,
    errorMsg,
    resendCooldown: 0,
    onResend: () => mockAction("resend"),
  };

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LinearHeader />

      {/* Mode switcher bar */}
      <div style={{
        background: "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(249,115,22,0.15))",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "10px 16px",
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#9CA3AF", letterSpacing: "0.06em" }}>
          GATE MODE:
        </span>
        {GATE_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => { setGateMode(mode); setOtpValue(""); setPhoneDisplay(""); setErrorMsg(""); }}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.04em",
              padding: "4px 12px",
              borderRadius: 4,
              border: gateMode === mode ? "1px solid #2563EB" : "1px solid rgba(255,255,255,0.15)",
              background: gateMode === mode ? "rgba(37,99,235,0.25)" : "transparent",
              color: gateMode === mode ? "#93C5FD" : "#9CA3AF",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <TruthReportClassic
        grade="C"
        flags={FIXTURE_FLAGS}
        pillarScores={FIXTURE_PILLARS}
        contractorName="AllStar Impact Solutions"
        county="Broward"
        confidenceScore={78}
        documentType="estimate"
        accessLevel="preview"
        qualityBand="fair"
        hasWarranty={null}
        hasPermits={null}
        pageCount={2}
        lineItemCount={6}
        onContractorMatchClick={() => {}}
        onSecondScan={() => { window.location.href = "/"; }}
        gateProps={gateProps}
      />
    </div>
  );
};

export default DemoClassic;
