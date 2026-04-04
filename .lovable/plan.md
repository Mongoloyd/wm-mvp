
Goal: explain the `/admin` 401 and outline the clean fix.

What’s actually happening
- The frontend is already sending the right dev header: `x-dev-secret: WM_SANDBOX_MASTER_2026`.
- The same request also carries `Authorization: Bearer <anon key>` because `supabase.functions.invoke()` auto-attaches it.
- `supabase/functions/_shared/adminAuth.ts` is supposed to accept the dev secret before any JWT check.
- But your edge logs show only `JWT validation failed: invalid claim: missing sub claim` and never the bypass success log.
- That means the live function is not accepting the dev bypass, so it falls through to JWT validation and tries to treat the anon key like a user JWT. That key has no `sub`, so you get `invalid_token`.

Why you still see it even if `.env` is correct
- `/admin` is not failing because of `.env.example`.
- The browser-side env is already correct; the network request proves it.
- The actual source of truth on the server is `Deno.env.get("DEV_BYPASS_SECRET")` inside the edge function runtime.
- So a correct local env can still produce this exact 401 if the live edge function does not match or does not take the bypass branch.

What I verified in code
- `src/services/adminDataService.ts` sends `x-dev-secret` in DEV.
- `supabase/functions/_shared/adminAuth.ts` checks `x-dev-secret` before JWT validation.
- `supabase/config.toml` already has `verify_jwt = false` for `admin-data`, so this is not the platform blocking the request before your code runs.
- The error body matches your own `errorResponse(...)`, which confirms the request is reaching function code and failing inside your auth helper.

Do I know what the issue is?
- Yes. The request reaches `admin-data`, but the server-side dev-bypass comparison is not resolving true. Because of that, the function falls back to validating the auto-attached anon key and returns the 401 you see.

Implementation plan
1. Make the failure explicit in `supabase/functions/_shared/adminAuth.ts`
- If `x-dev-secret` is present but does not match `DEV_BYPASS_SECRET`, return a dedicated `dev_bypass_mismatch` error instead of falling through to JWT validation.
- Log only safe diagnostics: header present, env present, normalized length, match yes/no.

2. Harden the bypass matching
- Keep the trim/quote normalization already in place.
- Centralize the normalization helper so all admin functions use the exact same comparison path.
- This shared helper matters because `admin-data`, `voice-followup`, and `contractor-actions` all rely on it.

3. Make the dev request path more deterministic
- Keep sending `x-dev-secret`.
- Also send the same dev secret in the request body for `admin-data`, or switch the DEV path to a direct `fetch` call so the request shape is fully controlled.
- Keep production behavior unchanged: real session JWT only.

4. Re-verify the runtime secret path
- Confirm the live function is using the Supabase runtime secret `DEV_BYPASS_SECRET`, not just the repo env file.
- Re-check logs for one of these exact outcomes:
  - success: bypass-granted log
  - failure: explicit `dev_bypass_mismatch`

5. Re-test `/admin` end to end
- Open `/admin`
- Confirm `fetch_leads` and `fetch_webhook_deliveries` return 200
- Confirm the CRM renders data instead of blanking on the auth error

Secondary issue I found
- There is an unrelated React warning on `/admin`: `Badge` is a plain function component and is being used where a ref is passed through `TabsTrigger` / card UI.
- That should be fixed separately by converting `src/components/ui/badge.tsx` to `React.forwardRef`, but it is not the cause of the 401.

Technical details
- Files to update:
  - `supabase/functions/_shared/adminAuth.ts`
  - `src/services/adminDataService.ts`
  - possibly `supabase/functions/admin-data/index.ts` if we add a body-based dev bypass
  - optionally `src/components/ui/badge.tsx` for the unrelated warning
- No database migration needed.
- No RLS changes needed.

Expected outcome
- `/admin` stops falling through to anon-key JWT validation
- the sandbox bypass becomes deterministic
- if the secret ever drifts again, the error becomes explicit instead of the misleading `invalid_token`
