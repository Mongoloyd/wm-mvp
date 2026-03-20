# Post‑Analysis Credibility Layer: ScanTheatrics + TruthReport (Phase 0.7)

## Summary

This plan adds a **credibility and validation layer** that begins during scanning (ScanTheatrics) and persists into the pre‑OTP preview report (TruthReport).  
It uses **only** `preview_json`, `proof_of_read`, and `analysis_status` — **never** `full_json`.

The goal is to build trust in the *process* before revealing *analysis*.

Two distinct moments are supported:

1. **During scan (no OCR data yet)**    
Optimistic, generic process validation that confirms the system is actively reading the document — without claiming extracted values.
2. **After scan (preview_json + proof_of_read available)**    
Real, affirmative trust signals that prove the document was read — without revealing grading, numeric metrics, or deficiencies.

## Phase 1: Extend useAnalysisData (Data Availability Only)

**File:** `src/hooks/useAnalysisData.ts`

Extend the `AnalysisData` interface to expose the following fields for downstream use:

- `pageCount: number | null`
- `openingCount: number | null`
- `lineItemCount: number | null`
- `qualityBand: "good" | "fair" | "poor" | null`
- `hasWarranty: boolean | null`
- `hasPermits: boolean | null`
- `analysisStatus: "preview_ready" | "complete" | "invalid_document" | "needs_better_upload" | "error"`

Extract these from existing `proof_of_read`, `preview_json`, and scan status in the fetch handler (lines 217–227).  
No new RPC calls are required — all fields are already returned by `get_analysis_preview`.

> **Important:**    
> These fields are made available for later use, but **numeric counts must not be rendered in ScanTheatrics or pre‑OTP preview UI**.

## Phase 2: OCR Validation Summary in ScanTheatrics

**File:** `src/components/ScanTheatrics.tsx`

Add an **OCR Validation Summary** component that appears as part of the scan theater and transitions based on scan state.

### A. While scanning (no OCR data yet)

After the animated log steps complete and during the cliffhanger phase, replace the static “Data extracted successfully” text with **generic, optimistic process validation copy**:

text

```
✓ Document structure detected
✓ Text readability confirmed
✓ Quote layout identified

```

Rules:

- These statements are **process‑level only**
- They must not claim specific extracted values
- They must not imply success or failure
- They animate in sequence as the scan progresses

### B. When preview data becomes available

When `analysisData` is present and `analysisStatus` is `preview_ready` or `complete`, transition the OCR Validation Summary to show **affirmative trust signals**:

#### 1. Proof‑of‑Read Trust Signals (Presence‑Based Only)

Render descriptive confirmations **only when confidently present**:

- “Multi‑page document analyzed” (if `pageCount` exists)
- “Detailed line items detected” (if `lineItemCount > 0`)
- “Contractor information identified” (if contractor name exists)

> **Do not display numeric counts** (e.g., “6 openings”, “8 line items”) in ScanTheatrics.

#### 2. OCR Read Quality Badge

Display a single badge summarizing how confidently the document was read:

- **Excellent**
- **Great**
- **Good**
- **Fair**

Derived from:

- OCR confidence score
- Presence of key anchors (document type, contractor name, totals, line items)

Rules:

- Never show negative labels
- Never show “Poor” or “Incomplete”
- Only show negative messaging when backend gating applies

#### 3. Gated States (Backend‑Driven Only)

If `analysisStatus` is:

- `needs_better_upload`    
→ Show: “We need a clearer photo or PDF to continue.”
- `invalid_document`    
→ Show:  
“This document does not appear to be a window or door installation quote.  
It appears to relate to another type of contract.  
I’m trained specifically on window and door quotes — please upload a window or door contract to continue.”

No analysis or grading is performed for non‑window documents.

### New Props Added to ScanTheatrics

- `analysisData?: AnalysisData | null`

**File:** `src/pages/Index.tsx`    
Pass `analysisData` from `useAnalysisData` into `ScanTheatrics`.

## Phase 3: TruthReport Preview Enhancements (Pre‑OTP Only)

**File:** `src/components/TruthReport.tsx`

### New Props

- `qualityBand`
- `hasWarranty`
- `hasPermits`
- `analysisStatus`

> Numeric fields (`pageCount`, `openingCount`, `lineItemCount`) remain available but **must not be rendered in preview mode**.

### Preview‑Mode Changes (`accessLevel === "preview"`)

#### 1. Proof‑of‑Read Trust Strip

Insert a subtle trust strip between the grade verdict and the 5‑pillar section:

- Uses **descriptive presence‑based language only**
- Reuses the OCR Read Quality badge from ScanTheatrics
- No numeric counts
- No grading language

#### 2. Summary Chips (Affirmative Only)

Render summary chips in the grade verdict bar:

- `qualityBand` → “Good Quote Structure” / “Fair Quote Structure”
- `hasWarranty === true` → “Warranty: Found”
- `hasPermits === true` → “Permits: Found”

Rules:

- **Only render when truthy**
- Do not render “Missing”, “Not found”, or negative states in preview
- Absence results in no chip

#### 3. Flag Severity Counts

Keep existing severity counts above the `LockedOverlay`:

Code

```
{critical} critical · {caution} caution · {confirmed} confirmed

```

No changes required — current behavior is correct.

#### 4. Post‑OTP Rendering

No changes.  
Full report continues to use `full_json` with numeric scores, flags, and metrics.

## Files Changed


| File                               | Change                                                   |
| ---------------------------------- | -------------------------------------------------------- |
| `src/hooks/useAnalysisData.ts`     | Extend AnalysisData interface + extract preview fields   |
| `src/components/ScanTheatrics.tsx` | Add OCR Validation Summary (process‑level → trust‑level) |
| `src/components/TruthReport.tsx`   | Add preview trust strip + affirmative summary chips      |
| `src/pages/Index.tsx`              | Pass analysisData to ScanTheatrics and TruthReport       |


## What Does NOT Change

- LockedOverlay OTP gate
- Full (post‑OTP) report rendering
- Edge function logic
- DevQuoteGenerator and fixtures
- Scoring, grading, or rubric behavior