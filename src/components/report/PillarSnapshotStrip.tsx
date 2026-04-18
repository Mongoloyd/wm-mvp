/**
 * PillarSnapshotStrip — compact 5-cell pillar status row (no raw scores).
 *
 * Preserves the "5-pillar mental model" early in the report without
 * placing raw scores above the decision blocks. Status comes from
 * existing `pillarScores[].status` only — no derivation.
 */

import { motion } from "framer-motion";
import type { PillarScore } from "@/hooks/useAnalysisData";

interface PillarSnapshotStripProps {
  pillarScores: PillarScore[];
}

const STATUS_COLOR: Record<PillarScore["status"], string> = {
  pass: "hsl(var(--color-emerald))",
  warn: "hsl(var(--color-caution))",
  fail: "hsl(var(--color-danger))",
  pending: "hsl(var(--muted-foreground))",
};

const STATUS_LABEL: Record<PillarScore["status"], string> = {
  pass: "Pass",
  warn: "Review",
  fail: "Fail",
  pending: "Pending",
};

const PillarSnapshotStrip = ({ pillarScores }: PillarSnapshotStripProps) => {
  if (!pillarScores || pillarScores.length === 0) return null;

  return (
    <section className="py-4 md:py-5 px-4 md:px-8 bg-card border-b border-border">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="font-mono text-muted-foreground"
            style={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 600 }}
          >
            PILLARS AT A GLANCE
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {pillarScores.map((p, i) => {
            const color = STATUS_COLOR[p.status];
            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.18 }}
                className="flex flex-col items-center text-center gap-1.5 px-1 py-1.5"
                title={`${p.label}: ${STATUS_LABEL[p.status]}`}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 0 3px ${color}1a`,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-body text-foreground"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {p.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PillarSnapshotStrip;
