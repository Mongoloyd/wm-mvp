import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Ruler, DollarSign, FileText, ShieldCheck, Copy, Check, ChevronDown, ChevronUp, Users, Loader2 } from "lucide-react";
import { usePhoneInput } from "@/hooks/usePhoneInput";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import type { AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";

interface TruthReportProps {
  grade: string;
  flags: AnalysisFlag[];
  pillarScores: PillarScore[];
  contractorName: string | null;
  county: string;
  confidenceScore: number | null;
  documentType: string | null;
  accessLevel: "preview" | "full";
  onContractorMatchClick: () => void;
  onSecondScan: () => void;
}

const gradeConfig: Record<string, {color: string;bg: string;label: string;verdict: string;}> = {
  A: { color: "#059669", bg: "rgba(5,150,105,0.12)", label: "STRONG QUOTE", verdict: "This quote is well-structured and competitively priced." },
  B: { color: "#84CC16", bg: "rgba(132,204,22,0.12)", label: "ACCEPTABLE", verdict: "This quote is acceptable with minor items worth addressing." },
  C: { color: "#F97316", bg: "rgba(249,115,22,0.12)", label: "REVIEW BEFORE SIGNING", verdict: "This quote has issues that could cost you money." },
  D: { color: "#DC2626", bg: "rgba(220,38,38,0.12)", label: "SIGNIFICANT PROBLEMS", verdict: "Do Not Sign Without Renegotiating These Issues." },
  F: { color: "#991B1B", bg: "rgba(220,38,38,0.12)", label: "CRITICAL ISSUES", verdict: "This quote has critical problems. You are likely being significantly overcharged." }
};

const pillarIcons: Record<string, React.ReactNode> = {
  safety_code: <Shield size={20} />,
  install_scope: <Ruler size={20} />,
  price_fairness: <DollarSign size={20} />,
  fine_print: <FileText size={20} />,
  warranty: <ShieldCheck size={20} />
};

const statusConfig = {
  pass: { color: "#059669", bg: "rgba(5,150,105,0.12)", border: "rgba(5,150,105,0.3)", label: "PASS" },
  warn: { color: "#D97706", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", label: "REVIEW" },
  fail: { color: "#DC2626", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.3)", label: "FAIL" },
  pending: { color: "#9CA3AF", bg: "#F3F4F6", border: "rgba(255,255,255,0.1)", label: "PENDING" }
};

const severityStyles = {
  red: { border: "1.5px solid #FECACA", borderLeft: "4px solid #DC2626", badgeBg: "#FEF2F2", badgeColor: "#DC2626", badgeText: "⚠ CRITICAL", tipBg: "rgba(249,115,22,0.08)" },
  amber: { border: "1.5px solid #FDE68A", borderLeft: "4px solid #F59E0B", badgeBg: "#FFFBEB", badgeColor: "#D97706", badgeText: "⚡ REVIEW", tipBg: "rgba(245,158,11,0.08)" },
  green: { border: "1.5px solid #A7F3D0", borderLeft: "4px solid #059669", badgeBg: "#ECFDF5", badgeColor: "#059669", badgeText: "✓ CONFIRMED", tipBg: "" }
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.15, ease: 'easeInOut' as const as const }
});

