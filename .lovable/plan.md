

## Plan: Fix Scroll Anchor to Land on Step 1 Header

### What This Fixes
Currently clicking "Scan Your Estimate" scrolls to the upload box, skipping the "How many windows?" question. This moves the anchor up to the TruthGateFlow section so users see the full context.

### Changes

**File 1: `src/components/OrangeScanner.tsx`** (line 283)
- Change `getElementById('upload-zone')` to `getElementById('truth-gate-section')`
- Add `block: 'start'` to the scrollIntoView options

**File 2: `src/pages/Index.tsx`**
- Add `id="truth-gate-section"` and `className="scroll-mt-24"` wrapper around `<TruthGateFlow>` (line 253)
- Remove the `id="upload-zone"` wrapper div around `<UploadZone>` (line 259), rendering `<UploadZone>` directly instead

### Files Modified
1. `src/components/OrangeScanner.tsx`
2. `src/pages/Index.tsx`

