

# Phase 2: Frontend Data Mapping

## What We're Doing
Two precise changes: create a type definition file, then extend the existing hook to map the new hybrid fields from the backend's `preview_json` and `full_json`.

## Step 1: Create `src/types/reportHybrid.ts`
New file with two exported interfaces (`HybridPreviewPayload`, `HybridFullPayload`) exactly as specified. Straightforward, no dependencies.

## Step 2: Update `src/hooks/useAnalysisData.ts`

### 2a. Imports
Add import of `HybridPreviewPayload` and `HybridFullPayload` from the new type file.

### 2b. Extend `AnalysisData` interface (line 39-63)
Add 10 new optional fields after the existing `negotiationLeverage`:
- `warnings`, `missingItems`, `summary`, `topWarning`, `topMissingItem`, `pricePerOpening`, `pricePerOpeningBand`, `paymentRiskDetected`, `scopeGapDetected`, `summaryTeaser`, `missingItemsCount`

### 2c. Preview mapping (line 286-303)
Cast `previewJson` as `HybridPreviewPayload`, then add the new fields to the `setData` call:
- `topWarning`, `topMissingItem`, `missingItemsCount` (default 0), `paymentRiskDetected` (Boolean), `scopeGapDetected` (Boolean), `pricePerOpeningBand`, `summaryTeaser` from preview
- `warnings: []`, `missingItems: []`, `summary: null`, `pricePerOpening: null` (not available in preview)

### 2d. Full mapping in `fetchFull()` (line 393-414)
Cast `fullJsonRaw` as `HybridFullPayload`, then add:
- `warnings` via `Array.isArray()` guard
- `missingItems` via `Array.isArray()` guard
- `summary`, `topWarning`, `topMissingItem`, `pricePerOpening` (number or null)
- `pricePerOpeningBand`, `paymentRiskDetected` (Boolean), `scopeGapDetected` (Boolean)
- `summaryTeaser: null`, `missingItemsCount` = missingItems.length

### 2e. `tryResume()` mapping (line 481-502)
Identical full mapping logic as fetchFull — same cast, same field mappings.

### 2f. Terminal status setData (line 247-254)
Add default null/empty/false values for all new fields so the type is satisfied.

### What is NOT touched
- RPC names, gating logic, OTP flow, tracking events, dev bypass, retry logic, pillar extraction helpers, flag mapping — all unchanged.

## Files Changed
1. `src/types/reportHybrid.ts` — **created**
2. `src/hooks/useAnalysisData.ts` — **modified** (interface + 3 setData blocks)