const TruthReport = ({
  grade,
  flags,
  pillarScores,
  contractorName,
  county,
  confidenceScore,
  documentType,
  accessLevel,
  onContractorMatchClick,
  onSecondScan
}: TruthReportProps) => {
  const config = gradeConfig[grade] || gradeConfig.C;
  const isFull = accessLevel === "full";
  const [copied, setCopied] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());

  const redCount = flags.filter((f) => f.severity === "red").length;
  const amberCount = flags.filter((f) => f.severity === "amber").length;
  const greenCount = flags.filter((f) => f.severity === "green").length;
  const issueCount = redCount + amberCount;

  const displayName = contractorName || "Your Contractor";

  const toggleFlag = (id: number) => {
    setExpandedFlags((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const scriptText = `Hi ${displayName},

I've had a chance to review your quote in more detail and I have a few questions before I can move forward.

${flags.filter((f) => f.severity === "red").map((f, i) => `${i + 1}. Regarding "${f.label}" — ${f.detail}`).join("\n\n")}

${flags.filter((f) => f.severity === "amber").length > 0 ? `I also have ${flags.filter((f) => f.severity === "amber").length} additional item${flags.filter((f) => f.severity === "amber").length !== 1 ? "s" : ""} I'd like to discuss before finalizing.` : ""}

I'm ready to move forward if we can get these items addressed. What's the fastest way to get a revised quote?`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const reportDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ background: "#0A0A0A" }}>
      {/* ─── REPORT HEADER ─── */}
      <section style={{ background: "#0A0A0A", borderBottom: "1px solid rgba(255,255,255,0.1)" }} className="py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#059669", letterSpacing: "0.08em", fontWeight: 700 }}>ANALYSIS COMPLETE</span>
            </div>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              WindowMan Truth Report™
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9CA3AF", marginTop: 4 }}>
              {county} County · {reportDate} · {documentType ? humanizeDocType(documentType) : "Quote Document"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {confidenceScore != null &&
            <div className="text-right hidden md:block">
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF", letterSpacing: "0.08em" }}>CONFIDENCE</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: confidenceScore >= 70 ? "#059669" : "#D97706" }}>{Math.round(confidenceScore)}%</p>
              </div>
            }
            <motion.div
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.15, ease: "easeInOut" as const }}
              style={{
                width: 80, height: 80, borderRadius: "50%",
                border: `4px solid ${config.color}`, background: "#0A0A0A",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 0 6px ${config.color}1A`
              }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 48, fontWeight: 900, color: config.color, lineHeight: 1 }}>{grade}</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── GRADE VERDICT ─── */}
      <motion.section {...stagger(0)} style={{ background: config.bg, borderBottom: `2px solid ${config.color}22` }} className="py-5 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: config.color, letterSpacing: "0.06em", background: "#0A0A0A", borderRadius: 0, padding: "4px 14px", border: `1px solid ${config.color}` }}>
              GRADE {grade} — {config.label}
            </span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E7EB" }}>{config.verdict}</p>
        </div>
      </motion.section>

      {/* ─── 5-PILLAR ANALYSIS ─── */}
      <section className="py-10 md:py-14 px-4 md:px-8" style={{ background: "#0A0A0A", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...stagger(1)}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#0099BB", letterSpacing: "0.12em", fontWeight: 700 }}>5-PILLAR ANALYSIS</span>
            </div>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 24, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: 6 }}>
              How Your Quote Scores Across 5 Key Areas
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9CA3AF", marginBottom: 28 }}>
              Each pillar is scored independently against {county} County standards.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {pillarScores.map((pillar, i) => {
              const sc = statusConfig[pillar.status];
              const icon = pillarIcons[pillar.key];
              const pillarFlags = flags.filter((f) => f.pillar === pillar.key);

              return (
                <motion.div key={pillar.key} {...stagger(i + 1.5)}
                style={{
                  background: "#0A0A0A", border: `1px solid ${sc.border}44`,
                  borderRadius: 0, padding: "20px 16px",
                  boxShadow: "none",
                  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"
                }}>
                  <div style={{ color: sc.color, marginBottom: 10 }}>{icon}</div>

                  {pillar.score != null ?
                  <div style={{ position: "relative", width: 56, height: 56, marginBottom: 10 }}>
                      <svg viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="28" cy="28" r="24" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                        <circle cx="28" cy="28" r="24" fill="none" stroke={sc.color} strokeWidth="4"
                      strokeDasharray={`${pillar.score / 100 * 150.8} 150.8`}
                      strokeLinecap="round" />
                      </svg>
                      <span style={{
                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: sc.color
                    }}>{pillar.score}</span>
                    </div> :

                  <div style={{
                    width: 56, height: 56, borderRadius: "50%", background: sc.bg, border: `2px solid ${sc.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10
                  }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, color: sc.color }}>{sc.label}</span>
                    </div>
                  }

                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.3, marginBottom: 4 }}>
                    {pillar.label}
                  </p>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, color: sc.color,
                    letterSpacing: "0.08em", background: sc.bg, borderRadius: 0, padding: "2px 8px"
                  }}>{sc.label}</span>

                  {pillarFlags.length > 0 &&
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>
                      {pillarFlags.filter((f) => f.severity === "red").length > 0 && `${pillarFlags.filter((f) => f.severity === "red").length} critical`}
                      {pillarFlags.filter((f) => f.severity === "red").length > 0 && pillarFlags.filter((f) => f.severity === "amber").length > 0 && " · "}
                      {pillarFlags.filter((f) => f.severity === "amber").length > 0 && `${pillarFlags.filter((f) => f.severity === "amber").length} caution`}
                    </p>
                  }
                </motion.div>);

            })}
          </div>
        </div>
      </section>

      {/* ─── FORENSIC FINDINGS ─── */}
      <section className="py-10 md:py-14 px-4 md:px-8" style={{ background: "#0A0A0A", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...stagger(3)}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#DC2626", letterSpacing: "0.12em", fontWeight: 700 }}>FORENSIC FINDINGS</span>
                <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 24, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", marginTop: 4 }}>
                  {issueCount} Issue{issueCount !== 1 ? "s" : ""} Identified
                </h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9CA3AF" }}>
                  {redCount} critical · {amberCount} caution · {greenCount} confirmed
                </p>
              </div>
              <div className="hidden md:block" style={{ background: "rgba(0,153,187,0.12)", border: "1px solid #0099BB", borderRadius: 6, padding: "6px 12px" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#0099BB", letterSpacing: "0.08em" }}>
                  {county.toUpperCase()} COUNTY BENCHMARKS
                </span>
              </div>
            </div>
          </motion.div>

          {isFull ?
          <div className="flex flex-col gap-3">
              {flags.map((flag, i) => {
              const s = severityStyles[flag.severity];
              const isExpanded = expandedFlags.has(flag.id);
              const pillarLabel = pillarScores.find((p) => p.key === flag.pillar)?.label;

              return (
                <motion.div key={flag.id} {...stagger(i * 0.5 + 4)}
                style={{
                  background: "#0A0A0A", border: s.border, borderLeft: s.borderLeft,
                  borderRadius: 0, overflow: "hidden",
                  boxShadow: "none"
                }}>
                    <button
                    onClick={() => toggleFlag(flag.id)}
                    className="w-full text-left"
                    style={{ padding: "18px 20px 18px 24px", background: "none", border: "none", cursor: "pointer" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span style={{
                            display: "inline-block", background: s.badgeBg, borderRadius: 0, padding: "3px 10px",
                            fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: s.badgeColor, letterSpacing: "0.06em"
                          }}>{s.badgeText}</span>
                            {pillarLabel &&
                          <span style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#9CA3AF",
                            letterSpacing: "0.06em", background: "#111111", borderRadius: 0, padding: "2px 8px"
                          }}>{pillarLabel}</span>
                          }
                          </div>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{flag.label}</p>
                        </div>
                        <div style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 4 }}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </button>

                    {isExpanded &&
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.25 }}
                  style={{ padding: "0 20px 20px 24px" }}>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 14 }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", lineHeight: 1.7 }}>{flag.detail}</p>

                          {flag.tip &&
                      <div style={{
                        background: s.tipBg || "#F9FAFB", borderRadius: 8, padding: "12px 16px", marginTop: 14,
                        display: "flex", gap: 10, alignItems: "flex-start",
                        border: "1px solid rgba(255,255,255,0.1)"
                      }}>
                              <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                              <div>
                                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#C8952A", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>
                                  WHAT TO DO
                                </p>
                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#E5E7EB", lineHeight: 1.6 }}>{flag.tip}</p>
                              </div>
                            </div>
                      }
                        </div>
                      </motion.div>
                  }
                  </motion.div>);

            })}
            </div> :

          <LockedOverlay issueCount={issueCount} />
          }

          {/* Summary bar */}
          <div style={{ background: "#0A0A0A", borderRadius: 0, padding: "14px 20px", marginTop: 16 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "white" }}>
              {redCount} critical, {amberCount} caution, {greenCount} confirmed across 5 pillars.
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f7f7f7" }}>Grade {grade} · {flags.length} items reviewed</p>
          </div>
        </div>
      </section>

      {/* ─── NEGOTIATION SCRIPT ─── */}
      {isFull &&
      <section className="py-10 md:py-14 px-4 md:px-8" style={{ background: "#0A0A0A", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...stagger(6)}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#0099BB", letterSpacing: "0.12em", fontWeight: 700 }}>NEGOTIATION TOOL</span>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 24, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", marginTop: 4, marginBottom: 6 }}>
                Your Word-for-Word Script
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>
                Customized for {displayName} based on the {issueCount} issue{issueCount !== 1 ? "s" : ""} found in your quote.
              </p>
            </motion.div>

            <motion.div {...stagger(7)} style={{
            background: "#111111", border: "1px solid rgba(255,255,255,0.1)", borderLeft: "4px solid #0099BB",
            borderRadius: 0, padding: "24px 28px", position: "relative",
            boxShadow: "none"
          }}>
              <button onClick={handleCopy}
            className="flex items-center gap-1.5"
            style={{
              position: "absolute", top: 16, right: 16,
              background: copied ? "#ECFDF5" : "white", border: `1px solid ${copied ? "#A7F3D0" : "#E5E7EB"}`,
              borderRadius: 6, padding: "6px 14px",
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
              color: copied ? "#059669" : "#374151", cursor: "pointer",
              transition: "all 0.15s"
            }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy Script"}
              </button>

              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#0099BB", letterSpacing: "0.1em", marginBottom: 16 }}>
                CALL SCRIPT · {displayName.toUpperCase()}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#FFFFFF", lineHeight: 2.0, whiteSpace: "pre-line" }}>
                {scriptText}
              </p>
            </motion.div>
          </div>
        </section>
      }

      {/* ─── CONTRACTOR MATCH CTA ─── */}
      <section className="py-12 md:py-16 px-4 md:px-8" style={{ background: "#0A0A0A" }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...stagger(8)}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C8952A", letterSpacing: "0.12em", fontWeight: 700 }}>
              NEXT STEP
            </span>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, color: "white", letterSpacing: "-0.02em", marginTop: 8, marginBottom: 8 }}>
              Want a Contractor Who Will Do This job Right?
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#D1D5DB", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.7 }}>
              Based on your Grade {grade} and the {issueCount} issue{issueCount !== 1 ? "s" : ""} found, I can introduce you to a vetted {county} County contractor who quotes fair.
            </p>
          </motion.div>

          <motion.div {...stagger(9)} className="flex flex-col md:flex-row justify-center gap-4">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={onContractorMatchClick}
            className="flex items-center justify-center gap-2"
            style={{
              background: "#C8952A", color: "white",
              fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700,
              padding: "16px 36px", borderRadius: 0, border: "none", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(200,149,42,0.35)"
            }}>
              <Users size={20} />
              Get a Counter-Quote From a Vetted Contractor
            </motion.button>
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={onSecondScan}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)",
              color: "#D1D5DB", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
              padding: "14px 28px", borderRadius: 0, cursor: "pointer"
            }}>
              Scan Another Quote →
            </motion.button>
          </motion.div>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#e2e2e2", fontStyle: "italic", marginTop: 20 }}>
            No obligation. Free estimate. Your contractor never sees this report unless you share it.
          </p>
        </div>
      </section>

      {/* ─── REPORT FOOTER ─── */}
      <section className="py-6 px-4 md:px-8" style={{ background: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#FFFFFF", fontWeight: 700 }}>WindowMan Truth Report™</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF" }}>
              {reportDate} · {county} County · Grade {grade}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#9CA3AF" }}>
              This report is private. Only you can access it.
            </p>
          </div>
        </div>
      </section>
    </div>);

};

/* ─── LOCKED OVERLAY (preview mode) ─── */
function LockedOverlay({ issueCount }: {issueCount: number;}) {
  const [step, setStep] = useState<"phone" | "sending" | "otp" | "verifying">("phone");
  const { displayValue, rawDigits, isValid, handleChange } = usePhoneInput();
  const [otpValue, setOtpValue] = useState("");

  const handleSendCode = () => {
    if (!isValid) return;
    setStep("sending");
    setTimeout(() => setStep("otp"), 1800);
  };

  const handleVerify = () => {
    if (otpValue.length < 6) return;
    setStep("verifying");
  };

  const isPhoneStep = step === "phone" || step === "sending";
  const isOtpStep = step === "otp" || step === "verifying";
  const digitCount = rawDigits.length;
  const progressPercent = isPhoneStep ? 50 + (digitCount / 10) * 40 : 95;

  return (
    <div className="relative">
      {/* Blurred redacted findings behind */}
      <div className="flex flex-col gap-3" style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}>
        {[1, 2, 3].map((i) =>
        <div key={i} style={{
          background: "#0A0A0A", border: "1.5px solid #FECACA", borderLeft: "4px solid #DC2626",
          borderRadius: 0, padding: "20px 20px 20px 24px"
        }}>
            <span style={{ display: "inline-block", background: "rgba(220,38,38,0.12)", borderRadius: 0, padding: "3px 10px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>⚠ CRITICAL</span>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: "#FFFFFF", marginTop: 8 }}>██████████ ██████</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#E5E7EB", marginTop: 6 }}>████████ ██████ ████████ ██████████ ██████.</p>
          </div>
        )}
      </div>

      {/* Gate overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(10,10,10,0.85)", borderRadius: 0, backdropFilter: "blur(2px)" }}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: "#0A0A0A",
            borderRadius: 0,
            padding: "28px 32px 32px",
            textAlign: "center",
            boxShadow: "0 12px 48px rgba(15,31,53,0.45), 0 0 0 1px rgba(200,149,42,0.12) inset, 0 1px 0 rgba(255,255,255,0.04) inset",
            width: "100%",
            maxWidth: 400
          }}>

          {/* ─── Progress indicator (Zeigarnik) ─── */}
          <div style={{ marginBottom: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#C8952A", letterSpacing: "0.1em", fontWeight: 700 }}>
                {isPhoneStep ? "STEP 2 OF 2" : "FINAL STEP"}
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#94A3B8", letterSpacing: "0.06em" }}>
                {isPhoneStep ? "ALMOST UNLOCKED" : "VERIFYING"}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 0, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" as const }}
                style={{
                  height: "100%",
                  borderRadius: 0,
                  background: "linear-gradient(90deg, #C8952A, #E2B04A)",
                  boxShadow: "0 0 8px rgba(200,149,42,0.4)"
                }}
              />
            </div>
          </div>

          {/* ─── Lock icon + headline ─── */}
          <div style={{ marginBottom: 6 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#C8952A", letterSpacing: "0.1em", marginBottom: 8 }}>
              🔒 VERIFICATION REQUIRED
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.25, marginBottom: 6 }}>
              We found {issueCount} issue{issueCount !== 1 ? "s" : ""} in your quote.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", marginBottom: 20 }}>
              Verify your number to see the full details.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {isPhoneStep && (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-3"
              >
                {/* Phone input — high contrast */}
                <div style={{ width: "100%", maxWidth: 320, position: "relative" }}>
                  <div style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#94A3B8", fontWeight: 600,
                    pointerEvents: "none"
                  }}>
                    +1
                  </div>
                  <input
                    type="tel"
                    value={displayValue}
                    onChange={handleChange}
                    placeholder="(555) 555-5555"
                    autoFocus
                    style={{
                      width: "100%",
                      height: 54,
                      background: "rgba(255,255,255,0.07)",
                      border: isValid ? "2px solid #C8952A" : digitCount > 0 ? "2px solid rgba(255,255,255,0.2)" : "2px solid rgba(255,255,255,0.1)",
                      borderRadius: 0,
                      padding: "0 16px 0 40px",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 19,
                      fontWeight: 600,
                      color: "#FFFFFF",
                      textAlign: "center",
                      letterSpacing: "0.03em",
                      outline: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                      boxShadow: isValid ? "0 0 0 4px rgba(200,149,42,0.15), 0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.2)",
                      caretColor: "#C8952A"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    }}
                  />
                  {/* Digit counter */}
                  {digitCount > 0 && digitCount < 10 && (
                    <span style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#64748B"
                    }}>
                      {digitCount}/10
                    </span>
                  )}
                  {isValid && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                        color: "#C8952A", fontSize: 16
                      }}
                    >
                      ✓
                    </motion.span>
                  )}
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={isValid ? { scale: 1.02, y: -1 } : {}}
                  whileTap={isValid ? { scale: 0.97 } : {}}
                  onClick={handleSendCode}
                  disabled={!isValid || step === "sending"}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: 54,
                    background: isValid
                      ? "linear-gradient(135deg, #C8952A 0%, #E2B04A 50%, #C8952A 100%)"
                      : "rgba(200,149,42,0.2)",
                    backgroundSize: "200% 100%",
                    color: isValid ? "white" : "rgba(255,255,255,0.4)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 17,
                    fontWeight: 800,
                    borderRadius: 0,
                    border: isValid ? "1px solid rgba(226,176,74,0.3)" : "1px solid transparent",
                    cursor: isValid && step !== "sending" ? "pointer" : "not-allowed",
                    boxShadow: isValid
                      ? "0 6px 24px rgba(200,149,42,0.4), 0 2px 8px rgba(200,149,42,0.2)"
                      : "none",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    letterSpacing: "0.01em"
                  }}
                >
                  {step === "sending" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending Code…
                    </>
                  ) : (
                    <>
                      🔓 Reveal {issueCount} Issue{issueCount !== 1 ? "s" : ""}
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            {isOtpStep && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-4"
              >
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#94A3B8" }}>
                  Enter the 6-digit code sent to your phone
                </p>
                <div className="[&_input]:!bg-transparent [&_input]:!text-[#f7f7f7]">
                  <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) =>
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="!border-[#f7f7f733] !bg-[rgba(255,255,255,0.06)] !text-[#f7f7f7] !w-12 !h-14 !text-xl !font-bold"
                        />
                      )}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <motion.button
                  whileHover={otpValue.length === 6 ? { scale: 1.02 } : {}}
                  whileTap={otpValue.length === 6 ? { scale: 0.97 } : {}}
                  onClick={handleVerify}
                  disabled={otpValue.length < 6 || step === "verifying"}
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: 54,
                    background: otpValue.length === 6 ? "linear-gradient(135deg, #C8952A, #E2B04A)" : "rgba(200,149,42,0.2)",
                    color: otpValue.length === 6 ? "white" : "rgba(255,255,255,0.4)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 17,
                    fontWeight: 800,
                    borderRadius: 0,
                    border: otpValue.length === 6 ? "1px solid rgba(226,176,74,0.3)" : "1px solid transparent",
                    cursor: otpValue.length === 6 && step !== "verifying" ? "pointer" : "not-allowed",
                    boxShadow: otpValue.length === 6 ? "0 6px 24px rgba(200,149,42,0.4)" : "none",
                    transition: "all 0.3s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  {step === "verifying" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & Unlock Report"
                  )}
                </motion.button>
                <button
                  onClick={() => { setStep("phone"); setOtpValue(""); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94A3B8",
                    textDecoration: "underline", textUnderlineOffset: 2
                  }}
                >
                  Use a different number
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#64748B", marginTop: 16, lineHeight: 1.5 }}>
            We'll text a 6-digit code. No spam, ever.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function humanizeDocType(dt: string): string {
  const map: Record<string, string> = {
    quote: "Contractor Quote",
    estimate: "Project Estimate",
    proposal: "Project Proposal",
    invoice: "Invoice",
    contract: "Contract"
  };
  return map[dt.toLowerCase()] || dt;
}

export default TruthReport;