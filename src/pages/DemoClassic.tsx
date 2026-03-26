/**
 * DemoClassic — Full gate orchestration harness for TruthReportClassic.
 *
 * Simulates realistic state transitions without any backend:
 *   enter_phone → enter_code (on valid submit)
 *   send_code   → enter_code (on send success)
 *   enter_code  → unlocked   (on correct code "000000")
 *
 * Mock rules:
 *   - Valid phone: 10+ digits
 *   - Correct OTP: "000000"
 *   - Wrong OTP: shows error, stays in enter_code
 *   - Resend: 30s cooldown timer
 *   - "Use different number" resets to enter_phone
 *   - Pre-known phone toggle skips enter_phone
 */

import { useCallback, useEffect, useRef, useState } from "react";
import LinearHeader from "@/components/LinearHeader";
import TruthReportClassic from "@/components/TruthReportClassic";
import type { GateMode, LockedOverlayProps } from "@/components/LockedOverlay";

/* ── Fixture data ── */
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

const CORRECT_OTP = "000000";
const RESEND_COOLDOWN_SECONDS = 30;

/* ── Phone formatting helper (matches usePhoneInput behavior) ── */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

type Scenario = "no_phone" | "known_phone" | "otp_sent";

const DemoClassic = () => {
  /* ── Scenario selector ── */
  const [scenario, setScenario] = useState<Scenario>("no_phone");

  /* ── Gate state machine ── */
  const [gateMode, setGateMode] = useState<GateMode>("enter_phone");
  const [accessLevel, setAccessLevel] = useState<"preview" | "full">("preview");
  const [otpValue, setOtpValue] = useState("");
  const [phoneRaw, setPhoneRaw] = useState(""); // raw digits
  const [knownPhone, setKnownPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Scenario changes reset state ── */
  useEffect(() => {
    setAccessLevel("preview");
    setOtpValue("");
    setPhoneRaw("");
    setErrorMsg("");
    setIsLoading(false);
    setResendCooldown(0);
    if (cooldownRef.current) clearInterval(cooldownRef.current);

    if (scenario === "no_phone") {
      setGateMode("enter_phone");
      setKnownPhone(null);
    } else if (scenario === "known_phone") {
      setGateMode("send_code");
      setKnownPhone("+15551234567");
    } else {
      // otp_sent
      setGateMode("enter_code");
      setKnownPhone("+15559876543");
      startCooldown();
    }
  }, [scenario]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = "Demo Classic — Gate Orchestration Test";
  }, []);

  /* ── Cooldown timer ── */
  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  /* ── Derived phone state ── */
  const phoneDisplay = formatPhone(phoneRaw);
  const phoneDigitCount = phoneRaw.replace(/\D/g, "").length;
  const phoneIsValid = phoneDigitCount === 10;
  const activePhone = knownPhone || (phoneIsValid ? `+1${phoneRaw}` : null);

  /* ── Actions ── */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneRaw(digits);
    setErrorMsg("");
  };

  const handlePhoneSubmit = () => {
    if (!phoneIsValid) {
      setErrorMsg("Enter a valid 10-digit US phone number.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    setTimeout(() => {
      setIsLoading(false);
      setKnownPhone(`+1${phoneRaw}`);
      setGateMode("enter_code");
      startCooldown();
    }, 1200);
  };

  const handleSendCode = () => {
    setIsLoading(true);
    setErrorMsg("");
    setTimeout(() => {
      setIsLoading(false);
      setGateMode("enter_code");
      startCooldown();
    }, 1200);
  };

  const handleOtpSubmit = () => {
    if (otpValue.length < 6) return;
    setIsLoading(true);
    setErrorMsg("");
    setTimeout(() => {
      setIsLoading(false);
      if (otpValue === CORRECT_OTP) {
        setAccessLevel("full");
      } else {
        setErrorMsg("Invalid code. Try again or resend.");
        setOtpValue("");
      }
    }, 1200);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMsg("");
    setTimeout(() => {
      setIsLoading(false);
      startCooldown();
      setOtpValue("");
    }, 800);
  };

  /* ── Build gate props (only used when preview) ── */
  const gateProps: Omit<LockedOverlayProps, "grade" | "flagCount"> | undefined =
    accessLevel === "preview"
      ? {
          gateMode,
          otpValue,
          onOtpChange: (v: string) => { setOtpValue(v); setErrorMsg(""); },
          onOtpSubmit: handleOtpSubmit,
          onSendCode: handleSendCode,
          phoneDisplayValue: phoneDisplay,
          phoneIsValid,
          phoneDigitCount,
          onPhoneChange: handlePhoneChange,
          onPhoneSubmit: handlePhoneSubmit,
          isLoading,
          errorMsg,
          resendCooldown,
          onResend: handleResend,
        }
      : undefined;

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <LinearHeader />

      {/* ── Dev control bar ── */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(37,99,235,0.15), rgba(249,115,22,0.15))",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF", letterSpacing: "0.06em" }}>
          SCENARIO:
        </span>
        {([
          ["no_phone", "No phone (enter_phone → enter_code → unlock)"],
          ["known_phone", "Known phone (send_code → enter_code → unlock)"],
          ["otp_sent", "OTP already sent (enter_code → unlock)"],
        ] as [Scenario, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setScenario(key)}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.04em",
              padding: "4px 10px",
              borderRadius: 4,
              border: scenario === key ? "1px solid #2563EB" : "1px solid rgba(255,255,255,0.15)",
              background: scenario === key ? "rgba(37,99,235,0.25)" : "transparent",
              color: scenario === key ? "#93C5FD" : "#9CA3AF",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}

        {/* Status indicators */}
        <div style={{ display: "flex", gap: 12, marginLeft: 8, fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#64748B" }}>
          <span>MODE: <span style={{ color: "#C8952A" }}>{accessLevel === "full" ? "UNLOCKED" : gateMode}</span></span>
          <span>PHONE: <span style={{ color: activePhone ? "#059669" : "#DC2626" }}>{activePhone || "none"}</span></span>
          <span>ACCESS: <span style={{ color: accessLevel === "full" ? "#059669" : "#F97316" }}>{accessLevel}</span></span>
        </div>
      </div>

      {/* ── Hint bar ── */}
      <div style={{
        textAlign: "center",
        padding: "6px 16px",
        background: "rgba(200,149,42,0.08)",
        borderBottom: "1px solid rgba(200,149,42,0.15)",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: "#C8952A",
        letterSpacing: "0.04em",
      }}>
        {accessLevel === "full"
          ? "✅ REPORT UNLOCKED — overlay removed, full findings visible"
          : gateMode === "enter_code"
            ? 'Enter code "000000" to unlock · any other code → error'
            : gateMode === "send_code"
              ? 'Click "Get Your Code" to transition → enter_code'
              : "Enter 10 digits → Send Code → transitions to enter_code"
        }
      </div>

      <TruthReportClassic
        grade="C"
        flags={FIXTURE_FLAGS}
        pillarScores={FIXTURE_PILLARS}
        contractorName="AllStar Impact Solutions"
        county="Broward"
        confidenceScore={78}
        documentType="estimate"
        accessLevel={accessLevel}
        qualityBand="fair"
        hasWarranty={null}
        hasPermits={null}
        pageCount={2}
        lineItemCount={6}
        onContractorMatchClick={() => {}}
        onReportHelpCall={() => {}}
        onSecondScan={() => { window.location.href = "/"; }}
        gateProps={gateProps}
      />
    </div>
  );
};

export default DemoClassic;
