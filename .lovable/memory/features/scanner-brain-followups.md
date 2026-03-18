Scanner Brain verified follow-ups and tech debt for next passes

## Verified 2026-03-18
- Model: gemini-3.1-flash-lite-preview (confirmed working)
- Test 1 (valid quote PDF): status=complete, grade=A ✓
- Test 2 (grocery receipt PDF): Gemini returned data but validation caught missing line_items — needs `invalid_document` path improvement (Gemini doesn't classify non-quotes as invalid, it tries to extract anyway)
- Test 3 (garbled PNG): 502 from Gemini, test accepts gracefully ✓
- Test 4 (missing session ID): 400 ✓
- Test 5 (non-existent session): 404 ✓

## Implementation follow-ups (do not skip)

### 1. Grade comparison must use numeric rank, not string comparison
- DONE: GRADE_RANK map added (A=0, B=1, C=2, D=3, F=4)
- Hard-cap comparisons use `GRADE_RANK[grade] < GRADE_RANK["D"]` pattern
- File: supabase/functions/scan-quote/index.ts

### 2. dollar_delta is NOT a true delta
- `dollar_delta` currently stores raw total_price from extraction
- It is NOT benchmarked against market data yet
- Do NOT display it as "savings" or "overpayment" in the UI
- Future: implement real benchmark comparison with market baseline data
- File: supabase/functions/scan-quote/index.ts (scoring section)

### 3. Invalid document detection needs improvement
- Gemini tries to extract from any document, even grocery receipts
- The `document_is_window_door_related` field from extraction should trigger `invalid_document` status
- Currently falls through to validation error instead of clean `invalid_document` state

## Next scoped task
- Scan status polling (frontend) — poll scan_sessions for status transitions after upload
