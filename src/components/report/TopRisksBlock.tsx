/**
 * TopRisksBlock — Compact 3-row interpretive summary of the highest-priority risks.
 *
 * Strict grounding rules:
 * - Title comes from `flag.label` (or missing-item label).
 * - "Why" line comes from `flag.detail` → `flag.tip` → omitted (never invented).
 * - Backfills from `missingItems` if fewer than 3 qualifying flags exist.
 * - Anchor links to `#finding-{flag.id}` so the user can jump to full evidence below.
 *
 * Full-mode only — relies on the real flags array which is intentionally empty
 * before OTP verification.
 */

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { AnalysisFlag, PillarScore } from "@/hooks/useAnalysisData";
import { resolveEffectiveSeverity } from "@/utils/resolveEffectiveSeverity";

interface TopRisksBlockProps {
  flags: AnalysisFlag[];
  pillarScores: PillarScore[];
  missingItems?: (string | Record<string, unknown>)[];
}

/**
 * Read consequence text strictly from the flag object.
 * Locked rule: `flag.consequence` → `flag.impact` → omit.
 * Never invented, never derived from `flag.detail`.
 */
function readConsequence(flag: AnalysisFlag): string | null {
  const f = flag as unknown as { consequence?: unknown; impact?: unknown };
  const c = typeof f.consequence === "string" ? f.consequence.trim() : "";
  if (c) return c;
  const i = typeof f.impact === "string" ? f.impact.trim() : "";
  if (i) return i;
  return null;
}

const PILLAR_PRIORITY: Record<string, number> = {
  safety_code: 1,
  price_fairness: 2,
  warranty: 3,
  fine_print: 4,
  install_scope: 5,
};

const SEVERITY_ORDER: Record<"red" | "amber" | "green", number> = {
  red: 0,
  amber: 1,
  green: 2,
};

// High-contrast pill styles (white text on saturated backgrounds, ≥5:1).
const sevStyles = {
  red: {
    dot: "hsl(var(--color-danger))",
    badgeBg: "hsl(var(--color-danger))",
    badgeText: "hsl(0 0% 100%)",
    label: "CRITICAL",
  },
  amber: {
    dot: "hsl(var(--color-caution))",
    badgeBg: "hsl(var(--color-caution))",
    badgeText: "hsl(20 30% 12%)",
    label: "REVIEW",
  },
  green: {
    dot: "hsl(var(--color-emerald))",
    badgeBg: "hsl(var(--color-emerald))",
    badgeText: "hsl(0 0% 100%)",
    label: "CONFIRMED",
  },
} as const;

interface RiskRow {
  key: string;
  title: string;
  why: string | null;
  consequence: string | null;
  pillarLabel: string | null;
  severity: "red" | "amber" | "green";
  anchorId: string | null;
}

function normalizeMissingItem(item: string | Record<string, unknown>): {
  label: string;
  why: string | null;
} | null {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed ? { label: trimmed, why: null } : null;
  }
  if (item && typeof item === "object") {
    const label = String(item.label ?? item.title ?? item.name ?? "").trim();
    if (!label) return null;
    const why = item.why_it_matters ?? item.detail ?? item.description ?? null;
    return { label, why: typeof why === "string" && why.trim() ? why.trim() : null };
  }
  return null;
}

