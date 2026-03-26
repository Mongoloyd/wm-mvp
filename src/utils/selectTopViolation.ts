/**
 * selectTopViolation — picks the single highest-risk flag for the teaser strip.
 *
 * Priority order:
 *  1. Red flag — compliance/code (safety_code pillar)
 *  2. Red flag — pricing/leverage (price_fairness)
 *  3. Red flag — warranty (warranty)
 *  4. Red flag — fine print / permits (fine_print)
 *  5. Red flag — install scope (install_scope)
 *  6. Strongest amber with money/leverage consequence
 *
 * Returns null when no qualifying flag exists (e.g. grade A with zero red/amber).
 */

import type { AnalysisFlag } from "@/hooks/useAnalysisData";

export type TopViolation = {
  title: string;
  consequence: string;
  impactLabel: string;
  severity: "critical" | "caution";
};

// ── Pillar priority for red flags (lower = higher priority) ──────────────────
const PILLAR_PRIORITY: Record<string, number> = {
  safety_code: 0,
  price_fairness: 1,
  warranty: 2,
  fine_print: 3,
  install_scope: 4,
};

// ── Consequence & impact mapping by label keyword ────────────────────────────
// Each entry: [consequence sentence, impact chip label]
const LABEL_MAP: Record<string, [string, string]> = {
  "noa":        ["Code compliance cannot be verified from the quote.", "PERMIT RISK"],
  "dp rating":  ["Wind resistance cannot be confirmed for your county.", "HIGH RISK"],
  "permit":     ["Unpermitted work may void insurance and code compliance.", "PERMIT RISK"],
  "warranty":   ["No written warranty leaves you exposed to full replacement cost.", "WARRANTY GAP"],
  "price":      ["Quoted pricing sits materially above the county benchmark.", "LEVERAGE"],
  "above market": ["Quoted pricing sits materially above the county benchmark.", "LEVERAGE"],
  "lump":       ["Lump-sum pricing prevents per-unit cost verification.", "LEVERAGE"],
  "scope":      ["Scope details are too vague to verify what is included.", "HIGH RISK"],
  "cancellation": ["No cancellation terms may limit your legal protections.", "HIGH RISK"],
  "brand":      ["Unspecified products allow substitution without notice.", "HIGH RISK"],
};

function matchLabel(label: string): [string, string] | null {
  const lower = label.toLowerCase();
  for (const [keyword, mapping] of Object.entries(LABEL_MAP)) {
    if (lower.includes(keyword)) return mapping;
  }
  return null;
}

// ── Dollar amount extraction from detail string ──────────────────────────────
function extractDollarLeverage(detail: string): string | null {
  const match = detail.match(/\$[\d,]+/);
  if (match) return `${match[0]} LEVERAGE`;
  const pctMatch = detail.match(/(\d+)%\s*above/i);
  if (pctMatch) return `${pctMatch[1]}% OVERPAY`;
  return null;
}

export function selectTopViolation(
  flags: AnalysisFlag[],
  grade: string,
): TopViolation | null {
  // Only show for grades B-F
  if (grade === "A") return null;

  const reds = flags
    .filter((f) => f.severity === "red")
    .sort((a, b) => {
      const pa = PILLAR_PRIORITY[a.pillar ?? ""] ?? 99;
      const pb = PILLAR_PRIORITY[b.pillar ?? ""] ?? 99;
      return pa - pb;
    });

  // Try red flags first
  if (reds.length > 0) {
    const top = reds[0];
    const mapping = matchLabel(top.label);
    const dollarLabel = extractDollarLeverage(top.detail);

    return {
      title: top.label,
      consequence: mapping?.[0] ?? top.detail,
      impactLabel: dollarLabel ?? mapping?.[1] ?? "HIGH RISK",
      severity: "critical",
    };
  }

  // Fallback: strongest amber
  const ambers = flags.filter((f) => f.severity === "amber");
  if (ambers.length > 0) {
    // Prefer money/leverage ambers
    const moneyAmber = ambers.find((f) => {
      const lower = (f.label + " " + f.detail).toLowerCase();
      return lower.includes("price") || lower.includes("$") || lower.includes("cost") || lower.includes("fee");
    });
    const top = moneyAmber ?? ambers[0];
    const mapping = matchLabel(top.label);

    return {
      title: top.label,
      consequence: mapping?.[0] ?? top.detail,
      impactLabel: mapping?.[1] ?? "REVIEW",
      severity: "caution",
    };
  }

  return null;
}
