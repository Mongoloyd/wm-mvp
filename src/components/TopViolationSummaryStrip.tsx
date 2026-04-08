/**
 * TopViolationSummaryStrip — High-authority teaser strip showing the single
 * most important violation. Renders above the OTP gate / findings section.
 *
 * Design system: uses skeuomorphic card surfaces, semantic color tokens,
 * and the locked WindowMan typography scale.
 */

import { motion } from "framer-motion";

export type TopViolationSummaryStripProps = {
  title: string;
  consequence: string;
  impactLabel: string;
  severity: "critical" | "caution";
  /** True when report is still behind the OTP gate */
  locked: boolean;
};

export default function TopViolationSummaryStrip({
  title,
  consequence,
  impactLabel,
  severity,
  locked,
}: TopViolationSummaryStripProps) {
  const isCritical = severity === "critical";

  // Accent color tokens
  const accentColor = isCritical ? "hsl(var(--color-danger))" : "hsl(var(--color-gold-accent))";
  const accentBg = isCritical ? "hsl(var(--color-danger) / 0.08)" : "hsl(var(--color-gold-accent) / 0.08)";
  const accentBorder = isCritical ? "hsl(var(--color-danger) / 0.35)" : "hsl(var(--color-gold-accent) / 0.35)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="card-raised relative overflow-hidden"
      style={{
        borderColor: accentBorder,
        borderWidth: "1px",
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
        padding: "16px 20px",
      }}
    >
      {/* Layout: stacked on mobile, row on md+ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: eyebrow + title */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span
            className="wm-eyebrow"
            style={{
              color: accentColor,
              fontSize: 10,
              letterSpacing: "0.14em",
            }}
          >
            {isCritical ? "TOP VIOLATION" : "TOP FINDING"}
          </span>
          <p
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(15px, 2.5vw, 18px)",
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </p>
        </div>

        {/* Center: consequence */}
        <p
          className="font-body text-foreground flex-1 min-w-0"
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            maxWidth: 420,
          }}
        >
          {consequence}
        </p>

        {/* Right: impact chip — graduated 3-ring border + float */}
        <div className="flex-shrink-0">
          <motion.div
            animate={{ y: [0, -1, 0, 1, 0] }}
            transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
            className="inline-flex rounded-[11px]"
            style={{
              padding: 1,
              background: isCritical ? "hsl(var(--color-danger) / 0.45)" : "hsl(var(--color-gold-accent) / 0.45)",
              boxShadow: "0 1px 4px hsla(0 0% 0% / 0.08)",
            }}
          >
            <div
              className="inline-flex rounded-[10px]"
              style={{
                padding: 1,
                background: isCritical ? "hsl(var(--color-danger) / 0.25)" : "hsl(var(--color-gold-accent) / 0.25)",
              }}
            >
              <div
                className="inline-flex rounded-[9px]"
                style={{
                  padding: 1,
                  background: isCritical ? "hsl(var(--color-danger) / 0.12)" : "hsl(var(--color-gold-accent) / 0.12)",
                }}
              >
                <span
                  className="font-mono inline-block"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "black",
                    background: accentBg,
                    padding: "4px 12px",
                    borderRadius: "var(--radius-btn)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {impactLabel}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Locked indicator — subtle bottom edge hint */}
      {locked && (
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 2,
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            opacity: 0.4,
          }}
        />
      )}
    </motion.div>
  );
}
