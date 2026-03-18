Scanner Brain verified follow-ups and tech debt for next passes

## Verified 2026-03-18
- Model: gemini-3.1-flash-lite-preview (confirmed working)
- Test 1 (valid quote PDF): status=complete, grade=A ✓
- Test 2 (grocery receipt PDF): status=invalid_document ✓ (fixed — classification gate runs before full validation)
- Test 3 (garbled PNG): 502 from Gemini, test accepts gracefully ✓
- Test 4 (missing session ID): 400 ✓
- Test 5 (non-existent session): 404 ✓

## Classification gate (hardened)
- Two-phase validation: `validateDocumentClassification()` runs first, then `validateExtraction()`
- Invalid docs caught before line_items check
- Low-confidence docs get `needs_better_upload` with analyses row
- Failed extraction on valid docs also gets `needs_better_upload`

## Implementation follow-ups (do not skip)

### 1. Grade comparison uses numeric rank ✅
- GRADE_RANK map: A=5, B=4, C=3, D=2, F=1

### 2. dollar_delta is NOT a true delta ⚠️
- Stores raw total_quoted_price — NOT benchmarked
- Do NOT present as "overpayment" or "savings"

## Polling
- `useScanPolling` hook: polls scan_sessions every 2.5s
- Terminal statuses: preview_ready, complete, invalid_document, needs_better_upload
- RLS: anon SELECT on scan_sessions enabled for polling
- Max 60 polls (~2.5 min) before timeout

## Next scoped task
- Wire useScanPolling into UploadZone/ScanTheatrics flow
- Then: OTP hard gate
