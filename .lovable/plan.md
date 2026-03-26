

# QuotePriceMath — Financial Intelligence Cards

## Placement Decision

**After OTP, between ForensicPillarSection and Forensic Findings.**

Current report section order:
```text
1. Report Header
2. Grade Verdict
3. Proof-of-Read Trust Strip (preview only)
4. Top Violation Summary Strip
5. ForensicPillarSection (5-pillar analysis)
6. ← QUOTE PRICE MATH GOES HERE (full only)
7. Forensic Findings (flag cards)
8. Negotiation Script (full only)
9. Contractor Match CTA (full only)
```

**Why here:** The money section sits between "what's wrong" (pillars/risks) and "the details" (individual flags). This mirrors how a forensic auditor presents: risk summary → financial exposure → evidence. It also creates a natural reading flow: the user sees the grade, understands the risk areas, then sees the dollar impact before diving into individual findings.

The entire section only renders when `accessLevel === "full"` — post-OTP only. No teaser, no blur. Financial intelligence is the reward for verifying.

## Data Flow

`derived_metrics` does not yet exist in the client data pipeline. The edge function is built but not wired. Two options:

**Option A (recommended for now):** Pass `derived_metrics` as an optional prop to `TruthReportClassic`. The smart container (`ReportClassic.tsx`) will eventually call the edge function or receive it from the analysis payload. Until then, the component gracefully hides when the prop is `undefined`.

**Option B (deferred):** Wire `calculate-estimate-metrics` into `scan-quote` so it's stored on the `analyses` row and flows through `useAnalysisData`. This is the correct long-term architecture but is a separate wiring task.

Going with Option A — build the component now, wire the data later.

## Build Steps

### Step 1: Create `src/utils/formatCurrency.ts`
Global currency formatter utility.
- `formatCurrency(value: number | null): string` — returns `$1,234` or `—`
- `formatPct(value: number | null): string` — returns `42%` or `—`
- Used by QuotePriceMath and any future financial UI

### Step 2: Create `src/components/report/QuotePriceMath.tsx`

**Props interface:**
```ts
interface DerivedMetrics {
  totals: {
    contract_total: number | null;
    core_product_subtotal: number | null;
    install_like_subtotal: number | null;
    accessory_subtotal: number | null;
    discount_subtotal: number | null;
    tax_subtotal: number | null;
  };
  per_opening: {
    contract_price_per_opening: number | null;
    core_product_price_per_opening: number | null;
    installed_price_per_opening: number | null;
    non_core_cost_per_opening: number | null;
  };
  counts: {
    total_openings: number | null;
    window_openings: number | null;
    door_openings: number | null;
  };
  shares: {
    install_cost_share_pct: number | null;
    accessory_cost_share_pct: number | null;
    permit_cost_share_pct: number | null;
    discount_share_pct: number | null;
  };
  coverage: {
    priced_line_coverage_pct: number | null;
    brand_coverage_pct: number | null;
    dp_coverage_pct: number | null;
    noa_coverage_pct: number | null;
  };
  diagnostics: {
    quote_math_confidence: number;
    warnings: string[];
  };
}

type QuotePriceMathProps = {
  metrics: DerivedMetrics;
  county: string;
};
```

**The 4 Cards:**

1. **True Total** — `card-raised`, wm-eyebrow "ADJUSTED CONTRACT TOTAL", large `font-mono` display of `contract_total`, opening count chip below

2. **Unit Economics** — `card-raised`, per-opening price in large `font-mono`, window avg vs door avg breakdown, county benchmark comparison line (placeholder until benchmark data is wired)

3. **Cost Share Breakdown** — `card-raised`, horizontal stacked bar showing Materials (cobalt blue) / Labor (emerald) / Fees (gold-accent). Each segment proportional to its share percentage. "Data Not Disclosed" gold caution state for any null segment

4. **Transparency Index** — `card-raised`, circular or horizontal progress meter (0-100%) based on average of `priced_line_coverage_pct`, `brand_coverage_pct`, `dp_coverage_pct`, `noa_coverage_pct`. Individual coverage chips below

**Visual rules (design system compliant):**
- Entire section wrapped in `section-recessed` background
- All currency/percentage values use `font-mono`
- Missing values show gold `AlertTriangle` icon + "DATA NOT DISCLOSED" mono label
- Framer Motion stagger entry matching existing report pattern
- No raw hex — all HSL tokens from design system

### Step 3: Integrate into `TruthReportClassic.tsx`

- Add optional `derivedMetrics?: DerivedMetrics` prop to `TruthReportProps`
- Render `<QuotePriceMath>` between ForensicPillarSection and Forensic Findings, gated on `isFull && derivedMetrics`
- Pass through from `ReportClassic.tsx` (initially undefined — component simply won't render until the data pipeline is wired)

### Step 4: Add prop passthrough in `ReportClassic.tsx`

- Add `derivedMetrics` to the prop spread on `<TruthReportClassic>`. Initially `undefined`. When the edge function is wired into the scan pipeline, this prop will be populated from `analysisData.derivedMetrics`.

## File Summary

| File | Action |
|---|---|
| `src/utils/formatCurrency.ts` | Create — global currency/pct formatter |
| `src/components/report/QuotePriceMath.tsx` | Create — 4-card financial intelligence section |
| `src/components/TruthReportClassic.tsx` | Edit — add optional prop + render slot |
| `src/pages/ReportClassic.tsx` | Edit — passthrough prop (undefined for now) |

