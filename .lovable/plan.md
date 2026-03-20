

# Answers to the Two Blind Spots + Implementation Plan

## Blind Spot A: `proof_of_read` — Answered

From `scan-quote/index.ts` lines 873-879, `proof_of_read` is a **structured object**, not a boolean. It's computed deterministically from the extraction:

```text
proof_of_read = {
  page_count:      extraction.page_count || null
  opening_count:   extraction.opening_count || extraction.line_items.length
  contractor_name: extraction.contractor_name || null
  document_type:   extraction.document_type
  line_item_count: extraction.line_items.length
}
```

- It's derived from extracted fields, not scored
- It's exposed via `get_analysis_preview` RPC (safe for UI)
- It's informational — it proves the system read the document
- It's stable enough to design against

## Blind Spot B: `preview_json` vs `full_json` — Answered

They are **separately shaped objects**, not a subset relationship.

**`preview_json`** (lines 882-891) — teaser-safe:
```text
{
  grade, flag_count, opening_count_bucket,
  quality_band ("good"|"fair"|"poor"),
  hard_cap_applied, has_warranty, has_permits,
  pillar_scores: { safety_code: {status}, install_scope: {status}, ... }
}
```
Pillar scores are coarse bands: `"pass"` / `"warn"` / `"fail"`.

**`full_json`** (lines 894-902) — OTP-gated:
```text
{
  grade, weighted_average, hard_cap_applied,
  pillar_scores: { safety: number, install: number, ... },
  flags: Flag[],
  extraction: ExtractionResult,
  rubric_version
}
```

Key differences: `full_json` has numeric pillar scores, the complete flag array with details, and the raw extraction. `preview_json` has coarse bands and counts only.

Both are stable. The UI should be designed against `preview_json` for pre-OTP and `full_json` for post-OTP.

---

## Implementation Plan: OCR Bypass + Fixtures + Result Inspector

### Phase 1: Edge Function Bypass (~15 lines)

**File**: `supabase/functions/scan-quote/index.ts`

After parsing `scan_session_id` (line 498), also parse `dev_extraction_override` and `dev_secret`. If `dev_secret === Deno.env.get("DEV_BYPASS_SECRET")` and `dev_extraction_override` is present:
- Skip steps 3-7 (file lookup, download, base64, Gemini call, JSON parse)
- Set `parsed = dev_extraction_override`
- Fall through to step 8 (classification gate) and all subsequent scoring logic unchanged

Add `DEV_BYPASS_SECRET` to Supabase edge function secrets.

### Phase 2: Fixture Matrix

**File**: `src/test/createMockQuote.ts`

Add 14 structured `ExtractionResult` fixtures, each with an `expectedGrade`. Move scenario definitions from `DevQuoteGenerator.tsx` into this file. Each fixture is a complete `ExtractionResult` matching the interface at lines 26-53 of the edge function.

Scenarios: `gradeA`, `gradeB`, `gradeC`, `gradeD`, `gradeF`, `mixedPillars`, `cornerCutting`, `overpaymentTrap`, `vagueScope`, `missingWarranty`, `finePrintTrap`, `insuranceSensitive`, `invalidDocument`, `lowConfidence`.

### Phase 3: DevQuoteGenerator Rewrite

**File**: `src/components/dev/DevQuoteGenerator.tsx`

- Send `{ scan_session_id, dev_extraction_override, dev_secret }` instead of uploading files
- Still create `quote_files` (placeholder path) and `scan_sessions` records
- Skip storage upload entirely (OCR is bypassed)
- After scan completes, call `get_analysis_preview` and display inline:
  - Actual grade vs expected (checkmark or X)
  - Pillar statuses from `preview_json.pillar_scores`
  - Flag count and analysis_status
- "Run All" button to queue all scenarios sequentially with summary table

`VITE_DEV_BYPASS_SECRET` added to `.env` for client-side use in dev only.

### Phase 4: Fix Hardcoded Grade

**File**: `src/components/ScanTheatrics.tsx`

Line 429-430 hardcodes "C". Add a `grade` prop (default "C"), pass `analysisData?.grade` from `Index.tsx`.

**File**: `src/pages/Index.tsx` — pass grade prop to ScanTheatrics.

### Files changed

| File | Action |
|---|---|
| `supabase/functions/scan-quote/index.ts` | Add ~15-line bypass after line 498 |
| `src/test/createMockQuote.ts` | Add 14 ExtractionResult fixtures |
| `src/components/dev/DevQuoteGenerator.tsx` | Rewrite: bypass mode + inspector |
| `src/components/ScanTheatrics.tsx` | Add `grade` prop |
| `src/pages/Index.tsx` | Pass grade to ScanTheatrics |
| Supabase secrets | Add `DEV_BYPASS_SECRET` |
| `.env` | Add `VITE_DEV_BYPASS_SECRET` |

