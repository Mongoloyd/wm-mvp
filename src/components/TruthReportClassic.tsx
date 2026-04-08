import { useEffect, useRef, useState } from "react";
import { trackGtmEvent } from "@/lib/trackConversion";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Users,
  Phone,
  Loader2,
  ChevronRight,
  MapPin,
  Wrench,
  Award,
} from "lucide-react";
import ForensicPillarSection from "@/components/report/ForensicPillarSection";
import RiskSummaryHeader from "@/components/report/RiskSummaryHeader";
import ExecutiveSummaryStrip from "@/components/report/ExecutiveSummaryStrip";
import RedFlagsList from "@/components/report/RedFlagsList";
import MissingItemsList from "@/components/report/MissingItemsList";
import FixItCTA from "@/components/report/FixItCTA";
import GapFixModule from "@/components/report/GapFixModule";
import GreenChecklistModule from "@/components/report/GreenChecklistModule";
import QuotePriceMath from "@/components/report/QuotePriceMath";
import type { DerivedMetrics } from "@/components/report/QuotePriceMath";
import { LockedOverlay } from "@/components/LockedOverlay";
import type { LockedOverlayProps } from "@/components/LockedOverlay";
import TopViolationSummaryStrip from "@/components/TopViolationSummaryStrip";
import CriticalFlagCard from "@/components/CriticalFlagCard";
import { selectTopViolation } from "@/utils/selectTopViolation";
import { mapFlagToExhibit } from "@/utils/evidenceMapping";
import { resolveEffectiveSeverity } from "@/utils/resolveEffectiveSeverity";
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
  derivedMetrics?: DerivedMetrics;
  priceFairness?: string | null;
  markupEstimate?: string | null;
  negotiationLeverage?: string | null;
  warnings?: (string | Record<string, unknown>)[];
  missingItems?: (string | Record<string, unknown>)[];
  summary?: string | null;
  topWarning?: string | null;
  topMissingItem?: string | null;
  pricePerOpening?: number | null;
  pricePerOpeningBand?: "low" | "market" | "high" | "extreme" | null;
  paymentRiskDetected?: boolean;
  scopeGapDetected?: boolean;
  summaryTeaser?: string | null;
  missingItemsCount?: number;
}

const gradeConfig: Record<string, { color: string; bg: string; glow: string; label: string; verdict: string }> = {
  A: {
    color: "hsl(var(--color-emerald))",
    bg: "hsl(var(--color-emerald) / 0.12)",
    glow: "hsl(var(--color-emerald) / 0.1)",
    label: "STRONG QUOTE",
    verdict: "This quote is well-structured and competitively priced.",
  },
  B: {
    color: "hsl(var(--color-lime))",
    bg: "hsl(var(--color-lime) / 0.12)",
    glow: "hsl(var(--color-lime) / 0.1)",
    label: "ACCEPTABLE",
    verdict: "This quote is acceptable with minor items worth addressing.",
  },
  C: {
    color: "hsl(var(--color-caution))",
    bg: "hsl(var(--color-caution) / 0.12)",
    glow: "hsl(var(--color-caution) / 0.1)",
    label: "REVIEW BEFORE SIGNING",
    verdict: "This quote has issues that could cost you money.",
  },
  D: {
    color: "hsl(var(--color-danger))",
    bg: "hsl(var(--color-danger) / 0.12)",
    glow: "hsl(var(--color-danger) / 0.1)",
    label: "SIGNIFICANT PROBLEMS",
    verdict: "Do Not Sign Without Renegotiating These Issues.",
  },
  F: {
    color: "hsl(var(--color-danger))",
    bg: "hsl(var(--color-danger) / 0.12)",
    glow: "hsl(var(--color-danger) / 0.1)",
    label: "CRITICAL ISSUES",
    verdict: "This quote has critical problems. You are likely being significantly overcharged.",
  },
};

// pillarIcons moved to ForensicPillarSection

const statusConfig = {
  pass: {
    color: "hsl(var(--color-emerald))",
    bg: "hsl(var(--color-emerald) / 0.12)",
    border: "hsl(var(--color-emerald) / 0.3)",
    label: "PASS",
  },
  warn: {
    color: "hsl(var(--color-caution))",
    bg: "hsl(var(--color-caution) / 0.12)",
    border: "hsl(var(--color-caution) / 0.3)",
    label: "REVIEW",
  },
  fail: {
    color: "hsl(var(--color-danger))",
    bg: "hsl(var(--color-danger) / 0.12)",
    border: "hsl(var(--color-danger) / 0.3)",
    label: "FAIL",
  },
  pending: {
    color: "hsl(var(--muted-foreground))",
    bg: "hsl(var(--secondary))",
    border: "hsl(var(--border))",
    label: "PENDING",
  },
};

