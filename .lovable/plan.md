

## What's weak today (full-mode commercial flow)

Current full-mode order from line ~404 onward:
1. Header / Verdict
2. Executive Summary (1-line strip)
3. Risk Summary header
4. **ForensicPillarSection** (5 pillars, raw scores) ← appears EARLY
5. QuotePriceMath
6. Financial Forensics (markup / fairness / leverage)
7. RedFlagsList
8. MissingItemsList
9. Forensic Findings accordion
10. **FixItCTA** (Gap-Fix / Green Checklist) — secondary
11. Negotiation Script
12. **Contractor Match CTA** ("Get a Better Quote" lives here, line ~963) ← BURIED at the bottom

**Commercial weakness:** the highest-value CTA (`onContractorMatchClick` → `generate-contractor-brief`) is the *last* thing the user sees. Between the verdict and the CTA sit ~6 dense sections including raw pillar scores. There is no decision block ("what should I do now") and no top-of-page commercial action.

## Three new presentational components + one rewire

### 1. `src/components/report/TopRisksBlock.tsx` (NEW, full-mode only)
- Input: `flags`, `pillarScores`, `missingItems`
- Compact 3-row list (not cards). Each row: severity dot · title · 1-line "why" · pillar pill · anchor link `#finding-{id}` to detailed findings.
- Strict grounding: title from `flag.label`; "why" from `flag.detail` → `flag.tip` → omit. Backfill from `missingItems` if <3 flags. **No** `getFlagReasoning` helper.
- Mobile: ~80px per row, ~240px total.

### 2. `src/components/report/PillarSnapshotStrip.tsx` (NEW, full-mode only)
- Compact 5-cell row: pillar name + status dot only (no scores).
- Preserves the "5-pillar mental model" without raw score emphasis. ~60px tall.

### 3. `src/components/report/WhatToDoNowBlock.tsx` (NEW, full-mode only) — **the conversion core**
- **Single-winner action picker** (priority order, not qualification):
  1. **Replace / Re-bid** — wins if `grade ∈ {"D","F"}` OR `redCount >= 3`
  2. **Negotiate** — wins if `pricePerOpeningBand ∈ {"high","extreme"}` OR `markupEstimate` present OR any `pillar === "price_fairness"` flag
  3. **Validate** — wins if `missingItems.length > 0` OR any `fine_print`/`safety_code` flag
- Renders: 1 expanded primary action + up to 2 collapsed chips for the runners-up.
- **Embedded primary CTA**: `Get a Better Quote` button bound to existing `onContractorMatchClick` prop (already wired to `generate-contractor-brief` in `PostScanReportSwitcher` line 439). No new edge function, no new state.
- "Based on:" line cites the exact evidence that triggered the action (e.g., "Grade F, 4 critical findings" or "Price band: high, markup ~$X").
- Loading / post-click states (`isCtaLoading`, `introRequested`) are read from existing props so the button mirrors the bottom-of-page CTA's behavior.

### 4. `src/components/TruthReportClassic.tsx` — reorder full-mode sections
- Insert the 3 new blocks immediately after `RiskSummaryHeader` (after line 440).
- Move `ForensicPillarSection` (line 503) to render *after* `MissingItemsList` and *before* the Forensic Findings accordion in full mode. Preview mode keeps current pillar position so the locked teaser is unaffected.
- Add `id="finding-{flag.id}"` to each forensic finding card so Top Risks can anchor-scroll.
- Keep existing FixItCTA / Negotiation Script / Contractor Match section intact at the bottom — they remain valid secondary surfaces; the bottom Contractor Match section becomes a reinforcement, not the only CTA.

### 5. `src/components/post-scan/PostScanReportSwitcher.tsx` — **no changes needed**
Existing `onContractorMatchClick`, `isCtaLoading`, `introRequested`, `suggestedMatch` props already flow into `TruthReportClassic`. New blocks consume them as-is.

## Final full-mode order (after this sprint)

```
1. Header / Verdict Strip
2. Executive Summary (1-line)
3. Risk Verdict Line
4. ⬆ NEW · Top Risks Block (3 compact rows)
5. ⬆ NEW · Pillar Snapshot Strip (5 dots)
6. ⬆ NEW · What To Do Now + "Get a Better Quote" CTA  ← decision core
─── Supporting Proof ───
7. Quote Price Math
8. Financial Forensics
9. Red Flags list
10. Missing Items list
11. Forensic Findings accordion (with anchor IDs)
─── Pillar Detail (subordinated) ───
12. ⬇ Forensic Pillar Section (full bands + descriptions)
─── Secondary Actions ───
13. Fix-It CTA (Gap-Fix / Green Checklist)
14. Negotiation Script
15. Contractor Match section (reinforcement)
16. Footer
```

Preview-mode order is **untouched**.

## Mobile fit (390px viewport)

- Header (~140px) + Verdict (~90px) + Exec Summary (~60px) + Risk Verdict (~60px) = ~350px
- Top Risks (~240px) + Pillar Snapshot (~60px) + What To Do Now w/ CTA (~220px) = ~520px
- **Verdict → primary CTA visible within ~870px** (≈ 2 mobile screens). ✅

## Files to change

| File | Action | Scope |
|---|---|---|
| `src/components/report/TopRisksBlock.tsx` | NEW | 3-row interpretive summary; anchor links; strict grounding |
| `src/components/report/PillarSnapshotStrip.tsx` | NEW | compact 5-cell pillar status (no scores) |
| `src/components/report/WhatToDoNowBlock.tsx` | NEW | single-winner action picker + embedded `Get a Better Quote` CTA wired to `onContractorMatchClick` |
| `src/components/TruthReportClassic.tsx` | EDIT | insert 3 blocks after RiskSummaryHeader (full mode); move ForensicPillarSection below detailed findings (full mode); add `id="finding-{id}"` anchors |

No changes to `PostScanReportSwitcher`, `useAnalysisData`, `LockedOverlay`, edge functions, schema, RLS, OTP, or preview-mode rendering. CTA reuses existing `generate-contractor-brief` wiring — no new backend behavior invented.

