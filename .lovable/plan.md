

# Fix: Unify Dual CTAs into Report Page & Add Dev Bypass Route

## Problem

There are **two disconnected CTA surfaces**:

1. **`TruthReportClassic.tsx`** (lines 492–535) — renders a standalone "Get a Counter-Quote" button that calls `onContractorMatchClick`, which in `ReportClassic.tsx` just does `console.log`. Dead end.
2. **`ContractorMatch.tsx`** — the full dual-CTA component (Introduction + Report Help Call) with match card, confidence badge, fit reasons, process strip. Only wired into `Index.tsx`, never into the `/report/classic/:sessionId` route.

Result: visitors on the report page see a non-functional CTA and never see the match card.

## Plan

### Step 1: Wire ContractorMatch into ReportClassic.tsx

- Import `ContractorMatch` into `ReportClassic.tsx`
- Add state: `contractorMatchVisible` (boolean)
- Change `handleContractorMatchClick` to set `contractorMatchVisible = true`
- Render `<ContractorMatch>` below `<TruthReportClassic>`, passing:
  - `isVisible={contractorMatchVisible}`
  - `grade={analysisData.grade}`
  - `county={county}`
  - `scanSessionId={sessionId}`
  - `isFullLoaded={isFullLoaded}`
  - `phoneE164` from verified access (funnel context or pipeline)
- ContractorMatch already handles: dual CTAs, match generation, match card rendering, voice webhook

### Step 2: Replace the static CTA section in TruthReportClassic.tsx

- Replace the "CONTRACTOR MATCH CTA" section (lines 492–535) with a simpler prompt that scrolls to the ContractorMatch component
- OR keep it as-is since it calls `onContractorMatchClick` which will now trigger ContractorMatch visibility — this is the cleaner approach since it preserves the existing report layout

**Decision**: Keep the existing CTA section in TruthReportClassic as the trigger. It already calls `onContractorMatchClick`. No duplication — the match card renders below only after click.

### Step 3: Add Dev Preview Route `/dev/report-preview`

Create `src/pages/DevReportPreview.tsx`:
- Renders `TruthReportClassic` + `ContractorMatch` with hardcoded mock data
- No OTP, no upload, no Supabase calls needed
- Pre-populates: grade D, 3 red flags, 2 amber flags, county "Broward", mock pillar scores
- `ContractorMatch` starts with `isVisible={true}` and a pre-set `suggestedMatch` object
- Only accessible in dev mode (guard with `import.meta.env.DEV`)

Register route in `App.tsx` under dev-only lazy import.

### Step 4: Resolve phoneE164 for ContractorMatch on report page

In `ReportClassic.tsx`, the phone is available via `pipeline.e164` or `funnel?.phoneE164` after verification. Pass whichever is available:
```tsx
phoneE164={funnel?.phoneE164 || pipeline.e164 || null}
```

## Files Changed

| File | Change |
|---|---|
| `src/pages/ReportClassic.tsx` | Import ContractorMatch, add visibility state, render below report |
| `src/pages/DevReportPreview.tsx` | New dev-only route with mock data for deep UI testing |
| `src/App.tsx` | Add `/dev/report-preview` route (dev lazy import) |

## What stays untouched

- `ContractorMatch.tsx` — no changes needed, it already has the full dual-CTA system
- `TruthReportClassic.tsx` — the existing CTA section stays as the trigger button
- `Index.tsx` — its ContractorMatch integration stays as-is

