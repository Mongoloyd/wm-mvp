

## Plan: Add Preview Checkout Diagnostic Mode

### Approach
Add a `GET` request handler to the existing `create-checkout-session` function. The current handler only processes `POST` (and `OPTIONS`). A `GET` request will run the preview config validation checks and return a readiness report — no Stripe calls, no DB writes.

This is the lowest-risk option: single file change, no new functions, no production behavior change (production callers always `POST`).

### What Changes

**File:** `supabase/functions/create-checkout-session/index.ts`

Add a `GET` handler branch at the top of `Deno.serve`, before the existing `POST` logic:

1. Check `PREVIEW_CHECKOUT_ENABLED` env var
2. Read `PREVIEW_CONTRACTOR_PROFILE_ID` (with `PREVIEW_CONTRACTOR_ID` fallback)
3. Check Stripe key is test mode (`sk_test_`)
4. Query `contractor_profiles` for existence + active status
5. Query `contractor_credits` for existence + current balance
6. Return a JSON readiness object with all check results and an overall `ready: boolean`

### Response Shape

```json
{
  "preview_enabled": true,
  "contractor_id_configured": true,
  "contractor_id": "f184e9db-...",
  "stripe_test_mode": true,
  "profile_exists": true,
  "profile_status": "active",
  "credits_row_exists": true,
  "credits_balance": 10,
  "ready": true
}
```

### Safety Guarantees
- `GET` only — no Stripe session created, no DB mutation
- Does not expose Stripe keys or service role keys
- Only reveals the contractor UUID (already in env config, not sensitive)
- Production `POST` path is completely untouched
- No frontend changes

### Technical Detail
The diagnostic branch reuses the existing `svc` (service-role) client and queries the same tables that `validateContractor()` checks, but returns structured results instead of error responses.

