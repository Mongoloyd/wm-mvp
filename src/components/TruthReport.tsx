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
  A: { color: "#059669", bg: "#ECFDF5", label: "STRONG QUOTE", verdict: "This quote is well-structured and competitively priced." },
  B: { color: "#84CC16", bg: "#F7FEE7", label: "ACCEPTABLE", verdict: "This quote is acceptable with minor items worth addressing." },
  C: { color: "#F97316", bg: "#FFF7ED", label: "REVIEW BEFORE SIGNING", verdict: "This quote has issues that could cost you money." },
  D: { color: "#DC2626", bg: "#FEF2F2", label: "SIGNIFICANT PROBLEMS", verdict: "Do Not Sign Without Renegotiating These Issues." },
  F: { color: "#991B1B", bg: "#FEF2F2", label: "CRITICAL ISSUES", verdict: "This quote has critical problems. You are likely being significantly overcharged." }
};

const pillarIcons: Record<string, React.ReactNode> = {
  safety_code: <Shield size={20} />,
  install_scope: <Ruler size={20} />,
  price_fairness: <DollarSign size={20} />,
  fine_print: <FileText size={20} />,
  warranty: <ShieldCheck size={20} />
};

const statusConfig = {
  pass: { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "PASS" },
  warn: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "REVIEW" },
  fail: { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", label: "FAIL" },
  pending: { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB", label: "PENDING" }
};

const severityStyles = {
  red: { border: "1.5px solid #FECACA", borderLeft: "4px solid #DC2626", badgeBg: "#FEF2F2", badgeColor: "#DC2626", badgeText: "⚠ CRITICAL", tipBg: "#FFF7ED" },
  amber: { border: "1.5px solid #FDE68A", borderLeft: "4px solid #F59E0B", badgeBg: "#FFFBEB", badgeColor: "#D97706", badgeText: "⚡ REVIEW", tipBg: "#FFFBEB" },
  green: { border: "1.5px solid #A7F3D0", borderLeft: "4px solid #059669", badgeBg: "#ECFDF5", badgeColor: "#059669", badgeText: "✓ CONFIRMED", tipBg: "" }
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4 }
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
    <div style={{ background: "#FAFAFA" }}>
      {/* ─── REPORT HEADER ─── */}
      <section style={{ background: "white", borderBottom: "3px solid #0F1F35" }} className="py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#059669", letterSpacing: "0.08em", fontWeight: 700 }}>ANALYSIS COMPLETE</span>
            </div>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, color: "#0F1F35", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              WindowMan Truth Report™
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginTop: 4 }}>
              {county} County · {reportDate} · {documentType ? humanizeDocType(documentType) : "Quote Document"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {confidenceScore != null &&
            <div className="text-right hidden md:block">
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6B7280", letterSpacing: "0.08em" }}>CONFIDENCE</p>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 700, color: confidenceScore >= 70 ? "#059669" : "#D97706" }}>{Math.round(confidenceScore)}%</p>
              </div>
            }
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: [0, 1.05, 1] }} transition={{ duration: 0.6, times: [0, 0.7, 1] }}
              style={{
                width: 80, height: 80, borderRadius: "50%",
                border: `4px solid ${config.color}`, background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 0 8px ${config.color}1A`
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
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: config.color, letterSpacing: "0.06em", background: "white", borderRadius: 999, padding: "4px 14px", border: `1.5px solid ${config.color}` }}>
              GRADE {grade} — {config.label}
            </span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#374151" }}>{config.verdict}</p>
        </div>
      </motion.section>

      {/* ─── 5-PILLAR ANALYSIS ─── */}
      <section className="py-10 md:py-14 px-4 md:px-8" style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...stagger(1)}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#0099BB", letterSpacing: "0.12em", fontWeight: 700 }}>5-PILLAR ANALYSIS</span>
            </div>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 24, fontWeight: 800, color: "#0F1F35", letterSpacing: "-0.02em", marginBottom: 6 }}>
              How Your Quote Scores Across 5 Key Areas
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
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
                  background: "white", border: `1.5px solid ${sc.border}`,
                  borderRadius: 12, padding: "20px 16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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

                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#0F1F35", lineHeight: 1.3, marginBottom: 4 }}>
                    {pillar.label}
                  </p>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, color: sc.color,
                    letterSpacing: "0.08em", background: sc.bg, borderRadius: 999, padding: "2px 8px"
                  }}>{sc.label}</span>

                  {pillarFlags.length > 0 &&
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#6B7280", marginTop: 8 }}>
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
      <section className="py-10 md:py-14 px-4 md:px-8" style={{ background: "#FAFAFA", borderBottom: "1px solid #E5E7EB" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div {...stagger(3)}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#DC2626", letterSpacing: "0.12em", fontWeight: 700 }}>FORENSIC FINDINGS</span>
                <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 24, fontWeight: 800, color: "#0F1F35", letterSpacing: "-0.02em", marginTop: 4 }}>
                  {issueCount} Issue{issueCount !== 1 ? "s" : ""} Identified
                </h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280" }}>
                  {redCount} critical · {amberCount} caution · {greenCount} confirmed
                </p>
              </div>
              <div className="hidden md:block" style={{ background: "#E8F7FB", border: "1px solid #0099BB", borderRadius: 6, padding: "6px 12px" }}>
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
                  background: "white", border: s.border, borderLeft: s.borderLeft,
                  borderRadius: 10, overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
                }}>
                    <button
                    onClick={() => toggleFlag(flag.id)}
                    className="w-full text-left"
                    style={{ padding: "18px 20px 18px 24px", background: "none", border: "none", cursor: "pointer" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span style={{
                            display: "inline-block", background: s.badgeBg, borderRadius: 999, padding: "3px 10px",
                            fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: s.badgeColor, letterSpacing: "0.06em"
                          }}>{s.badgeText}</span>
                            {pillarLabel &&
                          <span style={{
                            fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#6B7280",
                            letterSpacing: "0.06em", background: "#F3F4F6", borderRadius: 999, padding: "2px 8px"
                          }}>{pillarLabel}</span>
                          }
                          </div>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "#0F1F35" }}>{flag.label}</p>
                        </div>
                        <div style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 4 }}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </button>

                    {isExpanded &&
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.25 }}
                  style={{ padding: "0 20px 20px 24px" }}>
                        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 14 }}>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{flag.detail}</p>

                          {flag.tip &&
                      <div style={{
                        background: s.tipBg || "#F9FAFB", borderRadius: 8, padding: "12px 16px", marginTop: 14,
                        display: "flex", gap: 10, alignItems: "flex-start",
                        border: "1px solid #E5E7EB"
                      }}>
                              <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                              <div>
                                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#C8952A", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>
                                  WHAT TO DO
                                </p>
                                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{flag.tip}</p>
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
          <div style={{ background: "#0F1F35", borderRadius: 10, padding: "14px 20px", marginTop: 16 }}
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
      <section className="py-10 md:py-14 px-4 md:px-8" style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}>
          <div className="max-w-4xl mx-auto">
            <motion.div {...stagger(6)}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#0099BB", letterSpacing: "0.12em", fontWeight: 700 }}>NEGOTIATION TOOL</span>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontSize: 24, fontWeight: 800, color: "#0F1F35", letterSpacing: "-0.02em", marginTop: 4, marginBottom: 6 }}>
                Your Word-for-Word Script
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
                Customized for {displayName} based on the {issueCount} issue{issueCount !== 1 ? "s" : ""} found in your quote.
              </p>
            </motion.div>

            <motion.div {...stagger(7)} style={{
            background: "#F9FAFB", border: "1px solid #E5E7EB", borderLeft: "4px solid #0099BB",
            borderRadius: 10, padding: "24px 28px", position: "relative",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
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
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#0F1F35", lineHeight: 2.0, whiteSpace: "pre-line" }}>
                {scriptText}
              </p>
            </motion.div>
          </div>
        </section>
      }

      {/* ─── CONTRACTOR MATCH CTA ─── */}
      <section className="py-12 md:py-16 px-4 md:px-8" style={{ background: "#0F1F35" }}>
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
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onContractorMatchClick}
            className="flex items-center justify-center gap-2"
            style={{
              background: "#C8952A", color: "white",
              fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700,
              padding: "16px 36px", borderRadius: 10, border: "none", cursor: "pointer",
              boxShadow: "0 4px 16px rgba(200,149,42,0.35)"
            }}>
              <Users size={20} />
              Get a Counter-Quote From a Vetted Contractor
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onSecondScan}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)",
              color: "#D1D5DB", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
              padding: "14px 28px", borderRadius: 10, cursor: "pointer"
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
      <section className="py-6 px-4 md:px-8" style={{ background: "white", borderTop: "3px solid #0F1F35" }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#0F1F35", fontWeight: 700 }}>WindowMan Truth Report™</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280" }}>
              {reportDate} · {county} County · Grade {grade}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B7280" }}>
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
  const { displayValue, isValid, handleChange } = usePhoneInput();
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

  return (
    <div className="relative">
      <div className="flex flex-col gap-3" style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none" }}>
        {[1, 2, 3].map((i) =>
        <div key={i} style={{
          background: "white", border: "1.5px solid #FECACA", borderLeft: "4px solid #DC2626",
          borderRadius: 10, padding: "20px 20px 20px 24px"
        }}>
            <span style={{ display: "inline-block", background: "#FEF2F2", borderRadius: 999, padding: "3px 10px", fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: "#DC2626" }}>⚠ CRITICAL</span>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: "#0F1F35", marginTop: 8 }}>██████████ ██████</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#374151", marginTop: 6 }}>████████ ██████ ████████ ██████████ ██████.</p>
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(250,250,250,0.7)", borderRadius: 10 }}>
        <div style={{
          background: "#0F1F35",
          borderRadius: 14,
          padding: "32px 36px 36px",
          textAlign: "center",
          boxShadow: "0 8px 40px rgba(15,31,53,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
          width: "100%",
          maxWidth: 380
        }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#C8952A", letterSpacing: "0.1em", marginBottom: 10 }}>
            🔒 VERIFICATION REQUIRED
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "#f7f7f7", marginBottom: 6 }}>
            We found {issueCount} issue{issueCount !== 1 ? "s" : ""} in your quote.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#94A3B8", marginBottom: 24 }}>
            Verify Your Number To See The Full Details.
          </p>

          <AnimatePresence mode="wait">
            {(step === "phone" || step === "sending") &&
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-4">
              
                <input
                type="tel"
                value={displayValue}
                onChange={handleChange}
                placeholder="(555) 555-5555"
                style={{
                  width: "100%",
                  maxWidth: 320,
                  height: 48,
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid #f7f7f7",
                  borderRadius: 10,
                  padding: "0 16px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 17,
                  fontWeight: 500,
                  color: "#f7f7f7",
                  textAlign: "center",
                  letterSpacing: "0.02em",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#C8952A";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(200,149,42,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#f7f7f7";
                  e.currentTarget.style.boxShadow = "none";
                }} />
              
                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSendCode}
                disabled={!isValid || step === "sending"}
                style={{
                  width: "100%",
                  maxWidth: 320,
                  height: 48,
                  background: isValid ? "linear-gradient(135deg, #C8952A, #E2B04A)" : "rgba(200,149,42,0.3)",
                  color: "white",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "none",
                  cursor: isValid && step !== "sending" ? "pointer" : "not-allowed",
                  boxShadow: isValid ? "0 4px 20px rgba(200,149,42,0.35)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}>
                
                  {step === "sending" ?
                <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending Code…
                    </> :

                `Reveal ${issueCount} Issue${issueCount !== 1 ? "s" : ""}`
                }
                </motion.button>
              </motion.div>
            }

            {(step === "otp" || step === "verifying") &&
            <motion.div
              key="otp-step"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-4">
              
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
                      className="!border-[#f7f7f733] !bg-[rgba(255,255,255,0.04)] !text-[#f7f7f7] !w-11 !h-12 !text-lg !font-semibold" />

                    )}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleVerify}
                disabled={otpValue.length < 6 || step === "verifying"}
                style={{
                  width: "100%",
                  maxWidth: 320,
                  height: 48,
                  background: otpValue.length === 6 ? "linear-gradient(135deg, #C8952A, #E2B04A)" : "rgba(200,149,42,0.3)",
                  color: "white",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "none",
                  cursor: otpValue.length === 6 && step !== "verifying" ? "pointer" : "not-allowed",
                  boxShadow: otpValue.length === 6 ? "0 4px 20px rgba(200,149,42,0.35)" : "none",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}>
                
                  {step === "verifying" ?
                <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying…
                    </> :

                "Verify & Unlock"
                }
                </motion.button>
                <button
                onClick={() => {setStep("phone");setOtpValue("");}}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#94A3B8",
                  textDecoration: "underline", textUnderlineOffset: 2
                }}>
                
                  Use a different number
                </button>
              </motion.div>
            }
          </AnimatePresence>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#94A3B8", marginTop: 16 }}>
            We'll text a 6-digit code. No spam, ever.
          </p>
        </div>
      </div>
    </div>);

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