Scanner Brain verified follow-ups and tech debt for next passes

## Verified 2026-03-18
- Model: gemini-3.1-flash-lite-preview (confirmed working)
- All 5 edge function tests pass
- Classification gate runs BEFORE full extraction validation

## Security fix: polling access
- Removed broad `anon_select_scan_sessions` RLS policy
- Replaced with `get_scan_status(p_scan_session_id uuid)` SECURITY DEFINER RPC
- Returns ONLY `id` + `status` — no other columns exposed
- `useScanPolling` hook calls RPC, not direct table SELECT

## Live data binding (completed)
- `get_analysis_preview` RPC: SECURITY DEFINER, returns grade/flags/proof_of_read/preview_json/confidence_score/document_type
- Excludes full_json, dollar_delta, analysis_status
- `useAnalysisData` hook maps DB flags to UI Flag[] shape
- `mockAuditResult` removed from Index.tsx
- GradeReveal benchmark section hidden when no benchmark data
- contractorName extracted from proof_of_read.contractor_name

## Polling wired into UI
- `UploadZone` passes `scanSessionId` up via `onScanStart(fileName, scanSessionId)`
- `Index` stores `scanSessionId` state, passes to `ScanTheatrics`
- `ScanTheatrics` uses `useScanPolling` to gate phase transitions:
  - Scanning animation plays for min 8s
  - Phase transition to cliffhanger/OTP only when BOTH min animation done AND real status is preview_ready/complete
  - `invalid_document` → toast + dismiss theatrics
  - `needs_better_upload` → toast + dismiss theatrics

## Implementation follow-ups (do not skip)

### 1. Grade comparison uses numeric rank ✅
### 2. dollar_delta is NOT a true delta ⚠️
- Stores raw total_quoted_price — NOT benchmarked
- NOT propagated to frontend (excluded from get_analysis_preview)

## Tech debt: quote_files insert pattern
- `quote_files` still uses `.insert().select("id").single()` — works because anon SELECT policy exists
- When we tighten `quote_files` RLS, convert to client-generated UUID or backend-owned insert (same pattern as scan_sessions fix)

## Derived .txt artifact (follow-up, non-blocking)
- After successful analysis, backend should generate a human-readable .txt summary
- Save to a separate private `derived-assets` bucket (not `quotes`)
- Best-effort, non-blocking — if write fails, analysis still succeeds
- Contents: contractor name, document type, grade, confidence, top flags, opening summary, quoted total, timestamp, rubric version
- Access rules mirror report verification level (OTP-gated)

## Next scoped task
- OTP hard gate (Twilio Verify)
