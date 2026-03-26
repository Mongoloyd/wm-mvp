/**
 * pillarRanking — Sorts pillars by severity and assigns display tiers.
 *
 * Sort order:
 *  1. Status: fail > warn > pass > pending
 *  2. Lower score wins (within same status)
 *  3. Higher red flag count wins (within same score)
 *  4. Pillar priority tie-break (safety first)
 *
 * Tier assignment:
 *  - Rank 1 → "dominant" (expanded, tactical question)
 *  - Rank 2–3 → "elevated" (standard card)
 *  - Rank 4–5 → "safe" (recessed, collapsed)
 */

import type { PillarScore, AnalysisFlag } from "@/hooks/useAnalysisData";

export type RankedPillar = PillarScore & {
  rank: number;
  tier: "dominant" | "elevated" | "normal" | "safe";
  flagCount: { red: number; amber: number; green: number };
  gap: number | null; // points below pass threshold (70), null if pending
};

// ── Status weight (lower = higher priority) ──────────────────────────────────
const STATUS_WEIGHT: Record<string, number> = {
  fail: 0,
  warn: 1,
  pass: 2,
  pending: 3,
};

// ── Pillar priority for final tie-break (safety first) ───────────────────────
const PILLAR_PRIORITY: Record<string, number> = {
  safety_code: 0,
  price_fairness: 1,
  warranty: 2,
  fine_print: 3,
  install_scope: 4,
};

const PASS_THRESHOLD = 70;

export function rankPillars(
  pillars: PillarScore[],
  flags: AnalysisFlag[],
): RankedPillar[] {
  // Build flag counts per pillar
  const flagMap: Record<string, { red: number; amber: number; green: number }> = {};
  for (const f of flags) {
    const key = f.pillar ?? "__unknown";
    if (!flagMap[key]) flagMap[key] = { red: 0, amber: 0, green: 0 };
    flagMap[key][f.severity]++;
  }

  const enriched = pillars.map((p) => {
    const fc = flagMap[p.key] ?? { red: 0, amber: 0, green: 0 };
    const gap = p.score != null ? Math.max(0, PASS_THRESHOLD - p.score) : null;
    return { ...p, flagCount: fc, gap };
  });

  // Sort by severity
  enriched.sort((a, b) => {
    // 1. Status weight
    const sw = (STATUS_WEIGHT[a.status] ?? 3) - (STATUS_WEIGHT[b.status] ?? 3);
    if (sw !== 0) return sw;

    // 2. Lower score = worse = higher priority
    const scoreA = a.score ?? 999;
    const scoreB = b.score ?? 999;
    if (scoreA !== scoreB) return scoreA - scoreB;

    // 3. More red flags = higher priority
    if (a.flagCount.red !== b.flagCount.red) return b.flagCount.red - a.flagCount.red;

    // 4. Pillar priority tie-break
    return (PILLAR_PRIORITY[a.key] ?? 99) - (PILLAR_PRIORITY[b.key] ?? 99);
  });

  // Assign ranks and tiers
  return enriched.map((p, i) => {
    const rank = i + 1;
    let tier: RankedPillar["tier"];
    if (rank === 1) tier = "dominant";
    else if (rank <= 3) tier = "elevated";
    else tier = "safe";

    // Override: if all pillars pass, demote dominant to normal
    const allPass = enriched.every((e) => e.status === "pass");
    if (allPass) tier = "normal";

    return { ...p, rank, tier };
  });
}
