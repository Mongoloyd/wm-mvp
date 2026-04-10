import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Shield, FileSearch, Scale, FileText, Award,
  CheckCircle2, AlertTriangle, AlertCircle,
  Phone, Loader2, RefreshCw, ArrowLeft, Lock,
  Unlock, ChevronRight, Clock, AlertOctagon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = "loading" | "preview" | "otp_gate" | "full_analysis" | "no_analysis" | "error";

interface PillarResult {
  key: string;
  label: string;
  score: number;
  status: string;
  detail: string;
}

interface FullAnalysis {
  score: number;
  grade: string;
  pillars: PillarResult[];
  fileName?: string;
  analyzedAt?: string;
  overchargeEstimate?: { low: number; high: number; currency: string };
  recommendations?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PILLAR_CONFIG = [
  { key: "safety_code", icon: Shield, label: "Safety & Code Match" },
  { key: "install_scope", icon: FileSearch, label: "Install & Scope Clarity" },
  { key: "price_fairness", icon: Scale, label: "Price Fairness" },
  { key: "fine_print", icon: FileText, label: "Fine Print Transparency" },
  { key: "warranty", icon: Award, label: "Warranty Value" },
];

const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#0891b2",
  C: "#f59e0b",
  D: "#f87171",
  F: "#ef4444",
};

const SURFACE =
  "bg-white/80 backdrop-blur-[24px] shadow-lg border border-cyan-500/15 rounded-3xl";
const SURFACE_INSET = "bg-slate-50/50 shadow-inner border border-cyan-500/15 rounded-2xl";
const HEADER_BAR = "bg-white/60 backdrop-blur-xl border-b border-cyan-500/10";
const PRIMARY_CTA =
  "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold shadow-[0_10px_30px_-5px_rgba(0,188,212,0.35)]";
const SECONDARY_BTN =
  "bg-white/70 hover:bg-white border border-slate-200 text-slate-900 font-semibold shadow-sm";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PREVIEW = {
  score: 62,
  grade: "C",
  preview: {
    findings: [
      { label: "Missing FL energy code compliance documentation", pillarKey: "safety_code", severity: "flag" },
      { label: "Installation scope lacks specificity on flashing details", pillarKey: "install_scope", severity: "warn" },
      { label: "Critical Flag: Quote exceeds regional fair-market benchmarks", pillarKey: "price_fairness", severity: "flag" },
    ],
  },
};

// ─── Tease Animations ─────────────────────────────────────────────────────────

const TEASE_STYLES = `
@keyframes gauge-sweep {
  from { stroke-dashoffset: 220; }
  to { stroke-dashoffset: 88; }
}
@keyframes gauge-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes waterfall-slide {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
`;

// ─── Padlocked Savings Gauge ──────────────────────────────────────────────────

function PadlockedGauge() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-48 h-28">
        <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="rgba(8,145,178,0.10)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="126"
            style={{ animation: "gauge-sweep 1.8s cubic-bezier(0.4,0,0.2,1) forwards" }}
          />
          {/* Needle */}
          <line
            x1="50" y1="50" x2="50" y2="14"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            transform="rotate(60, 50, 50)"
          />
          <circle cx="50" cy="50" r="3" fill="#0f172a" />
        </svg>

        {/* Blurred savings overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <div className="flex flex-col items-center gap-1">
            <span
              className="text-2xl font-black text-rose-600 select-none"
              style={{ filter: "blur(8px)" }}
            >
              $3,200
            </span>
            <div className="bg-slate-100 rounded-full p-1.5 mt-1">
              <Lock className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center max-w-[220px] leading-relaxed">
        We identified avoidable markups in your quote.{" "}
        <span className="font-semibold text-cyan-700">Verify your number to decrypt your savings.</span>
      </p>
    </div>
  );
}

// ─── Redacted Waterfall ───────────────────────────────────────────────────────

const WATERFALL_ITEMS = [
  { label: "Material markup", color: "#f59e0b", borderColor: "rgb(245,158,11)" },
  { label: "Labor rate adjustment", color: "#f97316", borderColor: "rgb(249,115,22)" },
  { label: "Scope padding removed", color: "#ef4444", borderColor: "rgb(239,68,68)" },
];

function RedactedWaterfall() {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Where Your Savings Hide</p>
      {WATERFALL_ITEMS.map((item, i) => (
        <div
          key={item.label}
          className="flex items-center justify-between p-3 rounded-xl bg-white/70 border"
          style={{
            borderLeftWidth: 4,
            borderLeftColor: item.borderColor,
            borderColor: "rgba(8,145,178,0.10)",
            animation: `waterfall-slide 0.5s ease-out ${0.3 + i * 0.2}s both`,
          }}
        >
          <span className="text-sm font-medium text-slate-700">{item.label}</span>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold text-slate-700 select-none"
              style={{ filter: "blur(6px)" }}
            >
              -$1,{i + 2}00
            </span>
            <Lock className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>
      ))}

      {/* Final locked block */}
      <div
        className="flex items-center justify-between p-3 rounded-xl border"
        style={{
          background: "linear-gradient(135deg, rgba(8,145,178,0.08), rgba(6,182,212,0.12))",
          borderColor: "rgba(8,145,178,0.20)",
          animation: `waterfall-slide 0.5s ease-out ${0.3 + WATERFALL_ITEMS.length * 0.2}s both`,
        }}
      >
        <span className="text-sm font-semibold text-cyan-800">Your optimized price</span>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-600" />
          <span className="text-sm font-bold text-cyan-700">Unlock to View</span>
        </div>
      </div>
    </div>
  );
}

