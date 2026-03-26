/**
 * CriticalFlagCard — Forensic adjudication surface for critical/high-severity flags.
 *
 * Renders only when:
 *  - severity is "red" (critical)
 *  - flag has a matching BENCHMARK_MAP entry
 *  - hasHardEvidence === true OR explicit absence is detected
 *
 * Max 2 cards rendered (enforced by parent container).
 */

import { motion } from "framer-motion";
import type { EvidenceExhibit } from "@/utils/evidenceMapping";

export type CriticalFlagCardProps = {
  label: string;
  severity: "critical" | "high";
  pillar: string;

  yourQuoteText: string;
  benchmark: string;
  interpretation: string;

  hasHardEvidence: boolean;
  confidence?: number;

  index?: number;
  /** Only the top-ranked flag (index 0) gets the subtle pulse */
  isTopRanked?: boolean;
};

const PILLAR_LABELS: Record<string, string> = {
  safety_code: "Safety & Code",
  install_scope: "Install & Scope",
  price_fairness: "Price Fairness",
  fine_print: "Fine Print",
  warranty: "Warranty",
};

export default function CriticalFlagCard({
  label,
  severity,
  pillar,
  yourQuoteText,
  benchmark,
  interpretation,
  hasHardEvidence,
  index = 0,
  isTopRanked = false,
}: CriticalFlagCardProps) {
  const isAbsence = yourQuoteText.toLowerCase().includes("not found") ||
    yourQuoteText.toLowerCase().includes("missing") ||
    yourQuoteText.toLowerCase().includes("no ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        ...(isTopRanked
          ? {
              boxShadow: [
                "0 0 0 rgba(196, 48, 48, 0)",
                "0 0 12px rgba(196, 48, 48, 0.25)",
                "0 0 0 rgba(196, 48, 48, 0)",
              ],
            }
          : {}),
      }}
      transition={{
        opacity: { duration: 0.35, delay: index * 0.06, ease: "easeOut" },
        y: { duration: 0.35, delay: index * 0.06, ease: "easeOut" },
        scale: { duration: 0.35, delay: index * 0.06, ease: "easeOut" },
        ...(isTopRanked
          ? {
              boxShadow: {
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              },
            }
          : {}),
      }}
      className="card-raised relative overflow-hidden"
      style={{
        border: "1px solid hsl(var(--color-danger) / 0.35)",
        padding: "16px 16px 16px 20px",
      }}
    >
      {/* ── Left accent bar with glow ── */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ duration: 0.4, delay: 0.1 + index * 0.06 }}
        className="absolute left-0 top-0"
        style={{
          width: 3,
          background: "hsl(var(--color-danger))",
          boxShadow: "0 0 12px hsl(var(--color-danger) / 0.5)",
          borderRadius: "0 2px 2px 0",
        }}
      />

      <div className="flex flex-col gap-3">
        {/* ── A. Header Row ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono inline-block"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "hsl(var(--color-danger))",
              background: "hsl(var(--color-danger) / 0.08)",
              border: "1px solid hsl(var(--color-danger) / 0.35)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            CRITICAL FLAG
          </span>
          {PILLAR_LABELS[pillar] && (
            <span
              className="font-mono bg-secondary text-muted-foreground"
              style={{
                fontSize: 9,
                letterSpacing: "0.06em",
                padding: "2px 8px",
                borderRadius: "var(--radius-btn)",
              }}
            >
              {PILLAR_LABELS[pillar]}
            </span>
          )}
        </div>

        <p
          className="font-body text-foreground"
          style={{
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {label}
        </p>

        {/* ── B. Evidence Block (Your Quote) ── */}
        {hasHardEvidence && (
          <div
            className="section-recessed"
            style={{
              background: "hsl(var(--secondary))",
              border: "1px solid hsl(var(--border) / 0.6)",
              borderRadius: "var(--radius-input)",
              padding: "10px 14px",
            }}
          >
            <p
              className="font-mono"
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                color: "hsl(var(--muted-foreground))",
                letterSpacing: "0.08em",
                marginBottom: 4,
              }}
            >
              {isAbsence ? "DOCUMENT CHECK RESULT" : "YOUR QUOTE"}
            </p>
            <p
              className="font-body"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: isAbsence
                  ? "hsl(var(--muted-foreground))"
                  : "hsl(var(--foreground))",
                fontStyle: isAbsence ? "italic" : "normal",
                fontFamily: isAbsence ? undefined : "var(--wm-font-mono)",
              }}
            >
              {isAbsence ? `"${yourQuoteText}"` : yourQuoteText}
            </p>
          </div>
        )}

        {/* ── C. Benchmark Block ── */}
        <div>
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              color: "hsl(var(--color-cyan) / 0.8)",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}
          >
            REQUIRED STANDARD
          </p>
          <p
            className="font-body"
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "hsl(var(--muted-foreground))",
            }}
          >
            {benchmark}
          </p>
        </div>

        {/* ── D. Interpretation (verdict) ── */}
        <p
          className="font-body"
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.55,
            color: "hsl(var(--foreground) / 0.85)",
            maxWidth: 520,
          }}
        >
          {interpretation}
        </p>
      </div>
    </motion.div>
  );
}
