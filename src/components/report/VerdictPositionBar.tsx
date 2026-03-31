/**
 * VerdictPositionBar — 5-segment horizontal bar showing pillar status at a glance.
 * Each segment = one pillar, color-coded by status, animated left-to-right.
 */

import { motion } from "framer-motion";
import type { RankedPillar } from "@/utils/pillarRanking";

interface VerdictPositionBarProps {
  pillars: RankedPillar[];
}

const STATUS_COLORS: Record<string, string> = {
  fail: "hsl(var(--color-danger))",
  warn: "hsl(var(--color-caution))",
  pass: "hsl(var(--color-emerald))",
  pending: "hsl(var(--border))",
};

const STATUS_BG: Record<string, string> = {
  fail: "hsl(var(--color-danger) / 0.15)",
  warn: "hsl(var(--color-caution) / 0.15)",
  pass: "hsl(var(--color-emerald) / 0.15)",
  pending: "hsl(var(--border) / 0.3)",
};

// Sort by original pillar order for display (safety → install → price → finePrint → warranty)
const DISPLAY_ORDER: Record<string, number> = {
  safety_code: 0,
  install_scope: 1,
  price_fairness: 2,
  fine_print: 3,
  warranty: 4,
};

const SHORT_LABELS: Record<string, string> = {
  safety_code: "SAFETY",
  install_scope: "SCOPE",
  price_fairness: "PRICE",
  fine_print: "FINE PRINT",
  warranty: "WARRANTY",
};

export default function VerdictPositionBar({ pillars }: VerdictPositionBarProps) {
  const sorted = [...pillars].sort(
    (a, b) => (DISPLAY_ORDER[a.key] ?? 99) - (DISPLAY_ORDER[b.key] ?? 99)
  );

  return (
    <div className="w-full">
      <div className="flex gap-1.5 w-full">
        {sorted.map((p, i) => {
          const color = STATUS_COLORS[p.status] ?? STATUS_COLORS.pending;
          const bg = STATUS_BG[p.status] ?? STATUS_BG.pending;

          return (
            <div key={p.key} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Segment bar */}
              <div
                className="w-full overflow-hidden"
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: bg,
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.08,
                    ease: "easeOut",
                  }}
                  style={{
                    height: "100%",
                    background: color,
                    borderRadius: 3,
                  }}
                />
              </div>

              {/* Label */}
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: color,
                  textAlign: "center",
                  lineHeight: 1,
                }}
              >
                {SHORT_LABELS[p.key] ?? p.key.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