const MOCK_FULL_ANALYSIS: FullAnalysis = {
  score: 62,
  grade: "C",
  pillars: [
    { key: "safety_code", label: "Safety & Code Match", score: 55, status: "fail", detail: "Missing FL energy code compliance documentation. No hurricane impact rating referenced." },
    { key: "install_scope", label: "Install & Scope Clarity", score: 68, status: "warn", detail: "Installation scope lacks specificity on flashing details and waterproofing methods." },
    { key: "price_fairness", label: "Price Fairness", score: 45, status: "fail", detail: "Price appears 18-24% above regional market average for comparable window specifications." },
    { key: "fine_print", label: "Fine Print Transparency", score: 72, status: "warn", detail: "Cancellation policy is buried in addendum. Payment terms favor contractor heavily." },
    { key: "warranty", label: "Warranty Value", score: 80, status: "pass", detail: "Lifetime limited warranty on glass. Labor warranty is standard at 2 years." },
  ],
  fileName: "anderson_quote_2024.pdf",
  analyzedAt: new Date().toISOString(),
  overchargeEstimate: { low: 2800, high: 4200, currency: "USD" },
  recommendations: [
    "Request FL energy code compliance documentation before signing.",
    "Ask for itemized flashing and waterproofing scope.",
    "Negotiate price down 15-20% citing regional market data.",
    "Request cancellation policy be moved to main contract body.",
  ],
};

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OTPInput({ onComplete, disabled }: { onComplete: (code: string) => void; disabled?: boolean }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const d = [...digits];
    d[i] = v.slice(-1);
    setDigits(d);
    if (v && i < 5) refs.current[i + 1]?.focus();
    const code = d.join("");
    if (code.length === 6) onComplete(code);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (p.length === 6) {
      setDigits(p.split(""));
      onComplete(p);
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-white/80 border-2 text-slate-900 focus:outline-none transition-all duration-200 disabled:opacity-50"
          style={{
            borderColor: d ? "#0891B2" : "rgba(8,145,178,0.20)",
            boxShadow: d ? "0 0 12px rgba(8,145,178,0.20)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ─── Pillar Card ──────────────────────────────────────────────────────────────

function PillarCard({ pillar, status, score, detail, locked }: {
  pillar: typeof PILLAR_CONFIG[0];
  status?: string;
  score?: number;
  detail?: string;
  locked?: boolean;
}) {
  const Icon = pillar.icon;

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; pill: string; border: string }> = {
    pass: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Pass", pill: "bg-emerald-50 text-emerald-800 border-emerald-200", border: "rgba(5,150,105,0.20)" },
    warn: { icon: <AlertTriangle className="w-4 h-4" />, label: "Warning", pill: "bg-amber-50 text-amber-800 border-amber-200", border: "rgba(217,119,6,0.20)" },
    fail: { icon: <AlertCircle className="w-4 h-4" />, label: "Flag", pill: "bg-rose-50 text-rose-800 border-rose-200", border: "rgba(225,29,72,0.20)" },
  };

  const cfg = status ? statusConfig[status] ?? null : null;

  return (
    <div
      className={`${SURFACE} p-4 transition-all duration-300 hover:shadow-xl relative overflow-hidden`}
      style={{ borderColor: cfg?.border ?? "rgba(8,145,178,0.15)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-5 h-5 text-cyan-600 shrink-0" />
          <span className="text-sm font-semibold text-slate-900 leading-tight">
            {pillar.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {locked ? (
            <Lock className="w-4 h-4 text-slate-300" />
          ) : (
            <>
              {cfg?.icon as React.ReactNode}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg?.pill ?? ""}`}>
                {cfg?.label ?? "—"}
              </span>
              {score !== undefined && (
                <span className="text-xs font-bold text-slate-500 tabular-nums">{score}/100</span>
              )}
            </>
          )}
        </div>
      </div>

      {!locked && detail && (
        <p className="mt-2.5 text-xs text-slate-600 leading-relaxed pl-7">{detail}</p>
      )}

      {locked && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/60 to-white/90 pointer-events-none" />
      )}
    </div>
  );
}

// ─── Grade Badge ──────────────────────────────────────────────────────────────

function GradeBadge({ grade, score, size = "lg" }: { grade: string; score: number; size?: "sm" | "lg" }) {
  const color = GRADE_COLORS[grade] ?? "#0891b2";
  const isLg = size === "lg";

  return (
    <div className="flex items-center gap-4">
      <div
        className={`${isLg ? "w-20 h-20 text-4xl" : "w-12 h-12 text-2xl"} rounded-2xl flex items-center justify-center font-black shadow-lg`}
        style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: "white" }}
      >
        {grade}
      </div>

      <div>
        <div
          className={`${isLg ? "text-3xl" : "text-xl"} font-black tabular-nums`}
          style={{ color }}
        >
          {score}/100
        </div>
        <p className="text-sm text-slate-500 font-medium">Overall Score</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalysisPreview() {
  const navigate = useNavigate();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [phone, setPhone] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fullAnalysis, setFullAnalysis] = useState<FullAnalysis | null>(null);

  // Simulate loading → preview
  useEffect(() => {
    const t = setTimeout(() => setPageState("preview"), 1200);
    return () => clearTimeout(t);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handlePhoneSubmit = () => {
    if (!phone.trim()) return;
    toast.success("Demo: Code sent to " + phone);
    setPageState("otp_gate");
    setResendCooldown(30);
  };

  const handleOTPComplete = (code: string) => {
    toast.success("Demo: Phone verified! Unlocking full analysis...");
    setTimeout(() => {
      setFullAnalysis(MOCK_FULL_ANALYSIS);
      setPageState("full_analysis");
    }, 800);
  };

  const handleResendOTP = () => {
    if (resendCooldown > 0) return;
    toast.info("Demo: Code resent");
    setResendCooldown(30);
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-slate-100" style={{ fontFamily: "var(--wm-font-body)" }}>
      <style>{TEASE_STYLES}</style>

      {/* Header */}
      <header className={`sticky top-0 z-40 ${HEADER_BAR}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to WindowMan
          </button>

          <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Email Verified
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── STATE: loading ── */}
        {pageState === "loading" && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            <p className="text-slate-600 text-lg font-medium">Loading your analysis...</p>
          </div>
        )}

        {/* ── STATE: preview (partial — phone not yet verified) ── */}
        {(pageState === "preview" || pageState === "otp_gate") && (
          <div className="space-y-8">
            {/* Page title */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold border border-cyan-200">
                <Lock className="w-3 h-3" />
                Partial Preview
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "var(--wm-font-display)" }}>Your Quote Analysis</h1>
              <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
                We found issues in your quote. Verify your number to see exactly how much.
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              {/* Left: Score + Pillars */}
              <div className="lg:col-span-3 space-y-6">
                {/* Padlocked Gauge */}
                <div className={`${SURFACE} p-6 flex flex-col items-center`}>
                  <PadlockedGauge />
                </div>

                {/* Redacted Waterfall */}
                <div className={`${SURFACE} p-5`}>
                  <RedactedWaterfall />
                </div>

                {/* Key Findings */}
                <div className={`${SURFACE} p-5 space-y-3`}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Key Findings</p>
                  {MOCK_PREVIEW.preview.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      {f.severity === "flag" ? (
                        <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      {f.label}
                    </div>
                  ))}
                </div>

                {/* Pillar statuses */}
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--wm-font-display)" }}>5-Pillar Analysis</h2>
                  {PILLAR_CONFIG.map((pillar) => {
                    const finding = MOCK_PREVIEW.preview.findings.find(
                      (f) => f.pillarKey === pillar.key
                    );
                    const status = finding ? (finding.severity === "flag" ? "fail" : "warn") : undefined;

                    return (
                      <PillarCard key={pillar.key} pillar={pillar} status={status} locked={!status} />
                    );
                  })}
                </div>
              </div>

              {/* Right: Phone OTP Gate */}
              <div className="lg:col-span-2">
                <div className={`${SURFACE} p-6 sticky top-24`}>
                  {pageState === "preview" ? (
                    <>
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-3">
                        <Phone className="w-5 h-5 text-cyan-600" />
                        Unlock Full Report
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed mb-5">
                        Enter your mobile number to unlock the complete analysis — including your exact savings amount,
                        line-item breakdown, and negotiation scripts.
                      </p>

                      {/* Locked preview items */}
                      <div className="space-y-2 mb-5">
                        {["Exact savings amount", "Line-item breakdown", "Negotiation scripts", "Fair price for your area"].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
                          className={`flex-1 px-3 py-2.5 rounded-xl ${SURFACE_INSET} text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-500 transition-colors`}
                        />

                        <button
                          onClick={handlePhoneSubmit}
                          className={`px-5 py-2.5 rounded-xl ${PRIMARY_CTA} text-sm transition-all duration-300`}
                        >
                          Send Code
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mt-3">Mobile numbers only. VOIP not accepted.</p>
                    </>
                  ) : (
                    /* OTP Gate */
                    <>
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-lg mb-3">
                        <Unlock className="w-5 h-5 text-cyan-600" />
                        Enter Your Code
                      </div>

                      <p className="text-sm text-slate-500 mb-5">
                        We sent a 6-digit code to{" "}
                        <span className="font-semibold text-slate-700">{phone}</span>
                      </p>

                      <OTPInput onComplete={handleOTPComplete} />

                      <div className="flex items-center justify-between mt-5 text-sm">
                        <button
                          onClick={() => { setPageState("preview"); setPhone(""); }}
                          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors font-medium"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Wrong number? Edit
                        </button>
                        <button
                          onClick={handleResendOTP}
                          disabled={resendCooldown > 0}
                          className="flex items-center gap-1 text-slate-600 hover:text-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATE: full_analysis ── */}
        {pageState === "full_analysis" && fullAnalysis && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <Unlock className="w-3 h-3" />
                Full Analysis Unlocked
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "var(--wm-font-display)" }}>Complete Quote Report</h1>
              <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
                Your full analysis is ready with detailed findings and savings estimates.
              </p>
            </div>

            {/* Grade + Overcharge */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`${SURFACE} p-6`}>
                <GradeBadge grade={fullAnalysis.grade} score={fullAnalysis.score} />
              </div>

              {fullAnalysis.overchargeEstimate && (
                <div className={`${SURFACE} p-6 space-y-2`}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Overcharge</p>
                  <p className="text-3xl font-black text-rose-600">
                    ${fullAnalysis.overchargeEstimate.low.toLocaleString()} – ${fullAnalysis.overchargeEstimate.high.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-500">Above fair market value for your area</p>
                </div>
              )}
            </div>

            {/* Full Pillar Details */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--wm-font-display)" }}>Detailed 5-Pillar Breakdown</h2>
              {fullAnalysis.pillars.map((p) => {
                const pillarCfg = PILLAR_CONFIG.find((c) => c.key === p.key) ?? PILLAR_CONFIG[0];
                return (
                  <PillarCard
                    key={p.key}
                    pillar={pillarCfg}
                    status={p.status}
                    score={p.score}
                    detail={p.detail}
                  />
                );
              })}
            </div>

            {/* Recommendations */}
            {fullAnalysis.recommendations && fullAnalysis.recommendations.length > 0 && (
              <div className={`${SURFACE} p-6 space-y-3`}>
                <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--wm-font-display)" }}>Recommendations</h2>
                <div className="space-y-2">
                  {fullAnalysis.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <ChevronRight className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
