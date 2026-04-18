/**
 * WhatToDoNowBlock — the conversion core.
 *
 * Single-winner action picker (priority order, not qualification):
 *   1. Replace / Re-bid — wins on grade D/F or redCount >= 3
 *   2. Negotiate       — wins on price band high/extreme, markup, or price_fairness flag
 *   3. Validate        — wins on missing items or fine_print/safety_code flags
 *
 * Renders 1 expanded primary action + up to 2 collapsed runner-up chips.
 * Embeds the primary commercial CTA ("Get a Better Quote") wired to the
 * existing `onContractorMatchClick` prop — no new backend behavior.
 *
 * All copy is grounded in existing analysis evidence; if no action qualifies,
 * the block renders nothing.
 */

import { motion } from "framer-motion";
import { Loader2, Users, Phone, ShieldCheck, Scale, RefreshCw } from "lucide-react";
import type { AnalysisFlag } from "@/hooks/useAnalysisData";

type ActionKind = "replace" | "negotiate" | "validate";

interface QualifiedAction {
  kind: ActionKind;
  title: string;
  oneLiner: string;
  basedOn: string;
  icon: typeof ShieldCheck;
  accent: string;
}

interface WhatToDoNowBlockProps {
  flags: AnalysisFlag[];
  grade: string;
  redCount: number;
  missingItems?: (string | Record<string, unknown>)[];
  markupEstimate?: string | null;
  pricePerOpeningBand?: "low" | "market" | "high" | "extreme" | null;
  onContractorMatchClick: () => void;
  onReportHelpCall?: () => void;
  isCtaLoading?: boolean;
  introRequested?: boolean;
}

function pluralize(n: number, singular: string, plural?: string) {
  return `${n} ${n === 1 ? singular : (plural ?? `${singular}s`)}`;
}

function buildQualified(props: WhatToDoNowBlockProps): QualifiedAction[] {
  const {
    flags,
    grade,
    redCount,
    missingItems = [],
    markupEstimate,
    pricePerOpeningBand,
  } = props;

  const out: QualifiedAction[] = [];

  // 1. Replace / Re-bid
  const isHighSeverityGrade = grade === "D" || grade === "F";
  if (isHighSeverityGrade || redCount >= 3) {
    const evidenceParts: string[] = [];
    if (isHighSeverityGrade) evidenceParts.push(`Grade ${grade}`);
    if (redCount >= 3) evidenceParts.push(pluralize(redCount, "critical finding"));
    out.push({
      kind: "replace",
      title: "Replace / re-bid this quote",
      oneLiner:
        "The risk pattern in this quote is severe enough that the strongest move is to get a competing quote before signing.",
      basedOn: evidenceParts.join(" · "),
      icon: RefreshCw,
      accent: "hsl(var(--color-danger))",
    });
  }

  // 2. Negotiate
  const priceFlags = flags.filter((f) => f.pillar === "price_fairness");
  const priceBandHigh =
    pricePerOpeningBand === "high" || pricePerOpeningBand === "extreme";
  if (priceFlags.length > 0 || markupEstimate || priceBandHigh) {
    const evidenceParts: string[] = [];
    if (priceBandHigh) {
      evidenceParts.push(`Price band: ${pricePerOpeningBand}`);
    }
    if (markupEstimate) {
      evidenceParts.push(`Markup: ${markupEstimate}`);
    }
    if (priceFlags.length > 0 && evidenceParts.length === 0) {
      evidenceParts.push(pluralize(priceFlags.length, "price-fairness finding"));
    }
    out.push({
      kind: "negotiate",
      title: "Negotiate this quote",
      oneLiner:
        "Price evidence in your report supports renegotiating before you sign — there is room to push back on labor and materials.",
      basedOn: evidenceParts.join(" · "),
      icon: Scale,
      accent: "hsl(var(--color-caution))",
    });
  }

  // 3. Validate
  const validateFlags = flags.filter(
    (f) => f.pillar === "fine_print" || f.pillar === "safety_code",
  );
  const missingCount = (missingItems ?? []).length;
  if (missingCount > 0 || validateFlags.length > 0) {
    const evidenceParts: string[] = [];
    if (missingCount > 0) {
      evidenceParts.push(pluralize(missingCount, "missing scope item"));
    }
    if (validateFlags.length > 0) {
      const fineCount = validateFlags.filter((f) => f.pillar === "fine_print").length;
      const safetyCount = validateFlags.filter((f) => f.pillar === "safety_code").length;
      if (safetyCount > 0)
        evidenceParts.push(pluralize(safetyCount, "safety/code finding"));
      if (fineCount > 0)
        evidenceParts.push(pluralize(fineCount, "fine-print finding"));
    }
    out.push({
      kind: "validate",
      title: "Validate this quote before signing",
      oneLiner:
        "Important scope, code, or fine-print items are unclear in this quote. Get them clarified in writing before you commit.",
      basedOn: evidenceParts.join(" · "),
      icon: ShieldCheck,
      accent: "hsl(var(--color-cyan))",
    });
  }

  return out;
}

