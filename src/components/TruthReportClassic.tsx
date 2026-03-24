import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Ruler, DollarSign, FileText, ShieldCheck, Copy, Check, ChevronDown, ChevronUp, Users, Phone, Loader2, ChevronRight, MapPin, Wrench, Award } from "lucide-react";
import { LockedOverlay } from "@/components/LockedOverlay";
import type { LockedOverlayProps } from "@/components/LockedOverlay";
import type { AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";
import { MATCH_REASON_HOMEOWNER, type MatchReasonKey, type MatchConfidence } from "@/shared/matchReasons";

export interface SuggestedMatch {
  confidence: MatchConfidence;
  reasons: string[];
  contractor_alias: string;
}

interface TruthReportProps {
  grade: string;
  flags: AnalysisFlag[];
  pillarScores: PillarScore[];
  contractorName: string | null;
  county: string;
  confidenceScore: number | null;
  documentType: string | null;
  accessLevel: "preview" | "full";
  qualityBand?: "good" | "fair" | "poor" | null;
  hasWarranty?: boolean | null;
  hasPermits?: boolean | null;
  pageCount?: number | null;
  lineItemCount?: number | null;
  flagCount?: number;
  flagRedCount?: number;
  flagAmberCount?: number;
  onContractorMatchClick: () => void;
  onReportHelpCall: () => void;
  onSecondScan: () => void;
  gateProps?: Omit<LockedOverlayProps, "grade" | "flagCount">;
  /** CTA post-click state — managed by smart container */
  introRequested?: boolean;
  reportCallRequested?: boolean;
  isCtaLoading?: boolean;
  suggestedMatch?: SuggestedMatch | null;
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
  red: { border: "1.5px solid rgba(220,38,38,0.3)", borderLeft: "4px solid #DC2626", badgeBg: "rgba(220,38,38,0.12)", badgeColor: "#DC2626", badgeText: "⚠ CRITICAL", tipBg: "rgba(249,115,22,0.08)" },
  amber: { border: "1.5px solid rgba(245,158,11,0.3)", borderLeft: "4px solid #F59E0B", badgeBg: "rgba(245,158,11,0.12)", badgeColor: "#D97706", badgeText: "⚡ REVIEW", tipBg: "rgba(245,158,11,0.08)" },
  green: { border: "1.5px solid rgba(5,150,105,0.3)", borderLeft: "4px solid #059669", badgeBg: "rgba(5,150,105,0.12)", badgeColor: "#059669", badgeText: "✓ CONFIRMED", tipBg: "" }
};

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.15, ease: 'easeInOut' as const }
}) as const;

