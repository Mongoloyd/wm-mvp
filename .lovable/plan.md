## Revised Implementation Plan: Relocate Social Proof Pill into TruthGateFlow

### 1. Implementation Summary

- In `src/pages/Index.tsx`, remove the first `<SocialProofStrip />` rendered inside Flow A before `ScamConcernImage`.
- Keep the second `<SocialProofStrip />` rendered after `ProcessSteps` in `Index.tsx`.
- In `src/components/TruthGateFlow.tsx`, expand the existing `useTickerStats()` destructure from `{ today: tickerToday }` to `{ total, today: tickerToday }`.
- In `src/components/TruthGateFlow.tsx`, insert a new local social proof pill JSX block immediately after the `card-dominant` wrapper and before the closing tag of the outer `max-w-2xl` scanner wrapper.
- The existing inline "People in {selectedCounty} Saw Red Flags Today" badge inside the Step 5 lead-gate render will be kept as-is because it is county-specific and step-scoped, while the relocated pill is global credibility proof.
- Do not rely on brittle line-number references. Target the actual JSX structure semantically.
- If `Shield` is not already imported from `lucide-react` in `TruthGateFlow.tsx`, add it to the existing import line.

### 2. Files To Edit


| File                               | Action                                                                                                                                                   |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/TruthGateFlow.tsx` | Expand `useTickerStats()` destructure; insert pill JSX after the `card-dominant` wrapper; add `Shield` import only if missing                            |
| `src/pages/Index.tsx`              | Remove the first `SocialProofStrip` instance in Flow A; keep the later `SocialProofStrip` after `ProcessSteps`; keep the import because it is still used |


No other files are touched. `SocialProofStrip.tsx` and `useTickerStats.ts` remain unchanged.

### 3. Exact Placement Strategy

```text
<section id="truth-gate" ...>
  <div className="mx-auto w-full max-w-2xl ...">     ← outer scanner wrapper
    <p>THE SCANNER</p>                                ← eyebrow
    <p>STEP X OF 4 · CONFIGURE YOUR SCAN</p>         ← step eyebrow
    <div>progress bar</div>                           ← progress bar
    <div className="card-dominant ...">               ← main scanner card
      <AnimatePresence>{renderStepContent()}</AnimatePresence>
    </div>                                            ← end of card

    ┌──────────────────────────────────────────────┐
    │ NEW LOCAL SOCIAL PROOF PILL GOES HERE        │
    │ - inside the outer max-w-2xl wrapper         │
    │ - directly after the card-dominant wrapper   │
    │ - flex justify-center                        │
    │ - pointer-events-none, select-none           │
    │ - -mt-3 md:-mt-4 conservative overlap        │
    └──────────────────────────────────────────────┘

  </div>
</section>
```

The pill stays inside the `max-w-2xl` wrapper so it remains centered with the scanner card. Spacing to UploadZone relies on existing section padding. Overlap is conservative: `-mt-3` mobile, `md:-mt-4` desktop.

### 4. Exact Pill JSX

```tsx
{/* Social proof pill — presentation only, non-interactive */}
<div className="flex justify-center -mt-3 md:-mt-4 relative z-10 pointer-events-none select-none">
  <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-1.5 shadow-sm">
    <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
    <span className="text-xs font-semibold tabular-nums font-mono text-foreground">
      {total.toLocaleString()}
    </span>
    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
      Quotes Scanned
    </span>
    <div className="w-px h-3.5 bg-border" />
    <span className="text-xs font-bold tabular-nums font-mono text-primary whitespace-nowrap">
      +{tickerToday} Today
    </span>
  </div>
</div>
```

### 5. Cleanup Strategy

**Removed:** First `<SocialProofStrip />` in Flow A before `ScamConcernImage`

**Kept:** Later `<SocialProofStrip />` after `ProcessSteps`, its import, the Step 5 county badge, `SocialProofStrip.tsx`, `useTickerStats.ts`

**Untouched:** UploadZone, ScanTheatrics, PostScanReportSwitcher, all funnel state, Supabase inserts, analytics, validation, step progression. No new props, state, or async behavior.

### 6. Risk Notes


| Risk                                | Mitigation                                                    |
| ----------------------------------- | ------------------------------------------------------------- |
| Aggressive overlap on small screens | Conservative `-mt-3 md:-mt-4` only                            |
| Crowds UploadZone                   | Pill inside TruthGateFlow section; existing padding separates |
| Layout shift during steps           | Pill outside AnimatePresence, stays anchored                  |
| Duplicate social proof              | Only one pill near scanner; lower strip is 2+ viewports away  |
| Click interception                  | `pointer-events-none` + `select-none`                         |


### 7. Render Simulation

**Flow A initial:** Pill appears directly beneath scanner card with slight overlap. Reads as attached badge, not separate section.

**Steps 1-4 (windowCount, projectType, county, quoteRange):** Card content animates; pill stays anchored outside AnimatePresence. Stable, no shift.

**Step 5 lead gate:** Form fields + CTA inside card. County badge inside card. Global pill outside card beneath it. No redundancy -- different purposes.

**Post-submit, UploadZone visible:** Pill bridges scanner card and upload area. Existing section padding prevents crowding.

**Mobile:** Pill fits on one line at 375px. `-mt-3` overlap is safe. No tap interference.

**Desktop:** Pill centered within `max-w-2xl`. `md:-mt-4` gives premium attached feel. Lower-page strip far enough away to avoid duplication.

### 8. Verification Checklist

- No logic, funnel, Supabase, analytics, validation, or step progression changes
- No UploadZone, ScanTheatrics, or PostScanReportSwitcher changes
- No new props, state, or async behavior
- `pointer-events-none` applied
- Conservative overlap: `-mt-3 md:-mt-4`
- Semantic JSX targeting, not brittle line numbers
- Correct step order: windowCount, projectType, county, quoteRange
- No duplicate social proof near scanner
- Lower-page strip preserved
- Step 5 county badge preserved
- Clean TypeScript compilation

### Two Changes From Previous Plan

1. **Removed brittle line-number references** -- replaced with semantic structural targeting. Improved robustness.
2. **Corrected step order** -- from incorrect "county first" to actual `windowCount → projectType → county → quoteRange`. Fixed a factual error in the render simulation.

**Rating: 95/100** -- Precise, unambiguous, correctly scoped. Minor gap: pill styling (`bg-white/80`) assumes a light or neutral section background; if TruthGateFlow uses a dark background, the pill colors may need adjustment during visual verification.  
  
If the pill visually crowds UploadZone or overflows on narrow mobile widths during implementation review, make only the smallest spacing adjustment needed without changing logic, structure, or scope.