function buildRows(
  flags: AnalysisFlag[],
  pillarScores: PillarScore[],
  missingItems: (string | Record<string, unknown>)[],
): RiskRow[] {
  const sortedFlags = [...flags]
    .map((f) => ({ flag: f, sev: resolveEffectiveSeverity(f) }))
    .filter((x) => x.sev === "red" || x.sev === "amber")
    .sort((a, b) => {
      const sd = SEVERITY_ORDER[a.sev] - SEVERITY_ORDER[b.sev];
      if (sd !== 0) return sd;
      const ap = a.flag.pillar ? (PILLAR_PRIORITY[a.flag.pillar] ?? 99) : 99;
      const bp = b.flag.pillar ? (PILLAR_PRIORITY[b.flag.pillar] ?? 99) : 99;
      return ap - bp;
    });

  const rows: RiskRow[] = sortedFlags.slice(0, 3).map(({ flag, sev }) => {
    const pillarLabel = flag.pillar
      ? (pillarScores.find((p) => p.key === flag.pillar)?.label ?? null)
      : null;
    const why = flag.detail?.trim() || flag.tip?.trim() || null;
    return {
      key: `flag-${flag.id}`,
      title: flag.label,
      why,
      consequence: readConsequence(flag),
      pillarLabel,
      severity: sev,
      anchorId: `finding-${flag.id}`,
    };
  });

  // Backfill from missing items if we have fewer than 3 rows.
  if (rows.length < 3) {
    const needed = 3 - rows.length;
    const candidates = (missingItems ?? [])
      .map(normalizeMissingItem)
      .filter((x): x is { label: string; why: string | null } => x !== null)
      .slice(0, needed);
    candidates.forEach((mi, i) => {
      rows.push({
        key: `missing-${i}`,
        title: mi.label,
        why: mi.why,
        consequence: null,
        pillarLabel: null,
        severity: "amber",
        anchorId: null,
      });
    });
  }

  return rows;
}

const TopRisksBlock = ({ flags, pillarScores, missingItems = [] }: TopRisksBlockProps) => {
  const rows = buildRows(flags, pillarScores, missingItems);
  if (rows.length === 0) return null;

  const handleAnchor = (anchorId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section className="py-6 md:py-8 px-4 md:px-8 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <span className="wm-eyebrow" style={{ color: "hsl(var(--color-danger))" }}>
            TOP RISKS
          </span>
          <h2 className="wm-title-section text-foreground" style={{ marginTop: 4 }}>
            What matters most in this quote
          </h2>
        </div>

        <ul className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-card)] overflow-hidden bg-card">
          {rows.map((row, i) => {
            const s = sevStyles[row.severity];
            const Tag: "a" | "div" = row.anchorId ? "a" : "div";
            const interactiveProps = row.anchorId
              ? {
                  href: `#${row.anchorId}`,
                  onClick: handleAnchor(row.anchorId),
                }
              : {};
            return (
              <motion.li
                key={row.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
              >
                <Tag
                  {...interactiveProps}
                  className={`flex items-start gap-3 px-4 py-3 md:px-5 md:py-3.5 ${row.anchorId ? "hover:bg-secondary/40 transition-colors cursor-pointer" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className="flex-shrink-0 mt-1.5"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: s.dot,
                      boxShadow: `0 0 0 3px ${s.dot}1f`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className="font-mono uppercase"
                        style={{
                          background: s.badgeBg,
                          color: s.badgeText,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          padding: "3px 10px",
                          borderRadius: "var(--radius-btn)",
                        }}
                      >
                        {s.label}
                      </span>
                      {row.pillarLabel && (
                        <span
                          className="font-mono uppercase"
                          style={{
                            background: "hsl(var(--foreground))",
                            color: "hsl(var(--background))",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-btn)",
                          }}
                        >
                          {row.pillarLabel}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-foreground text-base font-semibold leading-snug">
                      {row.title}
                    </p>
                    {row.why && (
                      <p className="font-body text-foreground/80 text-sm mt-1 leading-snug line-clamp-2">
                        {row.why}
                      </p>
                    )}
                    {row.consequence && (
                      <p className="font-body text-sm mt-1 leading-snug line-clamp-1" style={{ color: "hsl(var(--color-danger))" }}>
                        <span className="font-semibold">If ignored: </span>
                        {row.consequence}
                      </p>
                    )}
                  </div>
                  {row.anchorId && (
                    <ChevronRight
                      size={16}
                      className="text-muted-foreground flex-shrink-0 mt-1.5"
                      aria-hidden="true"
                    />
                  )}
                </Tag>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default TopRisksBlock;