const severityStyles = {
  red: {
    border: "1.5px solid hsl(var(--color-danger) / 0.3)",
    borderLeft: "4px solid hsl(var(--color-danger))",
    badgeBg: "hsl(var(--color-danger) / 0.12)",
    badgeColor: "hsl(var(--color-danger))",
    badgeText: "⚠ CRITICAL",
    tipBg: "hsl(var(--color-caution) / 0.08)",
  },
  amber: {
    border: "1.5px solid hsl(var(--color-caution) / 0.3)",
    borderLeft: "4px solid hsl(var(--color-caution))",
    badgeBg: "hsl(var(--color-caution) / 0.12)",
    badgeColor: "hsl(var(--color-caution))",
    badgeText: "⚡ REVIEW",
    tipBg: "hsl(var(--color-caution) / 0.08)",
  },
  green: {
    border: "1.5px solid hsl(var(--color-emerald) / 0.3)",
    borderLeft: "4px solid hsl(var(--color-emerald))",
    badgeBg: "hsl(var(--color-emerald) / 0.12)",
    badgeColor: "hsl(var(--color-emerald))",
    badgeText: "✓ CONFIRMED",
    tipBg: "",
  },
};

const stagger = (i: number) =>
  ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.04, duration: 0.15, ease: "easeInOut" as const },
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
  derivedMetrics,
  priceFairness,
  markupEstimate,
  negotiationLeverage,
  warnings,
  missingItems,
  summary,
  topWarning,
  topMissingItem,
  pricePerOpening,
  pricePerOpeningBand,
  paymentRiskDetected,
  scopeGapDetected,
  summaryTeaser,
  missingItemsCount,
}: TruthReportProps) => {
  const config = gradeConfig[grade] || gradeConfig.C;
  const isFull = accessLevel === "full";
  const [copied, setCopied] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());
  const [activeModule, setActiveModule] = useState<"none" | "gapFix" | "greenChecklist">("none");
  const copyTimeoutRef = useRef<number | null>(null);

  // In full mode, derive from actual flags array using effective severity.
  // In preview mode, flags is [] — use aggregate props from backend.
  const flagsDerivedRed = flags.filter((f) => resolveEffectiveSeverity(f) === "red").length;
  const flagsDerivedAmber = flags.filter((f) => resolveEffectiveSeverity(f) === "amber").length;
  const flagsDerivedGreen = flags.filter((f) => resolveEffectiveSeverity(f) === "green").length;

  // Preview mode: ALWAYS use aggregate props — flags array is intentionally empty
  const redCount = isFull ? flagsDerivedRed : (flagRedCountProp ?? 0);
  const amberCount = isFull ? flagsDerivedAmber : (flagAmberCountProp ?? 0);
  const totalFlagCount = isFull ? flags.length : (flagCountProp ?? 0);
  const greenCount = isFull ? flagsDerivedGreen : Math.max(0, totalFlagCount - redCount - amberCount);
  const issueCount = redCount + amberCount;

  const summaryParts = [
    redCount > 0 ? `${redCount} critical` : null,
    amberCount > 0 ? `${amberCount} review` : null,
    greenCount > 0 ? `${greenCount} clear` : null,
  ].filter(Boolean);

  const summaryText = summaryParts.length > 0 ? summaryParts.join(", ") : "no issues";

  const displayName = contractorName || "Your Contractor";

  const toggleFlag = (id: number) => {
    setExpandedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const redFlags = flags.filter((f) => resolveEffectiveSeverity(f) === "red");
  const amberFlags = flags.filter((f) => resolveEffectiveSeverity(f) === "amber");

  const scriptText = `Hi ${displayName},

I've had a chance to review your quote in more detail and I have a few questions before I can move forward.

${redFlags.map((f, i) => `${i + 1}. Regarding "${f.label}" — ${f.detail}`).join("\n\n")}

${amberFlags.length > 0 ? `I also have ${amberFlags.length} additional item${amberFlags.length !== 1 ? "s" : ""} I'd like to discuss before finalizing.` : ""}

I'm ready to move forward if we can get these items addressed. What's the fastest way to get a revised quote?`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    setCopied(true);
    copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2500);
  };

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  const reportDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="bg-background min-h-screen">
      {/* ─── REPORT HEADER ─── */}
      <section className="bg-background border-b border-border py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--color-emerald))" }} />
              <span className="wm-eyebrow" style={{ color: "hsl(var(--color-emerald))" }}>
                ANALYSIS COMPLETE
              </span>
            </div>
            <h1
              className="font-display text-foreground"
              style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              WindowMan Truth Report™
            </h1>
            <p className="font-body text-muted-foreground mt-1" style={{ fontSize: 16 }}>
              {county} County · {reportDate} · {documentType ? humanizeDocType(documentType) : "Quote Document"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isFull && confidenceScore != null && confidenceScore >= 40 && (
              <div className="text-right hidden md:block">
                <p className="font-mono text-muted-foreground" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
                  CONFIDENCE
                </p>
                <p
                  className="font-mono"
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: confidenceScore >= 70 ? "hsl(var(--color-emerald))" : "hsl(var(--color-caution))",
                  }}
                >
                  {Math.round(confidenceScore)}%
                </p>
              </div>
            )}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, ease: "easeInOut" as const }}
              className="flex items-center justify-center bg-background"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `4px solid ${config.color}`,
                boxShadow: `0 0 0 6px ${config.glow}`,
              }}
            >
              <span
                className="font-display"
                style={{ fontSize: 48, fontWeight: 900, color: config.color, lineHeight: 1 }}
              >
                {grade}
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── GRADE VERDICT ─── */}
      <motion.section
        {...stagger(0)}
        style={{ background: config.bg, borderBottom: `2px solid ${config.color}` }}
        className="py-5 px-4 md:px-8"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-3">
              <span
                className="font-mono card-raised"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: config.color,
                  letterSpacing: "0.06em",
                  padding: "4px 14px",
                  border: `1px solid ${config.color}`,
                }}
              >
                GRADE {grade} — {config.label}
              </span>
            </div>
            <p className="font-body text-foreground/90" style={{ fontSize: 16 }}>
              {config.verdict}
            </p>
          </div>

          {/* Summary chips — preview mode, no misleading green chips */}
          {!isFull && (
            <div className="flex flex-wrap gap-2 mt-3">
              {/* qualityBand, hasWarranty, hasPermits chips removed —
                  they created false confidence and duplicated findings */}
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── EXECUTIVE SUMMARY (full mode) ─── */}
      {isFull && (
        <ExecutiveSummaryStrip
          summary={summary}
          pricePerOpening={pricePerOpening}
          pricePerOpeningBand={pricePerOpeningBand}
        />
      )}

      {/* ─── LOCKED PREVIEW TEASER (preview mode) ─── */}
      {!isFull && (topWarning || topMissingItem || summaryTeaser) && (
        <div className="card-raised py-4 px-4 md:px-8 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <span className="wm-eyebrow" style={{ color: "hsl(var(--color-caution))" }}>
              LOCKED PREVIEW
            </span>
            <p className="font-body text-foreground" style={{ fontSize: 15, lineHeight: 1.7, marginTop: 6 }}>
              {summaryTeaser || topWarning || "We found several quote issues worth reviewing."}
            </p>
            <p
              className="font-mono text-muted-foreground"
              style={{ fontSize: 12, marginTop: 6, letterSpacing: "0.04em" }}
            >
              {missingItemsCount ?? 0} missing contract item{(missingItemsCount ?? 0) !== 1 ? "s" : ""} detected
              {topMissingItem ? ` · Example: ${topMissingItem}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* ─── RISK SUMMARY HEADER ─── */}
      <RiskSummaryHeader
        flags={flags}
        flagRedCount={flagRedCountProp}
        flagAmberCount={flagAmberCountProp}
        accessLevel={accessLevel}
      />

      {/* ─── PROOF-OF-READ TRUST STRIP (preview only) ─── */}
      {!isFull && (pageCount != null || lineItemCount != null || contractorName) && (
        <motion.section {...stagger(0.5)} className="card-raised py-3 px-4 md:px-8 border-b border-border">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="wm-eyebrow text-primary">DOCUMENT VERIFIED</span>
            {pageCount != null && pageCount > 1 && (
              <span className="font-mono text-muted-foreground" style={{ fontSize: 15 }}>
                Multi-page document analyzed
              </span>
            )}
            {lineItemCount != null && lineItemCount > 0 && (
              <span className="font-mono text-muted-foreground" style={{ fontSize: 15 }}>
                · Detailed line items detected
              </span>
            )}
            {contractorName && (
              <span className="font-mono text-muted-foreground" style={{ fontSize: 15 }}>
                · Contractor identified
              </span>
            )}
            {confidenceScore != null && confidenceScore >= 55 && (
              <span
                className="font-mono"
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginLeft: "auto",
                  color: "hsl(var(--color-emerald))",
                  background: "hsl(var(--color-emerald) / 0.12)",
                  padding: "2px 10px",
                  letterSpacing: "0.06em",
                }}
              >
                READ QUALITY: {confidenceScore >= 90 ? "EXCELLENT" : confidenceScore >= 70 ? "GOOD" : "FAIR"}
              </span>
            )}
          </div>
        </motion.section>
      )}

      {/* ─── TOP VIOLATION SUMMARY STRIP (preview only — avoid chip+card duplication) ─── */}
      {!isFull &&
        (() => {
          const topViolation = selectTopViolation(flags, grade);
          if (!topViolation) return null;
          return (
            <section className="py-4 px-4 md:px-12 bg-background">
              <div className="max-w-4xl mx-auto">
                <TopViolationSummaryStrip
                  title={topViolation.title}
                  consequence={topViolation.consequence}
                  impactLabel={topViolation.impactLabel}
                  severity={topViolation.severity}
                  locked={!isFull}
                />
              </div>
            </section>
          );
        })()}

      {/* ─── 5-PILLAR ANALYSIS (ForensicPillarSection) ─── */}
      <ForensicPillarSection pillarScores={pillarScores} flags={flags} county={county} isFull={isFull} />

      {/* ─── QUOTE PRICE MATH (full only) ─── */}
      {isFull && derivedMetrics && <QuotePriceMath metrics={derivedMetrics} county={county} />}

      {/* ─── FINANCIAL FORENSICS (full only) ─── */}
      {isFull && (priceFairness || markupEstimate || negotiationLeverage) && (
        <section className="py-10 md:py-14 px-4 md:px-20 bg-background border-b border-border">
          <div className="max-w-4xl mx-auto space-y-4">
            <motion.div {...stagger(2.5)}>
              <span className="wm-eyebrow" style={{ color: "hsl(var(--color-gold-accent))" }}>
                FINANCIAL FORENSICS
              </span>
              <h2 className="wm-title-section text-foreground" style={{ marginTop: 4, marginBottom: 16 }}>
                What You're Really Paying
              </h2>
            </motion.div>

            {markupEstimate && (
              <motion.div
                {...stagger(2.6)}
                className="card-raised"
                style={{
                  borderLeft: "4px solid hsl(var(--color-danger))",
                  padding: "24px 28px",
                }}
              >
                <p
                  className="font-mono"
                  style={{ fontSize: 10, color: "hsl(var(--color-danger))", letterSpacing: "0.1em", marginBottom: 8 }}
                >
                  ESTIMATED MARKUP
                </p>
                <p
                  className="font-display text-foreground"
                  style={{
                    fontSize: "clamp(28px, 5vw, 40px)",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                  }}
                >
                  {markupEstimate}
                </p>
                <p className="font-body text-muted-foreground" style={{ fontSize: 13, marginTop: 8 }}>
                  Over standard Florida wholesale + labor baseline
                </p>
              </motion.div>
            )}

            {priceFairness && (
              <motion.div
                {...stagger(2.7)}
                className="card-raised"
                style={{
                  borderLeft: "4px solid hsl(var(--color-caution))",
                  padding: "24px 28px",
                }}
              >
                <p
                  className="font-mono"
                  style={{ fontSize: 10, color: "hsl(var(--color-caution))", letterSpacing: "0.1em", marginBottom: 8 }}
                >
                  PRICE FAIRNESS ASSESSMENT
                </p>
                <p className="font-body text-foreground" style={{ fontSize: 15, lineHeight: 1.7 }}>
                  {priceFairness}
                </p>
              </motion.div>
            )}

            {negotiationLeverage && (
              <motion.div
                {...stagger(2.8)}
                className="card-raised"
                style={{
                  borderLeft: "4px solid hsl(var(--color-cyan))",
                  padding: "24px 28px",
                }}
              >
                <p
                  className="font-mono"
                  style={{ fontSize: 10, color: "hsl(var(--color-cyan))", letterSpacing: "0.1em", marginBottom: 8 }}
                >
                  USE THIS SCRIPT
                </p>
                <p
                  className="font-body text-foreground"
                  style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-line" }}
                >
                  {negotiationLeverage}
                </p>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ─── RED FLAGS + MISSING ITEMS (full mode) ─── */}
      {isFull && <RedFlagsList warnings={warnings ?? []} />}
      {isFull && <MissingItemsList missingItems={missingItems ?? []} />}

      <section className="py-10 md:py-14 px-4 md:px-14 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto">
          <motion.div {...stagger(3)}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
              <div>
                <span className="wm-eyebrow" style={{ color: "hsl(var(--color-danger))" }}>
                  FORENSIC FINDINGS
                </span>
                <h2 className="wm-title-section text-foreground" style={{ marginTop: 4 }}>
                  {issueCount === 0 && !isFull
                    ? "Findings Pending"
                    : `${issueCount} Forensic Finding${issueCount !== 1 ? "s" : ""}`}
                </h2>
                <p className="font-body text-muted-foreground" style={{ fontSize: 18 }}>
                  {redCount} critical · {amberCount} review{greenCount > 0 ? ` · ${greenCount} clear` : ""}
                </p>
              </div>
              <div
                className="hidden md:block"
                style={{
                  background: "hsl(var(--color-cyan) / 0.12)",
                  border: "1px solid hsl(var(--color-cyan))",
                  borderRadius: "var(--radius-btn)",
                  padding: "6px 12px",
                }}
              >
                <span
                  className="font-mono"
                  style={{ fontSize: 16, color: "hsl(var(--color-cyan))", letterSpacing: "0.08em" }}
                >
                  {county.toUpperCase()} COUNTY BENCHMARKS
                </span>
              </div>
            </div>
          </motion.div>

          {isFull ? (
            <div className="flex flex-col gap-3">
              {/* ── CRITICAL FLAG CARDS (max 2) ── */}
              {(() => {
                const MAX_CRITICAL = 2;
                const criticals = flags
                  .filter((f) => resolveEffectiveSeverity(f) === "red")
                  .map((f) => ({ flag: f, exhibit: mapFlagToExhibit(f) }))
                  .filter((c) => c.exhibit && c.exhibit.hasHardEvidence)
                  .slice(0, MAX_CRITICAL);

                if (criticals.length === 0) return null;
                return (
                  <div className="flex flex-col gap-3 mb-4">
                    {criticals.map((c, i) => (
                      <CriticalFlagCard
                        key={`critical-${c.flag.id}`}
                        label={c.flag.label}
                        severity="critical"
                        pillar={c.flag.pillar ?? ""}
                        yourQuoteText={c.exhibit!.yourQuoteText}
                        benchmark={c.exhibit!.benchmark}
                        interpretation={c.exhibit!.interpretation}
                        hasHardEvidence={c.exhibit!.hasHardEvidence}
                        index={i}
                        isTopRanked={i === 0}
                      />
                    ))}
                  </div>
                );
              })()}

              {/* ── Regular flag cards ── */}
              {flags.map((flag, i) => {
                const effectiveSev = resolveEffectiveSeverity(flag);
                const s = severityStyles[effectiveSev];
                const isExpanded = expandedFlags.has(flag.id);
                const pillarLabel = pillarScores.find((p) => p.key === flag.pillar)?.label;

                return (
                  <motion.div
                    key={flag.id}
                    {...stagger(i * 0.5 + 4)}
                    className="card-raised overflow-hidden"
                    style={{
                      border: s.border,
                      borderLeft: s.borderLeft,
                    }}
                  >
                    <button
                      onClick={() => toggleFlag(flag.id)}
                      className="w-full text-left"
                      style={{ padding: "18px 20px 18px 24px", background: "none", border: "none", cursor: "pointer" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span
                              className="font-mono"
                              style={{
                                display: "inline-block",
                                background: s.badgeBg,
                                padding: "3px 10px",
                                fontSize: 12,
                                fontWeight: 700,
                                color: s.badgeColor,
                                letterSpacing: "0.06em",
                                borderRadius: "var(--radius-btn)",
                              }}
                            >
                              {s.badgeText}
                            </span>
                            {pillarLabel && (
                              <span
                                className="font-mono bg-secondary text-muted-foreground"
                                style={{
                                  fontSize: 11,
                                  letterSpacing: "0.06em",
                                  padding: "2px 8px",
                                  borderRadius: "var(--radius-btn)",
                                }}
                              >
                                {pillarLabel}
                              </span>
                            )}
                          </div>
                          <p className="font-body text-foreground" style={{ fontSize: 20, fontWeight: 700 }}>
                            {flag.label}
                          </p>
                        </div>
                        <div className="text-muted-foreground" style={{ flexShrink: 0, marginTop: 4 }}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        style={{ padding: "0 20px 20px 24px" }}
                      >
                        <div className="border-t border-border" style={{ paddingTop: 14 }}>
                          <p className="font-body text-foreground/90" style={{ fontSize: 14, lineHeight: 1.7 }}>
                            {flag.detail}
                          </p>

                          {flag.tip && (
                            <div
                              className="border border-border"
                              style={{
                                background: s.tipBg || "hsl(var(--card))",
                                borderRadius: "var(--radius-card)",
                                padding: "12px 16px",
                                marginTop: 14,
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start",
                              }}
                            >
                              <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                              <div>
                                <p
                                  className="font-mono"
                                  style={{
                                    fontSize: 12,
                                    color: "hsl(var(--color-gold-accent))",
                                    letterSpacing: "0.08em",
                                    fontWeight: 700,
                                    marginBottom: 4,
                                  }}
                                >
                                  WHAT TO DO
                                </p>
                                <p className="font-body text-foreground/90" style={{ fontSize: 13, lineHeight: 1.6 }}>
                                  {flag.tip}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : // ── LOCKED: render stateless LockedOverlay with gate props from orchestrator ──
          gateProps ? (
            <LockedOverlay grade={grade} flagCount={issueCount} {...gateProps} />
          ) : (
            // Fallback if no gateProps provided (e.g. dev/demo without orchestrator)
            <div className="py-12 text-center">
              <p className="font-body text-muted-foreground" style={{ fontSize: 16 }}>
                Verify your phone to unlock findings.
              </p>
            </div>
          )}

          {/* Summary bar */}
          <div
            className="card-raised flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            style={{ padding: "14px 20px", marginTop: 16 }}
          >
            <p className="font-body text-foreground" style={{ fontSize: 18 }}>
              {summaryText} across 5 pillars.
            </p>
            <div className="text-right">
              <p className="font-mono text-foreground" style={{ fontSize: 16 }}>
                Grade {grade} · {issueCount} Issue{issueCount !== 1 ? "s" : ""}
                {greenCount > 0 ? ` · ${greenCount} Confirmed` : ""}
              </p>
              <p className="text-muted-foreground font-sans font-semibold" style={{ fontSize: 14, marginTop: 2 }}>
                Analyzed Against 37 Industry-Standard Safety Signals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FIX-IT CTA ─── */}
      <FixItCTA
        redCount={redCount}
        amberCount={amberCount}
        accessLevel={accessLevel}
        onGetGapFix={() => setActiveModule(activeModule === "gapFix" ? "none" : "gapFix")}
        onGetGreenChecklist={() => setActiveModule(activeModule === "greenChecklist" ? "none" : "greenChecklist")}
      />

      {/* ─── GAP-FIX MODULE (full mode only) ─── */}
      {activeModule === "gapFix" && isFull && <GapFixModule flags={flags} onClose={() => setActiveModule("none")} />}

      {/* ─── GREEN CHECKLIST MODULE ─── */}
      {activeModule === "greenChecklist" && isFull && <GreenChecklistModule onClose={() => setActiveModule("none")} />}

      {/* ─── NEGOTIATION SCRIPT ─── */}
      {isFull && (
        <section className="py-10 md:py-14 px-4 md:px-12 bg-background border-b border-border">
          <div className="max-w-4xl mx-auto">
            <motion.div {...stagger(6)}>
              <span className="wm-eyebrow" style={{ color: "hsl(var(--color-cyan))" }}>
                NEGOTIATION TOOL
              </span>
              <h2 className="wm-title-section text-foreground" style={{ marginTop: 4, marginBottom: 6 }}>
                Your Word-for-Word Script
              </h2>
              <p className="font-body text-muted-foreground" style={{ fontSize: 18, marginBottom: 20 }}>
                Customized for {displayName} based on the {issueCount} issue{issueCount !== 1 ? "s" : ""} found in your
                quote.
              </p>
            </motion.div>

            <motion.div
              {...stagger(7)}
              className="card-raised"
              style={{
                borderLeft: "4px solid hsl(var(--color-cyan))",
                padding: "24px 28px",
                position: "relative",
              }}
            >
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 border border-border"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: copied ? "hsl(var(--color-emerald) / 0.12)" : "transparent",
                  borderColor: copied ? "hsl(var(--color-emerald) / 0.3)" : undefined,
                  borderRadius: "var(--radius-btn)",
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: copied ? "hsl(var(--color-emerald))" : "hsl(var(--foreground))",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy Script"}
              </button>

              <p
                className="font-mono"
                style={{ fontSize: 12, color: "hsl(var(--color-cyan))", letterSpacing: "0.1em", marginBottom: 16 }}
              >
                CALL SCRIPT · {displayName.toUpperCase()}
              </p>
              <p
                className="font-body text-foreground"
                style={{ fontSize: 15, lineHeight: 2.0, whiteSpace: "pre-line" }}
              >
                {scriptText}
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── CONTRACTOR MATCH CTA ─── */}
      {accessLevel === "full" && (
        <section id="cta-section" className="py-12 md:py-16 px-4 md:px-8 bg-background">
          <div className="max-w-4xl mx-auto text-center">
            {!introRequested && !reportCallRequested ? (
              /* ── PRE-CLICK: Dual CTAs ── */
              <>
                <motion.div {...stagger(8)}>
                  <span className="wm-eyebrow" style={{ color: "hsl(var(--color-gold-accent))" }}>
                    NEXT STEP
                  </span>
                  <h2
                    className="font-display text-foreground"
                    style={{
                      fontSize: "clamp(24px, 4vw, 32px)",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      marginTop: 8,
                      marginBottom: 8,
                    }}
                  >
                    Want a Contractor Who Will Do This job Right?
                  </h2>
                  <p
                    className="font-body text-foreground/90"
                    style={{ fontSize: 18, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.7 }}
                  >
                    Based on your Grade {grade} and the {issueCount} issue{issueCount !== 1 ? "s" : ""} found, I can
                    introduce you to a vetted {county} County contractor who quotes fair.
                  </p>
                </motion.div>

                <motion.div
                  {...stagger(9)}
                  className="flex flex-col items-center gap-3"
                  style={{ maxWidth: 520, margin: "0 auto" }}
                >
                  {/* Gold CTA — Counter-Quote / Introduction */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      trackGtmEvent("contractor_match_requested", {
                        grade,
                        county,
                        issue_count: issueCount,
                      });
                      onContractorMatchClick();
                    }}
                    disabled={isCtaLoading}
                    className={`flex items-center justify-center gap-2 w-full py-4 px-8 text-[17px] ${isCtaLoading ? "btn-depth-gold--pending" : "btn-depth-gold"}`}
                  >
                    {isCtaLoading ? <Loader2 size={18} className="animate-spin" /> : <Users size={20} />}
                    {isCtaLoading ? "Processing..." : "Get a Counter-Quote From a Vetted Contractor"}
                  </motion.button>

                  {/* Secondary CTA — Call About Report */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onReportHelpCall}
                    disabled={isCtaLoading}
                    className="btn-secondary-tactile flex items-center justify-center gap-2 w-full py-3.5 px-7 text-[15px]"
                  >
                    <Phone size={16} />
                    Call WindowMan About My Report
                  </motion.button>

                  {/* Scan Another Quote */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onSecondScan}
                    className="font-body text-muted-foreground hover:text-foreground transition-colors"
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 14,
                      fontWeight: 500,
                      padding: "8px 0",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Scan Another Quote →
                  </motion.button>
                </motion.div>

                <p
                  className="font-body text-muted-foreground"
                  style={{ fontSize: 14, fontStyle: "italic", marginTop: 20 }}
                >
                  No obligation. Free estimate. Your contractor never sees this report unless you share it.
                </p>
              </>
            ) : introRequested ? (
              /* ── POST-CLICK: Intro success + match card ── */
              <AnimatePresence mode="wait">
                <motion.div
                  key="intro-success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {suggestedMatch ? (
                    <div className="mx-auto text-left" style={{ maxWidth: 520, marginTop: 8 }}>
                      <h2
                        className="font-display text-foreground"
                        style={{
                          fontSize: "clamp(26px, 4vw, 32px)",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.02em",
                          textAlign: "center",
                          marginBottom: 20,
                        }}
                      >
                        Potential match found for your project
                      </h2>
                      {/* Match Card */}
                      <div
                        className="card-raised"
                        style={{ border: "1px solid hsl(var(--color-gold-accent) / 0.3)", padding: "28px 24px" }}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              width: 56,
                              height: 56,
                              background: "hsl(var(--color-gold-accent) / 0.1)",
                              border: "2px solid hsl(var(--color-gold-accent))",
                            }}
                          >
                            <span
                              className="font-mono"
                              style={{ fontSize: 16, fontWeight: 700, color: "hsl(var(--color-gold-accent))" }}
                            >
                              WM
                            </span>
                          </div>
                          <div>
                            <p className="font-body text-foreground" style={{ fontSize: 16, fontWeight: 700 }}>
                              WindowMan Verified Contractor
                            </p>
                            <p className="font-body text-muted-foreground" style={{ fontSize: 13 }}>
                              {county} County, Florida
                            </p>
                          </div>
                        </div>
                        {/* Confidence badge */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span
                            className="font-mono"
                            style={{
                              background:
                                suggestedMatch.confidence === "high"
                                  ? "hsl(var(--color-emerald) / 0.12)"
                                  : suggestedMatch.confidence === "medium"
                                    ? "hsl(var(--color-caution) / 0.12)"
                                    : "hsl(var(--muted-foreground) / 0.12)",
                              color:
                                suggestedMatch.confidence === "high"
                                  ? "hsl(var(--color-emerald))"
                                  : suggestedMatch.confidence === "medium"
                                    ? "hsl(var(--color-caution))"
                                    : "hsl(var(--muted-foreground))",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 10px",
                              letterSpacing: "0.08em",
                              borderRadius: "var(--radius-btn)",
                            }}
                          >
                            {suggestedMatch.confidence === "high"
                              ? "STRONG FIT"
                              : suggestedMatch.confidence === "medium"
                                ? "GOOD FIT"
                                : "POSSIBLE FIT"}
                          </span>
                          <span
                            className="font-mono"
                            style={{
                              background: "hsl(var(--color-emerald) / 0.1)",
                              color: "hsl(var(--color-emerald))",
                              fontSize: 10,
                              padding: "3px 10px",
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              borderRadius: "var(--radius-btn)",
                            }}
                          >
                            ✓ VETTED
                          </span>
                        </div>
                        {/* Fit Reasons */}
                        <div className="border-t border-border" style={{ paddingTop: 16, marginTop: 8 }}>
                          <p
                            className="font-mono text-muted-foreground"
                            style={{ fontSize: 9, letterSpacing: "0.1em", marginBottom: 10 }}
                          >
                            WHY THIS FIT
                          </p>
                          <div className="flex flex-col gap-2">
                            {suggestedMatch.reasons.map((reason) => (
                              <div key={reason} className="flex items-start gap-2">
                                <ChevronRight
                                  size={12}
                                  style={{ color: "hsl(var(--color-gold-accent))", marginTop: 3, flexShrink: 0 }}
                                />
                                <span
                                  className="font-body text-foreground/90"
                                  style={{ fontSize: 14, lineHeight: 1.5 }}
                                >
                                  {MATCH_REASON_HOMEOWNER[reason as MatchReasonKey] || reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Process Strip */}
                      <div className="card-raised border border-border" style={{ padding: "24px", marginTop: 12 }}>
                        <p
                          className="font-mono text-muted-foreground"
                          style={{ fontSize: 9, letterSpacing: "0.1em", marginBottom: 14 }}
                        >
                          WHAT HAPPENS NEXT
                        </p>
                        <div className="flex flex-col gap-3">
                          {[
                            { label: "Best-fit candidate identified", done: true },
                            { label: "WindowMan ops confirms the fit", done: false },
                            { label: "You receive an SMS/call update", done: false },
                            { label: "Introduction completed if approved", done: false },
                          ].map((step, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  background: step.done
                                    ? "hsl(var(--color-emerald) / 0.15)"
                                    : "hsl(var(--color-gold-accent) / 0.1)",
                                  border: step.done
                                    ? "1.5px solid hsl(var(--color-emerald))"
                                    : "1.5px solid hsl(var(--color-gold-accent) / 0.3)",
                                }}
                              >
                                {step.done ? (
                                  <Check size={12} style={{ color: "hsl(var(--color-emerald))" }} />
                                ) : (
                                  <span
                                    className="font-mono"
                                    style={{ fontSize: 10, color: "hsl(var(--color-gold-accent))" }}
                                  >
                                    {i + 1}
                                  </span>
                                )}
                              </div>
                              <span
                                className="font-body"
                                style={{
                                  fontSize: 14,
                                  color: step.done ? "hsl(var(--color-emerald))" : "hsl(var(--foreground))",
                                }}
                              >
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Call Expectation */}
                      <div
                        className="card-raised"
                        style={{
                          background: "hsl(var(--color-gold-accent) / 0.06)",
                          border: "1px solid hsl(var(--color-gold-accent) / 0.2)",
                          padding: "16px 20px",
                          marginTop: 12,
                          textAlign: "center",
                        }}
                      >
                        <p className="font-body text-foreground/90" style={{ fontSize: 14, lineHeight: 1.7 }}>
                          You may receive a free WindowMan call shortly to explain your report, answer questions, and
                          help move your introduction forward.
                        </p>
                      </div>
                      <p
                        className="font-body text-muted-foreground"
                        style={{
                          fontSize: 12,
                          textAlign: "center",
                          marginTop: 16,
                          fontStyle: "italic",
                          lineHeight: 1.7,
                        }}
                      >
                        This is a candidate pending review by the WindowMan operations team.
                        <br />
                        Expect an SMS or call update within 15 minutes.
                      </p>
                    </div>
                  ) : (
                    /* No Match Fallback */
                    <div className="mx-auto text-center" style={{ maxWidth: 480, marginTop: 8 }}>
                      <div
                        className="mx-auto flex items-center justify-center"
                        style={{
                          width: 72,
                          height: 72,
                          background: "hsl(var(--color-gold-accent) / 0.1)",
                          border: "2px solid hsl(var(--color-gold-accent))",
                        }}
                      >
                        <Check size={32} style={{ color: "hsl(var(--color-gold-accent))" }} strokeWidth={3} />
                      </div>
                      <p className="font-body text-foreground" style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>
                        Introduction requested.
                      </p>
                      <p
                        className="font-body text-foreground/90"
                        style={{ fontSize: 14, lineHeight: 1.8, marginTop: 12 }}
                      >
                        We're finalizing your best-fit contractor review now. Our operations team will identify the
                        strongest candidate for your {county} County project.
                        <br />
                        <br />
                        Expect an SMS or call update within 15 minutes.
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            ) : reportCallRequested ? (
              /* ── POST-CLICK: Report help call success ── */
              <AnimatePresence mode="wait">
                <motion.div
                  key="report-help-success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mx-auto text-center"
                  style={{ maxWidth: 480 }}
                >
                  <div
                    className="mx-auto flex items-center justify-center"
                    style={{
                      width: 72,
                      height: 72,
                      background: "hsl(var(--color-gold-accent) / 0.1)",
                      border: "2px solid hsl(var(--color-gold-accent))",
                    }}
                  >
                    <Phone size={32} style={{ color: "hsl(var(--color-gold-accent))" }} strokeWidth={2} />
                  </div>
                  <p className="font-body text-foreground" style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>
                    Call requested.
                  </p>
                  <p className="font-body text-foreground/90" style={{ fontSize: 14, lineHeight: 1.8, marginTop: 12 }}>
                    WindowMan is preparing a free call to explain your report and answer your questions.
                    <br />
                    <br />
                    Expect a call or text within 15 minutes. We'll walk through what the Grade {grade} means, what the
                    flags mean for your project, and what options you have.
                  </p>
                  <p className="font-mono text-muted-foreground" style={{ fontSize: 11, marginTop: 16 }}>
                    You can still use your negotiation script with your current contractor.
                  </p>
                </motion.div>
              </AnimatePresence>
            ) : null}
          </div>

          {/* ── HOW WINDOWMAN VETS (always visible in full mode) ── */}
          <div className="max-w-4xl mx-auto mt-10 card-raised border border-border" style={{ padding: "32px 28px" }}>
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="flex flex-col items-center text-center flex-shrink-0 md:w-[280px]">
                <p className="font-body text-foreground" style={{ fontSize: 20, fontWeight: 700, textAlign: "center" }}>
                  How WindowMan vets these contractors
                </p>
                <img
                  src="/windowman-evaluates.avif"
                  alt="WindowMan evaluating quote with a clipboard"
                  loading="lazy"
                  className="w-40 md:w-48 h-auto object-contain mx-auto mt-6"
                />
              </div>
              <div className="flex flex-col gap-3">
                {[
                  "Each contractor submits 10+ sample quotes for our red flag audit before they're listed in our network.",
                  "We verify they use brand-specified quotes, standard warranty language, and fair-market deposit structures.",
                  "Homeowner feedback scores are updated monthly. Any contractor below 4.6 is removed.",
                  "Your contractor never sees your WindowMan grade report unless you choose to share it.",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span
                      className="font-body"
                      style={{ fontSize: 14, color: "hsl(var(--color-gold-accent))", flexShrink: 0, marginTop: 2 }}
                    >
                      ✓
                    </span>
                    <span className="font-body text-foreground/90" style={{ fontSize: 14, lineHeight: 1.6 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── REPORT FOOTER ─── */}
      <section className="py-6 px-4 md:px-8 bg-background border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="font-mono text-foreground" style={{ fontSize: 11, fontWeight: 700 }}>
              WindowMan Truth Report™
            </p>
            <p className="font-body text-muted-foreground" style={{ fontSize: 12 }}>
              {reportDate} · {county} County · Grade {grade}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-body text-muted-foreground" style={{ fontSize: 12 }}>
              This report is private. Only you can access it.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

function humanizeDocType(dt: string): string {
  const map: Record<string, string> = {
    quote: "Contractor Quote",
    estimate: "Project Estimate",
    proposal: "Project Proposal",
    invoice: "Invoice",
    contract: "Contract",
  };
  return map[dt.toLowerCase()] || dt;
}

export default TruthReportClassic;
