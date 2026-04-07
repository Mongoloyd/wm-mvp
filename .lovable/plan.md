

# Rubric Intelligence Dashboard — Audit & Improvement Plan

## Audit Findings

The dashboard lives in `src/components/dev/RubricComparison.tsx`, powered by `useRubricStats` (calls the `get_rubric_stats` RPC). It's dev-only (guarded by `import.meta.env.DEV`), rendered inside the floating `DevPreviewPanel`.

**What it does well:**
- Grade distribution per rubric version with stacked color bars
- Quality score (distance from 2.0 target), confidence range, invalid count
- Version-to-version delta showing grade % shifts
- Winner highlight (trophy icon) for the version closest to balanced scoring
- Time window filtering (7d / 30d / All) and manual refresh

**Current limitations found:**

1. **Inline styles everywhere** — no Tailwind, no design system consistency with the rest of the admin UI (which uses shadcn Card/Table components).
2. **No pillar-level breakdown** — only shows aggregate grade distribution; you can't see which pillar (Safety, Install, Price, Fine Print, Warranty) shifted between versions.
3. **No hard-cap visibility** — the scoring engine applies hard caps (`no_warranty_section`, `critical_safety`, `no_impact_products`, `zero_line_items`) but the dashboard doesn't show how many scans were capped or by which rule.
4. **Static "winner" logic** — uses distance-from-2.0 as the sole criterion; doesn't account for confidence spread or invalid rate.
5. **No export or snapshot** — can't capture a point-in-time comparison for team review.
6. **No click-through to individual scans** — you see aggregate numbers but can't drill into specific analyses that got a particular grade.

---

## 5 Proposed Improvements

### 1. Pillar Score Heatmap Row
Add a sub-row per rubric version showing avg scores for each of the 5 pillars as color-coded cells (green ≥70, yellow ≥37, red below). This requires extending the `get_rubric_stats` RPC to return `avg_safety`, `avg_install`, `avg_price`, `avg_fine_print`, `avg_warranty` from `full_json->pillar_scores`. On the frontend, render a 5-cell heatmap row beneath each version row.

- **Backend**: New migration adding pillar avg columns to the RPC return type.
- **Frontend**: New `PillarHeatmap` component inside `RubricComparison.tsx`.

### 2. Hard-Cap Breakdown Column
Show how many scans per version triggered each hard cap rule. The `full_json` already stores `hard_cap_applied`. Extend the RPC to count occurrences of each cap type. Display as small badge counts (e.g., "no_warranty: 4, critical_safety: 2").

- **Backend**: Add `hard_cap_no_warranty`, `hard_cap_critical_safety`, `hard_cap_no_impact`, `hard_cap_zero_items` counts to the RPC.
- **Frontend**: New column with compact badges.

### 3. Migrate to shadcn/Tailwind
Replace all inline styles with Tailwind classes and shadcn `Card`, `Table`, `Badge`, and `Button` components to match the admin dashboard aesthetic. This makes the dashboard consistent with `CommandCenter.tsx` and `EngineRoom.tsx`.

- **Files**: `RubricComparison.tsx` only — pure UI refactor, no logic changes.

### 4. Drill-Down: Click Grade Cell to See Scans
Make each grade count cell clickable. Clicking opens a popover or sheet listing the individual `analyses` rows for that version+grade combination, showing `scan_session_id`, `confidence_score`, `hard_cap_applied`, and `created_at`. This requires a new lightweight RPC (`get_rubric_drill`) or a filtered Supabase query.

- **Backend**: New RPC or direct query with filters on `rubric_version` and `grade`.
- **Frontend**: Sheet/popover component with a mini table.

### 5. Copy/Export Snapshot
Add a "Copy as Markdown" button that serializes the current table state (versions, grade counts, percentages, quality scores, deltas) into a formatted Markdown table copied to clipboard. Useful for pasting into Slack, Notion, or PR descriptions when comparing rubric versions.

- **Frontend only**: Serialize `rows` state into Markdown string, use `navigator.clipboard.writeText()`.

---

## Implementation Order

| Step | Scope | Files |
|------|-------|-------|
| 1 | Migrate to shadcn/Tailwind | `RubricComparison.tsx` |
| 2 | Add pillar heatmap | New migration + `RubricComparison.tsx` + `useRubricStats.ts` |
| 3 | Add hard-cap breakdown | Same migration + `RubricComparison.tsx` + `useRubricStats.ts` |
| 4 | Copy as Markdown | `RubricComparison.tsx` |
| 5 | Drill-down sheet | New RPC migration + new `RubricDrillSheet.tsx` + `RubricComparison.tsx` |

Steps 1 and 4 are frontend-only. Steps 2, 3, and 5 require new Supabase migrations to extend or create RPCs.