const TruthReportClassic = ({
  grade,
  flags,
  pillarScores,
  contractorName,
  county,
  confidenceScore,
  documentType,
  accessLevel,
  qualityBand,
  hasWarranty,
  hasPermits,
  pageCount,
  lineItemCount,
  flagCount: flagCountProp,
  flagRedCount: flagRedCountProp,
  flagAmberCount: flagAmberCountProp,
  onContractorMatchClick,
  onReportHelpCall,
  onSecondScan,
  gateProps,
  introRequested = false,
  reportCallRequested = false,
  isCtaLoading = false,
  suggestedMatch = null,
}: TruthReportProps) => {
  const config = gradeConfig[grade] || gradeConfig.C;
  const isFull = accessLevel === "full";
  const [copied, setCopied] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());

  // In full mode, derive from actual flags array.
  // In preview mode, flags is [] — use aggregate props from backend.
  const flagsDerivedRed = flags.filter((f) => f.severity === "red").length;
  const flagsDerivedAmber = flags.filter((f) => f.severity === "amber").length;
  const flagsDerivedGreen = flags.filter((f) => f.severity === "green").length;

  const redCount = isFull ? flagsDerivedRed : (flagRedCountProp ?? flagsDerivedRed);
  const amberCount = isFull ? flagsDerivedAmber : (flagAmberCountProp ?? flagsDerivedAmber);
  const greenCount = isFull ? flagsDerivedGreen : Math.max(0, (flagCountProp ?? 0) - (flagRedCountProp ?? 0) - (flagAmberCountProp ?? 0));
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
            {isFull && confidenceScore != null &&
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
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-3">
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: config.color, letterSpacing: "0.06em", background: "#0A0A0A", borderRadius: 0, padding: "4px 14px", border: `1px solid ${config.color}` }}>
                GRADE {grade} — {config.label}
              </span>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#E5E7EB" }}>{config.verdict}</p>
          </div>

          {/* Summary chips — affirmative only, preview mode */}
          {!isFull && (
            <div className="flex flex-wrap gap-2 mt-3">
              {qualityBand && (
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700,
                  color: qualityBand === "good" ? "#059669" : qualityBand === "fair" ? "#D97706" : "#9CA3AF",
                  background: qualityBand === "good" ? "rgba(5,150,105,0.12)" : qualityBand === "fair" ? "rgba(245,158,11,0.12)" : "rgba(156,163,175,0.12)",
                  padding: "3px 10px", letterSpacing: "0.06em",
                }}>
                  {qualityBand === "good" ? "GOOD QUOTE STRUCTURE" : qualityBand === "fair" ? "FAIR QUOTE STRUCTURE" : "BASIC QUOTE STRUCTURE"}
                </span>
              )}
              {hasWarranty === true && (
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700,
                  color: "#059669", background: "rgba(5,150,105,0.12)",
                  padding: "3px 10px", letterSpacing: "0.06em",
                }}>
                  WARRANTY: FOUND
                </span>
              )}
              {hasPermits === true && (
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700,
                  color: "#059669", background: "rgba(5,150,105,0.12)",
                  padding: "3px 10px", letterSpacing: "0.06em",
                }}>
                  PERMITS: FOUND
                </span>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── PROOF-OF-READ TRUST STRIP (preview only) ─── */}
      {!isFull && (pageCount != null || lineItemCount != null || contractorName) && (
        <motion.section {...stagger(0.5)} className="py-3 px-4 md:px-8" style={{ background: "#111111", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1">
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#2563EB", letterSpacing: "0.1em", fontWeight: 700 }}>
              DOCUMENT VERIFIED
            </span>
            {pageCount != null && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                Multi-page document analyzed
              </span>
            )}
            {lineItemCount != null && lineItemCount > 0 && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                · Detailed line items detected
              </span>
            )}
            {contractorName && (
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>
                · Contractor identified
              </span>
            )}
            {confidenceScore != null && (
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, marginLeft: "auto",
                color: confidenceScore >= 85 ? "#059669" : confidenceScore >= 70 ? "#059669" : confidenceScore >= 55 ? "#2563EB" : "#D97706",
                background: confidenceScore >= 55 ? "rgba(5,150,105,0.12)" : "rgba(217,119,6,0.12)",
                padding: "2px 10px", letterSpacing: "0.06em",
              }}>
                READ QUALITY: {confidenceScore >= 85 ? "EXCELLENT" : confidenceScore >= 70 ? "GREAT" : confidenceScore >= 55 ? "GOOD" : "FAIR"}
              </span>
            )}
          </div>
        </motion.section>
      )}

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

                  {isFull && pillar.score != null ?
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

          // ── LOCKED: render stateless LockedOverlay with gate props from orchestrator ──
          gateProps ? (
            <LockedOverlay
              grade={grade}
              flagCount={issueCount}
              {...gateProps}
            />
          ) : (
            // Fallback if no gateProps provided (e.g. dev/demo without orchestrator)
            <div className="py-12 text-center">
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#94A3B8" }}>
                Verify your phone to unlock findings.
              </p>
            </div>
          )
          }

          {/* Summary bar */}
          <div style={{ background: "#0A0A0A", borderRadius: 0, padding: "14px 20px", marginTop: 16 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "white" }}>
              {redCount} critical, {amberCount} caution, {greenCount} confirmed across 5 pillars.
            </p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f7f7f7" }}>Grade {grade} · {isFull ? flags.length : (flagCountProp ?? flags.length)} items reviewed</p>
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
              background: copied ? "rgba(5,150,105,0.12)" : "#111111", border: `1px solid ${copied ? "rgba(5,150,105,0.3)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 0, padding: "6px 14px",
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
              color: copied ? "#059669" : "#E5E7EB", cursor: "pointer",
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
      {accessLevel === "full" && (
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
      )}

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

export default TruthReportClassic;
