

# Phase 3: Hybrid Report UI — New Components + Integration

## Overview
Create three new report components and wire them into the existing TruthReportClassic shell, then pass the new props from the ReportClassic smart container. Four files touched, zero existing logic altered.

## Step 1: Create three new components

### `src/components/report/ExecutiveSummaryStrip.tsx`
Simple presentational component. Renders summary text, price-per-opening, and band label. Returns null if no summary provided.

### `src/components/report/RedFlagsList.tsx`
Renders a list of warning strings with red left-border cards. Returns null if empty array.

### `src/components/report/MissingItemsList.tsx`
Renders a checklist of missing contract items with caution-colored left-border cards. Returns null if empty array.

## Step 2: Update `src/components/TruthReportClassic.tsx`

### 2a. Imports (line 1-20)
Add three imports for the new components.

### 2b. Interface extension (line 28-58)
Add 11 optional props to `TruthReportProps`: `warnings`, `missingItems`, `summary`, `topWarning`, `topMissingItem`, `pricePerOpening`, `pricePerOpeningBand`, `paymentRiskDetected`, `scopeGapDetected`, `summaryTeaser`, `missingItemsCount`.

### 2c. Destructure new props (line 89-118)
Add the 11 new props with safe defaults to the destructured parameters.

### 2d. Insert ExecutiveSummaryStrip (after line 249, after GRADE VERDICT)
```
{isFull && <ExecutiveSummaryStrip summary={summary} pricePerOpening={pricePerOpening} pricePerOpeningBand={pricePerOpeningBand} />}
```

### 2e. Insert locked preview teaser (before line 252, before RiskSummaryHeader)
Only renders in preview mode when at least one teaser field exists. Shows `summaryTeaser` or `topWarning` text plus missing items count.

### 2f. Insert RedFlagsList + MissingItemsList (before line 386, before FORENSIC FINDINGS section)
```
{isFull && <RedFlagsList warnings={warnings ?? []} />}
{isFull && <MissingItemsList missingItems={missingItems ?? []} />}
```

### What is NOT touched
- Report header, grade verdict internal content, RiskSummaryHeader, proof-of-read strip, TopViolationSummaryStrip, ForensicPillarSection, QuotePriceMath, financial forensics, forensic findings card stack, FixItCTA, GapFixModule, GreenChecklistModule, negotiation script, contractor match CTA, report footer — all unchanged.
- Flag severity logic, CTA behavior, copy-to-clipboard, OTP/LockedOverlay, suggested contractor logic, GTM tracking — all unchanged.

## Step 3: Update `src/pages/ReportClassic.tsx`

### 3a. Pass new props (lines 422-449)
Add 11 new prop bindings from `analysisData` to the `<TruthReportClassic>` JSX:
- `warnings={analysisData.warnings}`
- `missingItems={analysisData.missingItems}`
- `summary={analysisData.summary}`
- `topWarning={analysisData.topWarning}`
- `topMissingItem={analysisData.topMissingItem}`
- `pricePerOpening={analysisData.pricePerOpening}`
- `pricePerOpeningBand={analysisData.pricePerOpeningBand}`
- `paymentRiskDetected={analysisData.paymentRiskDetected}`
- `scopeGapDetected={analysisData.scopeGapDetected}`
- `summaryTeaser={analysisData.summaryTeaser}`
- `missingItemsCount={analysisData.missingItemsCount}`

No other logic in ReportClassic.tsx is changed.

## Files Changed
1. `src/components/report/ExecutiveSummaryStrip.tsx` — **created**
2. `src/components/report/RedFlagsList.tsx` — **created**
3. `src/components/report/MissingItemsList.tsx` — **created**
4. `src/components/TruthReportClassic.tsx` — **modified** (imports, interface, destructure, 4 JSX insertions)
5. `src/pages/ReportClassic.tsx` — **modified** (11 new prop bindings only)

