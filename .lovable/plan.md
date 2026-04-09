

# Fix `create-checkout-session` to Fail Closed

## Problem
The Edge Function creates a Stripe session first, then attempts to insert a pending purchase row. When the insert fails (FK violation because the preview contractor doesn't exist in `contractor_profiles`), it silently returns the Stripe URL anyway. The webhook later fails with `purchase_not_found`.

## Root Causes
1. Preview fallback resolves a contractor ID without validating it exists in `contractor_profiles` or has a `contractor_credits` row.
2. The function "fails open" — line 236-239 logs the insert error but still returns the URL.

## Changes (single file: `supabase/functions/create-checkout-session/index.ts`)

### 1. Unified contractor validation in `resolveContractor`
Both the authenticated path and the preview path already check `contractor_profiles` for auth users — but the preview path skips this entirely. Fix:

- Read `PREVIEW_CONTRACTOR_PROFILE_ID` (renamed from `PREVIEW_CONTRACTOR_ID` for clarity; also fall back to old name for backward compat).
- For preview path: query `contractor_profiles` where `id = previewId` and verify `status = 'active'`, same as the auth path already does.
- If the profile is missing or inactive, return a `422 config_error` immediately — before any Stripe call.

### 2. Validate `contractor_credits` row exists
After resolving the contractor (auth or preview), query `contractor_credits` for the resolved ID. If missing, return error. This prevents the downstream FK issue and ensures the fulfillment RPC won't fail on a missing credits row either.

### 3. Fail closed on pending insert
Replace lines 236-239. If `insertErr` is truthy:
- Log the error with full detail.
- Attempt `stripe.checkout.sessions.expire(session.id)` in a try/catch (best-effort cleanup).
- Return `500` with `error: "purchase_record_failed"`. Do NOT return the URL.

### 4. Only return URL after confirmed insert
Move the `return json({ url, session_id })` inside the success path of the insert, after confirming no error.

## Sequence After Fix

```text
1. Resolve contractor identity (auth JWT or preview env)
2. Validate contractor_profiles row exists + active
3. Validate contractor_credits row exists
4. Parse + validate request body (pack_code)
5. Create Stripe Checkout Session
6. Insert pending purchase row
7. IF insert fails → expire Stripe session → return error
8. Return { url, session_id }
```

## What Does NOT Change
- Webhook (`stripe-webhook`) — untouched
- Fulfillment RPC (`fulfill_contractor_credit_purchase`) — untouched
- Frontend code — untouched
- Metadata shape — preserved
- `preview_purchase: "true"` marking — preserved
- Credit pack definitions — preserved
- CORS headers — preserved
- OTP/Twilio — untouched

## Secret Rename
- Function reads `PREVIEW_CONTRACTOR_PROFILE_ID` first, falls back to `PREVIEW_CONTRACTOR_ID` — no secret rotation needed immediately.
- A new secret `PREVIEW_CONTRACTOR_PROFILE_ID` should be set to a valid `contractor_profiles.id` that is `active` and has a `contractor_credits` row. This can be done after implementation via the secrets tool.

## Post-Deploy Verification
- Call the function via `curl_edge_functions` with `pack_code: "pack_10_credits"` to confirm:
  - If preview contractor is invalid → clear error, no Stripe session created.
  - If preview contractor is valid → URL returned, pending row exists.
- Check edge function logs to confirm fail-closed behavior.

