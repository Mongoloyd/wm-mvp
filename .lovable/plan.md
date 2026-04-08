

# Replace reportCompiler.ts and Update Call Site

## What's Changing
The existing `reportCompiler.ts` uses structured objects (`Warning`, `MissingItem`, `DerivedMetrics`). The user's new version uses plain strings for warnings/missing items and accepts `Record<string, unknown>` for derived metrics. This simplifies the compiler and the downstream frontend consumption.

## Step 1: Replace `supabase/functions/scan-quote/reportCompiler.ts`
Overwrite the entire file with the user's exact code. Key differences from current:
- `warnings` becomes `string[]` (was `Warning[]`)
- `missing_items` becomes `string[]` (was `MissingItem[]`)
- `FlagLike` type replaces `AnalysisFlag` (matches the `Flag` shape in index.ts directly)
- `derivedMetrics` is `Record<string, unknown>` (no custom type)
- `buildWarnings` takes `(extraction, flags)` — no derivedMetrics param
- `buildSummary` takes `(gradeResult, warnings, missingItems, priceBand)` — simplified
- Price band uses "low"/"market"/"high"/"extreme" (was "budget"/"below-average"/"average"/"above-average"/"premium")

## Step 2: Update call site in `supabase/functions/scan-quote/index.ts`
Only lines 1026-1040 change. The new `FlagLike` type accepts `flag?`, `severity?`, `pillar?`, `detail?` — which matches the existing `Flag` interface in index.ts exactly. So the flag mapping can be removed and `flags` passed directly. `derivedMetrics` is already a `Record<string, unknown>` from `computeDerivedMetrics`, so it passes directly too.

Replace lines 1025-1040:
```typescript
const compiledReport = compileReportOutput(
  extraction,
  gradeResult,
  flags,
  derivedMetrics,
);
```

The `previewJson` and `fullJson` objects (lines 1056-1096) already reference `compiledReport.*` fields correctly and need no changes — the field names (`top_warning`, `missing_items`, `warnings`, etc.) match the new `CompiledReportOutput` interface.

## What is NOT touched
- `computeGrade`, `detectFlags`, validation, Gemini prompt, `computeDerivedMetrics`, database upsert flow, lead sync, scan session updates — all unchanged.
- No frontend files touched.

## Files Changed
1. `supabase/functions/scan-quote/reportCompiler.ts` — **replaced** (full overwrite)
2. `supabase/functions/scan-quote/index.ts` — **modified** (lines 1025-1040 only: simplified `compileReportOutput` call)

