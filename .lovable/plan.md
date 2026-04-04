

# Dev Bypass for the Truth Report Gate

## Problem
You're locked out of the full report view during development because:
1. The OTP rate limiter (3 sends/15min) blocks you after a few test runs
2. The `get_analysis_full` RPC requires a verified `phone_verifications` row
3. Every preview refresh resets state, forcing re-verification

## Solution: Client-Side Dev Bypass in `useAnalysisData`

The cleanest approach is a single check in `useAnalysisData.ts` that, in DEV mode, skips the OTP-gated `get_analysis_full` RPC and instead calls the ungated `get_analysis_preview` RPC to populate the full data shape. This means you never need to touch the OTP flow at all while designing the report.

### How it works

When `import.meta.env.DEV` is true, `fetchFull()` and `tryResume()` will bypass the `get_analysis_full` RPC entirely. Instead, they'll call `get_analysis_preview` (which requires no phone verification) and then directly query the `analyses` table via a service-level Edge Function to get the flags and full_json. 

**Actually, simpler approach**: Since the `scan-quote` Edge Function already uses `DEV_BYPASS_SECRET` for test bypasses, we add a tiny new Edge Function `dev-report-unlock` that:
- Accepts `scan_session_id` + `dev_secret`
- Validates `dev_secret === DEV_BYPASS_SECRET`
- Returns the same columns as `get_analysis_full` but without phone verification
- Only works when the secret matches (production has no `VITE_DEV_BYPASS_SECRET`)

### Changes

**1. New Edge Function: `supabase/functions/dev-report-unlock/index.ts`**
- Accepts `{ scan_session_id, dev_secret }`
- Validates `dev_secret` against `DEV_BYPASS_SECRET` env var
- If match: queries `analyses` table directly (service role) and returns grade, flags, full_json, proof_of_read, preview_json, confidence_score, document_type, rubric_version
- If no match: returns 403
- CORS headers included

**2. Update `src/hooks/useAnalysisData.ts` — `fetchFull()` method**
- At the top of `fetchFull`, check `import.meta.env.DEV` and whether `VITE_DEV_BYPASS_SECRET` is set
- If both true: call `dev-report-unlock` Edge Function instead of `get_analysis_full` RPC
- Parse the response identically (same data shape)
- Still calls `saveVerifiedAccess` so resume works within the session

**3. Update `src/hooks/useAnalysisData.ts` — `tryResume()` method**
- Same DEV check: if in dev mode with bypass secret, use `dev-report-unlock` instead of the RPC
- This means page refreshes auto-resume without needing a real verified record

**4. Update `src/components/TruthReportFindings/VerifyGate.tsx`**
- In DEV mode with bypass secret: auto-call `onVerified()` immediately (skip the phone input entirely)
- Show a small "DEV BYPASS ACTIVE" badge so you know the gate is skipped

### Security Properties
- `DEV_BYPASS_SECRET` is a server-side secret — production callers can't guess it
- `VITE_DEV_BYPASS_SECRET` only exists in your local `.env` — production builds don't bundle it
- The Edge Function rejects all requests without a matching secret
- No changes to the production `get_analysis_full` RPC
- No changes to rate limiting or OTP logic

### Files Modified
| File | Change |
|------|--------|
| `supabase/functions/dev-report-unlock/index.ts` | New Edge Function |
| `src/hooks/useAnalysisData.ts` | DEV bypass in `fetchFull` and `tryResume` |
| `src/components/TruthReportFindings/VerifyGate.tsx` | Auto-skip gate in DEV mode |

