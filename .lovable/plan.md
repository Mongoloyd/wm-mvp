

# Diagnosis: ScanTheatrics Data Flow

## Finding: There Is No Mock Data

The ScanTheatrics component does **not** use fake or mocked data. Here is what is actually happening:

### 1. The "fake" terminal log lines are cosmetic animation text

The `TERMINAL_STEPS` array (line 43) contains strings like `"> EXTRACT line_items from page_1"`. These are **decorative animation steps** that play during the scanning phase — they are not data. They always show the same text regardless of what was uploaded because they are a visual theatrical effect, not a data display.

Similarly, `FORENSIC_MARKERS` (line 54) are static bounding-box overlays on a document silhouette illustration. They are part of the scan animation, not real OCR coordinates.

### 2. The real data IS being fetched and displayed correctly

Looking at the network logs from your actual scan:

- `get_analysis_preview` returned real data: grade `"C"`, `flag_count: 6`, `contractor_name: "BrightView Windows & Doors"`, `opening_count: 7`, `line_item_count: 5`, `document_type: "impact_window_quote"`, `confidence_score: 0.95`
- This data flows through `useAnalysisData` → `Index.tsx` → `ScanTheatrics` via the `analysisData` prop
- The proof-of-read section (line 474-515) renders this real data: document type, contractor name, line item count, opening count

### 3. Why it might "feel" wrong

The terminal animation text says things like "EXTRACT line_items from page_1" even if your document is a single image — because these are hardcoded animation labels. They don't adapt to the actual document. The real extracted data appears in the **proof-of-read chip strip** that renders after the animation completes.

## What To Fix (Optional Enhancement)

If you want the terminal animation to reflect real OCR results instead of static text, that would be a new feature — dynamically replacing `TERMINAL_STEPS` text with values from `analysisData` once the preview data arrives. For example:

- Replace `"> EXTRACT line_items from page_1"` with `"> EXTRACT 5 line_items from 1-page document"` using `analysisData.lineItemCount` and `analysisData.pageCount`
- Replace `"> ID brand_specs in document"` with `"> ID brand: BrightView Windows & Doors"` using `analysisData.contractorName`
- Replace `"> LOAD market_data/{county}"` with `"> LOAD market_data/Broward"` using the actual county

### Files involved
- `src/components/ScanTheatrics.tsx` — make `TERMINAL_STEPS` a function that accepts `analysisData` and `selectedCounty` to produce dynamic step text

### No changes needed in
- `useAnalysisData.ts` — already fetching real data from `get_analysis_preview` RPC
- `useScanPolling.ts` — already polling real scan status
- `scan-quote` edge function — already running real Gemini OCR
- `Index.tsx` — already passing real `analysisData` prop to ScanTheatrics

## Summary

Nothing is mocked. The terminal animation is a static theatrical effect. The real data is wired correctly and displays in the proof-of-read section. The fix is to make the animation text dynamic.

