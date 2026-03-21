/**
 * TruthReportFindings — Findings-first post-scan report.
 *
 * Preview mode: findings are fully locked (severity color + pillar only).
 * Single dominant CTA: inline VerifyGate. All other lock indicators are
 * passive labels that reinforce the gate without competing.
 *
 * Full mode: all findings, details, tips, and negotiation tools revealed.
 */

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileWarning,
  Lock,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import type { AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";
import { VerifyGate } from "./VerifyGate";
import { PhoneVerifyModal } from "./PhoneVerifyModal";

/* ── Data contract ────────────────────────────────────────────── */

interface V2Props {
  analysis: {
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
    onContractorMatchClick: () => void;
    onSecondScan: () => void;
    scanSessionId?: string | null;
  };
}

/* ── Verdict copy ─────────────────────────────────────────────── */

const VERDICT: Record<string, { headline: string; sub: string; tone: "clear" | "mixed" | "problem" }> = {
  A: { headline: "This quote checks out.", sub: "Our scan surfaced minimal concerns. Review the findings below.", tone: "clear" },
  B: { headline: "Mostly solid — a few items to watch.", sub: "Nothing deal-breaking, but worth reading before you sign.", tone: "clear" },
  C: { headline: "Several areas need your attention.", sub: "We found issues that could cost you money or create problems post-install.", tone: "mixed" },
  D: { headline: "Significant gaps in this quote.", sub: "Do not sign until the items below are addressed.", tone: "problem" },
  F: { headline: "This quote has critical problems.", sub: "Multiple red flags detected. We strongly recommend getting a second opinion.", tone: "problem" },
};

const toneColor: Record<string, string> = {
  clear: "text-emerald",
  mixed: "text-gold",
  problem: "text-vivid-orange",
};

/* ── Severity tokens ──────────────────────────────────────────── */

const SEV = {
  red: {
    tag: "CRITICAL",
    border: "border-l-vivid-orange",
    badge: "bg-vivid-orange/10 text-vivid-orange",
    icon: <ShieldAlert size={16} className="text-vivid-orange shrink-0" />,
    dot: "bg-vivid-orange",
  },
  amber: {
    tag: "REVIEW",
    border: "border-l-gold",
    badge: "bg-gold/10 text-gold",
    icon: <AlertTriangle size={16} className="text-gold shrink-0" />,
    dot: "bg-gold",
  },
  green: {
    tag: "CONFIRMED",
    border: "border-l-emerald",
    badge: "bg-emerald/10 text-emerald",
    icon: <CheckCircle2 size={16} className="text-emerald shrink-0" />,
    dot: "bg-emerald",
  },
};

/* ── Coverage map ─────────────────────────────────────────────── */

const COVERAGE_AREAS = [
  { key: "safety_code", label: "Safety & Code" },
  { key: "install_scope", label: "Scope & Install" },
  { key: "price_fairness", label: "Pricing" },
  { key: "fine_print", label: "Fine Print" },
  { key: "warranty", label: "Warranty" },
];

type CoverageState = "reviewed" | "flagged" | "not-assessed";

function deriveCoverage(
  pillarScores: PillarScore[],
  flags: AnalysisFlag[]
): { key: string; label: string; state: CoverageState }[] {
  return COVERAGE_AREAS.map(({ key, label }) => {
    const pillar = pillarScores.find((p) => p.key === key);
    const hasFlags = flags.some((f) => f.pillar === key && f.severity !== "green");
    if (hasFlags) return { key, label, state: "flagged" as const };
    if (pillar && pillar.status !== "pending") return { key, label, state: "reviewed" as const };
    return { key, label, state: "not-assessed" as const };
  });
}

/* ── Animations ───────────────────────────────────────────────── */

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

/* ── Component ────────────────────────────────────────────────── */

export function TruthReportFindings({ analysis }: V2Props) {
  const {
    grade,
    flags,
    pillarScores,
    county,
    confidenceScore,
    documentType,
    accessLevel,
    hasWarranty,
    hasPermits,
    pageCount,
    lineItemCount,
    onContractorMatchClick,
    onSecondScan,
    scanSessionId,
  } = analysis;

  const [modalOpen, setModalOpen] = useState(false);
  const [verified, setVerified] = useState(false);

  const isPreview = accessLevel === "preview" && !verified;
  const verdict = VERDICT[grade] || VERDICT.C;
  const tone = toneColor[verdict.tone];

  const sortedFlags = [...flags].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    return order[a.severity] - order[b.severity];
  });
  const topFindings = sortedFlags.slice(0, 6);
  const remainingCount = sortedFlags.length - topFindings.length;

  const coverage = deriveCoverage(pillarScores, flags);
  const redCount = flags.filter((f) => f.severity === "red").length;
  const amberCount = flags.filter((f) => f.severity === "amber").length;
  const issueCount = redCount + amberCount;

  const handleVerified = () => {
    setVerified(true);
    setModalOpen(false);
  };

  return (
    <>
      <section className="w-full max-w-[820px] mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* ── Verdict header ─────────────────────────────────── */}
        <motion.div {...fadeUp(0)} className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">
            WINDOWMAN TRUTH REPORT™
          </p>
          <h1 className={`font-heading text-3xl sm:text-4xl font-black uppercase leading-[0.95] ${tone}`}>
            {verdict.headline}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-foreground/70 max-w-[600px]">
            {verdict.sub}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground tracking-wide">
            {county && county !== "your county" && <span>{county}</span>}
            {documentType && <span>{documentType}</span>}
            {pageCount != null && <span>{pageCount} pg</span>}
            {lineItemCount != null && <span>{lineItemCount} line items</span>}
            {!isPreview && confidenceScore != null && (
              <span>Confidence {confidenceScore}%</span>
            )}
          </div>
        </motion.div>

        {/* ── ① Verify Banner (preview only) ──────────────────── */}
        {isPreview && (
          <VerifyBanner onVerifyClick={() => setModalOpen(true)} />
        )}

        {/* ── Quick tally ────────────────────────────────────── */}
        {(redCount > 0 || amberCount > 0) && (
          <motion.div {...fadeUp(0.08)} className="mb-8 flex flex-wrap gap-3">
            {redCount > 0 && (
              <div className="flex items-center gap-2 border border-vivid-orange/20 bg-vivid-orange/5 px-4 py-2">
                <ShieldAlert size={14} className="text-vivid-orange" />
                <span className="text-sm font-semibold text-vivid-orange">
                  {redCount} critical {redCount === 1 ? "issue" : "issues"}
                </span>
              </div>
            )}
            {amberCount > 0 && (
              <div className="flex items-center gap-2 border border-gold/20 bg-gold/5 px-4 py-2">
                <AlertTriangle size={14} className="text-gold" />
                <span className="text-sm font-semibold text-gold">
                  {amberCount} {amberCount === 1 ? "item" : "items"} to review
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Findings ─────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.14)} className="mb-12">
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-4">
            FINDINGS
          </p>

          <div className="flex flex-col gap-px bg-surface-border">
            {isPreview ? (
              /* ── PREVIEW: group by pillar, show worst severity + count ── */
              (() => {
                const pillarMap = new Map<string, { pillar: string; count: number; worstSeverity: "red" | "amber" | "green" }>();
                const sevOrder = { red: 0, amber: 1, green: 2 };
                for (const flag of sortedFlags) {
                  const key = flag.pillar || "_general";
                  const existing = pillarMap.get(key);
                  if (!existing) {
                    pillarMap.set(key, { pillar: key, count: 1, worstSeverity: flag.severity });
                  } else {
                    existing.count++;
                    if (sevOrder[flag.severity] < sevOrder[existing.worstSeverity]) {
                      existing.worstSeverity = flag.severity;
                    }
                  }
                }
                return Array.from(pillarMap.values()).map((group, i) => {
                  const sev = SEV[group.worstSeverity];
                  const pillarLabel = COVERAGE_AREAS.find((c) => c.key === group.pillar)?.label || group.pillar || "General";
                  return (
                    <motion.button
                      key={group.pillar}
                      {...fadeUp(0.18 + i * 0.06)}
                      onClick={() => setModalOpen(true)}
                      className={`relative bg-surface border-l-[3px] ${sev.border} px-5 py-4 text-left w-full transition-colors hover:bg-surface-border/30 group cursor-pointer`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${sev.dot} shrink-0`} />
                        <span className="text-xs font-mono text-muted-foreground tracking-wide">
                          {pillarLabel}
                        </span>
                        {group.count > 1 && (
                          <span className={`text-[10px] font-mono font-bold ${sev.badge} px-1.5 py-0.5`}>
                            {group.count} findings
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-gold font-mono opacity-70 group-hover:opacity-100 transition-opacity">
                          <Lock size={11} />
                          Verify to read →
                        </span>
                      </div>
                    </motion.button>
                  );
                });
              })()
            ) : (
              /* ── FULL: show everything ── */
              topFindings.map((flag, i) => {
                const sev = SEV[flag.severity];
                return (
                  <motion.div
                    key={flag.id}
                    {...fadeUp(0.18 + i * 0.06)}
                    className={`relative bg-surface border-l-[3px] ${sev.border} px-5 py-4`}
                  >
                    <div className="flex items-start gap-3">
                      {sev.icon}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider ${sev.badge}`}>
                            {sev.tag}
                          </span>
                          {flag.pillar && (
                            <span className="text-[10px] font-mono text-muted-foreground tracking-wide">
                              {COVERAGE_AREAS.find((c) => c.key === flag.pillar)?.label || flag.pillar}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground leading-snug">
                          {flag.label}
                        </h3>
                        <p className="mt-1.5 text-xs text-foreground/60 leading-relaxed">
                          {flag.detail}
                        </p>
                        {flag.tip && (
                          <p className="mt-2 text-xs text-foreground/50 italic border-t border-surface-border pt-2">
                            {flag.tip}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {!isPreview && remainingCount > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              + {remainingCount} more {remainingCount === 1 ? "finding" : "findings"}
            </p>
          )}
        </motion.div>

        {/* ── ③ Inline Verify Gate (preview only, above evidence) ── */}
        {isPreview && (
          <VerifyGate
            issueCount={issueCount}
            onVerified={handleVerified}
            scanSessionId={scanSessionId}
          />
        )}

        {/* ── Evidence ─────────────────────────────────────────── */}
        {isPreview ? (
          <motion.div {...fadeUp(0.4)} className="mb-12 relative">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-4">
              EVIDENCE
            </p>
            <div className="relative overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-surface-border opacity-30 blur-[2px] select-none pointer-events-none" aria-hidden="true">
                {["Warranty", "Permits", "Product Specs"].map((label) => (
                  <div key={label} className="bg-surface px-4 py-5 flex flex-col items-center justify-center gap-2 text-center">
                    <Eye size={18} className="text-muted-foreground/40" />
                    <span className="text-[11px] font-mono text-muted-foreground tracking-wide">{label}</span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 bg-surface/90 border border-surface-border px-4 py-2.5 text-xs font-mono text-gold hover:bg-surface transition-colors"
                >
                  <Lock size={12} />
                  Verify to view evidence
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div {...fadeUp(0.4)} className="mb-12">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-4">
              EVIDENCE
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-surface-border">
              {[
                { label: "Warranty", present: hasWarranty },
                { label: "Permits", present: hasPermits },
                { label: "Product Specs", present: lineItemCount != null && lineItemCount > 0 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-surface px-4 py-5 flex flex-col items-center justify-center gap-2 text-center"
                >
                  {item.present === true ? (
                    <Eye size={18} className="text-emerald" />
                  ) : item.present === false ? (
                    <FileWarning size={18} className="text-vivid-orange" />
                  ) : (
                    <Eye size={18} className="text-muted-foreground/40" />
                  )}
                  <span className="text-[11px] font-mono text-muted-foreground tracking-wide">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-foreground/50">
                    {item.present === true
                      ? "Found in document"
                      : item.present === false
                      ? "Not found"
                      : "Not assessed"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Coverage map ─────────────────────────────────────── */}
        {isPreview ? (
          <motion.div {...fadeUp(0.5)} className="mb-12 relative">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-4">
              COVERAGE MAP
            </p>
            <div className="relative overflow-hidden">
              <div className="flex flex-wrap gap-2 opacity-25 blur-[2px] select-none pointer-events-none" aria-hidden="true">
                {COVERAGE_AREAS.map((area) => (
                  <div key={area.key} className="border border-surface-border bg-surface text-muted-foreground px-3 py-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    <span className="text-xs font-medium">{area.label}</span>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 bg-surface/90 border border-surface-border px-4 py-2.5 text-xs font-mono text-gold hover:bg-surface transition-colors"
                >
                  <Lock size={12} />
                  Verify to view coverage
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div {...fadeUp(0.5)} className="mb-12">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-4">
              COVERAGE MAP
            </p>
            <p className="text-xs text-foreground/50 mb-4">
              Areas of your quote that our scan reviewed. This is not a judgment — it shows what was assessed.
            </p>
            <div className="flex flex-wrap gap-2">
              {coverage.map((area) => {
                const stateStyles: Record<CoverageState, string> = {
                  reviewed: "border-emerald/30 bg-emerald/5 text-emerald",
                  flagged: "border-vivid-orange/30 bg-vivid-orange/5 text-vivid-orange",
                  "not-assessed": "border-surface-border bg-surface text-muted-foreground",
                };
                const stateLabel: Record<CoverageState, string> = {
                  reviewed: "Reviewed",
                  flagged: "Flagged",
                  "not-assessed": "Not assessed",
                };
                return (
                  <div
                    key={area.key}
                    className={`border px-3 py-2 flex items-center gap-2 ${stateStyles[area.state]}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        area.state === "reviewed"
                          ? "bg-emerald"
                          : area.state === "flagged"
                          ? "bg-vivid-orange"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    <span className="text-xs font-medium">{area.label}</span>
                    <span className="text-[10px] opacity-60">{stateLabel[area.state]}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Actions ──────────────────────────────────────────── */}
        {isPreview ? (
          <motion.div {...fadeUp(0.6)} className="flex flex-col items-center gap-3 py-4">
            <p className="text-xs text-muted-foreground font-mono text-center">
              Counter-quote tools and next steps available after verification.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 border border-gold/30 bg-gold/5 text-gold px-6 py-3.5 text-sm font-semibold hover:bg-gold/10 transition-colors active:scale-[0.97]"
            >
              <Lock size={14} />
              Unlock Full Report
            </button>
          </motion.div>
        ) : (
          <motion.div {...fadeUp(0.6)} className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onContractorMatchClick}
              className="flex items-center justify-center gap-2 bg-cobalt text-primary-foreground px-6 py-3.5 text-sm font-semibold transition-[box-shadow] hover:shadow-[0_6px_24px_hsl(217_91%_53%/0.3)] active:scale-[0.97]"
            >
              Get a Counter-Quote
              <ArrowRight size={16} />
            </button>
            <button
              onClick={onSecondScan}
              className="flex items-center justify-center gap-2 border border-surface-border text-foreground/80 px-6 py-3.5 text-sm font-semibold hover:bg-surface transition-colors active:scale-[0.97]"
            >
              Scan Another Quote
            </button>
          </motion.div>
        )}

        {/* ── Footer stamp ─────────────────────────────────────── */}
        <motion.div {...fadeUp(0.65)} className="mt-16 pt-6 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[14px] font-bold text-foreground/70 tracking-wide">
              WindowMan Truth Report™
            </p>
            <p className="text-[12px] text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {county && county !== "your county" ? ` · ${county}` : ""}
              {` · Grade ${grade}`}
            </p>
          </div>
          <p className="text-[12px] text-muted-foreground">
            This report is private. Only you can access it.
          </p>
        </motion.div>
      </section>

      {/* ── Phone Verify Modal ─────────────────────────────────── */}
      <PhoneVerifyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onVerified={handleVerified}
        issueCount={issueCount}
        scanSessionId={scanSessionId}
      />
    </>
  );
}