const WhatToDoNowBlock = (props: WhatToDoNowBlockProps) => {
  const {
    onContractorMatchClick,
    onReportHelpCall,
    isCtaLoading = false,
    introRequested = false,
  } = props;

  const qualified = buildQualified(props);
  if (qualified.length === 0) return null;

  const primary = qualified[0];
  const runnersUp = qualified.slice(1, 3);
  const PrimaryIcon = primary.icon;

  // CTA copy adapts mildly to the primary action, but the underlying
  // wiring is the same `onContractorMatchClick` callback in every case.
  const ctaLabel =
    primary.kind === "validate"
      ? "Get a Better Quote"
      : primary.kind === "negotiate"
        ? "Get a Better Quote"
        : "Get a Better Quote";

  return (
    <section className="py-6 md:py-8 px-4 md:px-8 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <span className="wm-eyebrow" style={{ color: "hsl(var(--color-gold-accent))" }}>
            WHAT TO DO NOW
          </span>
          <h2 className="wm-title-section text-foreground" style={{ marginTop: 4 }}>
            Your recommended next move
          </h2>
        </div>

        {/* Primary action — expanded card with embedded CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="card-raised"
          style={{
            borderLeft: `4px solid ${primary.accent}`,
            padding: "20px 22px",
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <span
              aria-hidden="true"
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-btn)",
                background: `${primary.accent}1f`,
                color: primary.accent,
              }}
            >
              <PrimaryIcon size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="font-mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: primary.accent,
                  marginBottom: 4,
                }}
              >
                PRIMARY ACTION
              </p>
              <h3
                className="font-display text-foreground"
                style={{
                  fontSize: "clamp(18px, 2.4vw, 22px)",
                  fontWeight: 800,
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                }}
              >
                {primary.title}
              </h3>
            </div>
          </div>

          <p
            className="font-body text-foreground/90"
            style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 12 }}
          >
            {primary.oneLiner}
          </p>

          {primary.basedOn && (
            <p
              className="font-mono text-muted-foreground"
              style={{
                fontSize: 11,
                letterSpacing: "0.04em",
                marginBottom: 16,
              }}
            >
              <span style={{ fontWeight: 700 }}>Based on:</span> {primary.basedOn}
            </p>
          )}

          {/* Embedded primary commercial CTA */}
          {!introRequested ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={onContractorMatchClick}
                disabled={isCtaLoading}
                className={`flex items-center justify-center gap-2 flex-1 py-3.5 px-6 text-[15px] ${
                  isCtaLoading ? "btn-depth-gold--pending" : "btn-depth-gold"
                }`}
              >
                {isCtaLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Users size={18} />
                )}
                {isCtaLoading ? "Processing..." : ctaLabel}
              </motion.button>
              {onReportHelpCall && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onReportHelpCall}
                  disabled={isCtaLoading}
                  className="btn-secondary-tactile flex items-center justify-center gap-2 py-3.5 px-5 text-[14px]"
                >
                  <Phone size={15} />
                  <span className="hidden sm:inline">Talk to WindowMan</span>
                  <span className="sm:hidden">Talk first</span>
                </motion.button>
              )}
            </div>
          ) : (
            <div
              className="card-raised border border-border flex items-center gap-2"
              style={{
                background: "hsl(var(--color-emerald) / 0.08)",
                borderColor: "hsl(var(--color-emerald) / 0.3)",
                padding: "12px 14px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "hsl(var(--color-emerald))",
                  flexShrink: 0,
                }}
              />
              <p
                className="font-body text-foreground"
                style={{ fontSize: 13, lineHeight: 1.5 }}
              >
                Better-quote request submitted — see match details below.
              </p>
            </div>
          )}
        </motion.div>

        {/* Runner-up actions — compact chips */}
        {runnersUp.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {runnersUp.map((action) => (
              <span
                key={action.kind}
                className="inline-flex items-center gap-1.5 border border-border bg-card text-foreground/80"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-btn)",
                }}
                title={action.oneLiner}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: action.accent,
                    flexShrink: 0,
                  }}
                />
                Also: {action.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default WhatToDoNowBlock;
