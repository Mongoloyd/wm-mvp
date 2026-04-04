

# Enhance Analyses Table with Financial Forensics Fields

## Overview

Add three new columns to the existing `analyses` table, extend the Gemini extraction prompt to populate them, and surface the data in the Truth Report UI.

## 1. Database Migration

Add three nullable text columns to `analyses`:

```sql
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS price_fairness TEXT,
ADD COLUMN IF NOT EXISTS markup_estimate TEXT,
ADD COLUMN IF NOT EXISTS negotiation_leverage TEXT;
```

No RLS changes needed — these columns inherit existing policies. No new tables.

## 2. Edge Function: `supabase/functions/scan-quote/index.ts`

### 2a. Extend `ExtractionResult` interface (line ~27)

Add three optional string fields:
- `price_fairness?: string`
- `markup_estimate?: string`
- `negotiation_leverage?: string`

### 2b. Update `GEMINI_EXTRACTION_PROMPT` (line ~656)

Append a **Financial Forensics Protocol** section to the existing prompt. Add these three fields to the JSON schema in the prompt:

```
"price_fairness": "string | null — 2-3 sentences assessing total price objectivity. Compare against standard Florida wholesale costs ($500-$800/window + $250-$400 labor per opening). Identify inflated retail tactics like fake 'Buy 1 Get 1' deals.",
"markup_estimate": "string | null — Estimated dealer markup as percentage range or dollar amount (e.g., '45%-55%' or '~$8,500 over wholesale'). Calculate based on line item count and total quoted price vs wholesale baseline.",
"negotiation_leverage": "string | null — 1-2 punchy, actionable talking points the homeowner can use to negotiate a lower price. Reference specific weaknesses found in the quote."
```

Add to the system instructions: "Assume standard Florida wholesale costs of $500-$800 per impact window unit and $250-$400 per opening for installation labor. Use these baselines to calculate markup estimates. Identify inflated retail tactics such as fake 'Buy 1 Get 1 Free' promotions, bundled admin fees, or permit cost padding."

### 2c. Save to analyses upsert (line ~1205)

Add the three fields to the upsert payload:
```typescript
price_fairness: extraction.price_fairness || null,
markup_estimate: extraction.markup_estimate || null,
negotiation_leverage: extraction.negotiation_leverage || null,
```

Also include them in `fullJson` so they're available via `get_analysis_full`:
```typescript
price_fairness: extraction.price_fairness || null,
markup_estimate: extraction.markup_estimate || null,
negotiation_leverage: extraction.negotiation_leverage || null,
```

**Important**: These are AI-extracted narrative fields, not scoring inputs. The deterministic TypeScript grading logic remains unchanged — AI extracts, TypeScript scores.

## 3. Frontend: `useAnalysisData.ts`

### 3a. Extend `AnalysisData` interface

Add three optional fields:
```typescript
priceFairness?: string | null;
markupEstimate?: string | null;
negotiationLeverage?: string | null;
```

### 3b. Populate in `fetchFull` callback (~line 355)

Extract from `fullJsonRaw`:
```typescript
priceFairness: (fullJsonRaw?.price_fairness as string) || null,
markupEstimate: (fullJsonRaw?.markup_estimate as string) || null,
negotiationLeverage: (fullJsonRaw?.negotiation_leverage as string) || null,
```

These are full-report-only fields — not exposed in preview phase.

## 4. UI: `TruthReportClassic.tsx`

### 4a. Add props to `TruthReportProps`

```typescript
priceFairness?: string | null;
markupEstimate?: string | null;
negotiationLeverage?: string | null;
```

### 4b. New "Forensic Insight" card section

After the existing `QuotePriceMath` section and before the CTA, render a new **Financial Forensics** card group (only when `accessLevel === "full"` and at least one field is non-null):

- **Markup Estimate** card: Large, bold typography with danger/caution color based on the presence of high percentages. This creates the "sticker shock" moment.
- **Price Fairness** card: The 2-3 sentence assessment rendered as body text.
- **Negotiation Leverage** card: Rendered as actionable bullet points with a "Use This Script" heading.

All three cards gated behind `accessLevel === "full"` — locked overlay users see nothing.

## 5. Wire through `PostScanReportSwitcher`

Pass the three new fields from `analysisData` through to `TruthReportClassic` as props.

## Files Modified

| File | Change |
|------|--------|
| Migration SQL | Add 3 columns to `analyses` |
| `supabase/functions/scan-quote/index.ts` | Extend extraction interface, prompt, and upsert |
| `src/hooks/useAnalysisData.ts` | Extend `AnalysisData` interface and `fetchFull` |
| `src/components/TruthReportClassic.tsx` | New Forensic Insight cards |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | Pass new props through |

