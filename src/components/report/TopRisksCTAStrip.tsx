/**
 * TopRisksCTAStrip — single, authoritative primary CTA in the unlocked report.
 *
 * Placement: directly under Financial Forensics, above the Forensic Findings
 * accordion. This is THE primary commercial action in the full-mode flow.
 *
 * Mirrored by StickyCTAFooter: same wording (CTA_LABEL), same handler,
 * same loading/post-click states. WhatToDoNowBlock and the bottom contractor
 * section are subordinated to text-link / ghost reinforcements that scroll
 * users back here.
 *
 * Compact 1-row band (~80px mobile). Inline "See all N forensic findings ↓"
 * link smooth-scrolls to `#forensic-findings`.
 */

import { motion } from "framer-motion";
import { Loader2, Users, ArrowDown, Check } from "lucide-react";

interface TopRisksCTAStripProps {
  ctaLabel: string;
  onContractorMatchClick: () => void;
  isCtaLoading?: boolean;
  introRequested?: boolean;
  /** Total finding count used for the inline link copy. */
  findingsCount: number;
}

const SCROLL_TARGET_ID = "forensic-findings";

const TopRisksCTAStrip = ({
  ctaLabel,
  onContractorMatchClick,
  isCtaLoading = false,
  introRequested = false,
  findingsCount,
}: TopRisksCTAStripProps) => {
  const handleSeeFindings = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(SCROLL_TARGET_ID);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="cta-strip"
      className="scroll-mt-20 bg-background border-b border-border py-4 md:py-5 px-4 md:px-8"
    >
      <div className="max-w-3xl mx-auto">
        {introRequested ? (
          <div
            className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border px-4 py-3"
            style={{
              background: "hsl(var(--color-emerald) / 0.1)",
              borderColor: "hsl(var(--color-emerald) / 0.4)",
            }}
          >
            <Check size={18} style={{ color: "hsl(var(--color-emerald))" }} strokeWidth={2.5} />
            <p className="font-body text-foreground text-sm md:text-base font-medium">
              Better-quote request submitted — see match details below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.995 }}
              onClick={onContractorMatchClick}
              disabled={isCtaLoading}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-[var(--radius-btn)] ${
                isCtaLoading ? "btn-depth-gold--pending" : "btn-depth-gold"
              }`}
              style={{ minHeight: 48 }}
            >
              {isCtaLoading ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Users size={18} aria-hidden="true" />
              )}
              <span>{isCtaLoading ? "Processing..." : ctaLabel}</span>
            </motion.button>

            {findingsCount > 0 && (
              <a
                href={`#${SCROLL_TARGET_ID}`}
                onClick={handleSeeFindings}
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary underline underline-offset-2 transition-colors self-center sm:self-auto"
              >
                See all {findingsCount} forensic finding{findingsCount !== 1 ? "s" : ""}
                <ArrowDown size={14} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default TopRisksCTAStrip;
