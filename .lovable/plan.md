
Goal: eliminate the admin-data 401s by making the dev bypass secret consistent everywhere and confirming the deployed edge function is actually using the bypass path.

What I found
- `src/services/adminDataService.ts` is already correct:
  - in DEV it reads `import.meta.env.VITE_DEV_BYPASS_SECRET`
  - it sends that value as the `x-dev-secret` header
- `supabase/functions/_shared/adminAuth.ts` is already correct:
  - it checks `req.headers.get("x-dev-secret")`
  - it compares it to `Deno.env.get("DEV_BYPASS_SECRET")`
  - that check happens before JWT validation
- The actual mismatches in the repo are:
  - `.env.example` still uses the old `dev-bypass-windowman-2024`
  - `.env` still has `VITE_ADMIN_SECRET="wm-operator-2024"`
- `VITE_ADMIN_SECRET` is not referenced anywhere in `src/` or `supabase/`, so it is currently just a config/documentation value, not the thing causing the 401.
- The network logs prove the frontend is already sending `x-dev-secret: WM_SANDBOX_MASTER_2026`, yet the function still returns `invalid_token`. That strongly suggests the deployed `admin-data` function is not honoring the bypass at runtime yet, either because:
  1. the runtime secret `DEV_BYPASS_SECRET` is still different, or
  2. `admin-data` is running an older deployment.

Implementation plan
1. Normalize both env files
- Update `.env` so both values are:
  - `VITE_DEV_BYPASS_SECRET="WM_SANDBOX_MASTER_2026"`
  - `VITE_ADMIN_SECRET="WM_SANDBOX_MASTER_2026"`
- Update `.env.example` to match exactly and remove the old `dev-bypass-windowman-2024` string.
- Add `VITE_ADMIN_SECRET` to `.env.example` too so the example file matches the real local config.

2. Keep the frontend bypass logic as-is
- Do not change the main flow in `src/services/adminDataService.ts` because it already matches the requested behavior.
- Optionally add a small defensive comment/log so future debugging is clearer, but no functional rewrite is needed there.

3. Keep the backend bypass logic as-is, but verify deployment state
- `supabase/functions/_shared/adminAuth.ts` already contains the correct explicit comparison against `Deno.env.get("DEV_BYPASS_SECRET")`.
- The key action is to ensure the deployed `admin-data` function is rebuilt with this helper and that Supabase runtime secrets are synced.

4. Redeploy the edge function
- Redeploy `admin-data` so the live function definitely includes the current `_shared/adminAuth.ts` bypass logic.
- If we touch `_shared/adminAuth.ts` at all during cleanup, I would also redeploy any other admin functions importing it for consistency, but `admin-data` is the urgent one.

5. Verify the fix end-to-end
- Trigger `/admin` again in the sandbox.
- Confirm the `admin-data` requests return 200 instead of 401.
- Confirm live rows load in the CRM.
- If it still fails, check edge logs for one of these two signals:
  - expected: `DEV BYPASS: Granting super_admin via X-Dev-Secret`
  - failure: JWT validation runs, which means the secret still does not match at runtime

Technical details
- Files to update:
  - `.env`
  - `.env.example`
- Files to verify but likely not change:
  - `src/services/adminDataService.ts`
  - `supabase/functions/_shared/adminAuth.ts`
- Important note:
  - unifying `VITE_ADMIN_SECRET` helps consistency, but it does not fix the current 401 by itself because that variable is unused in the codebase today
  - the real fix path is: frontend `VITE_DEV_BYPASS_SECRET` = backend `DEV_BYPASS_SECRET` = redeployed `admin-data`

Expected outcome
- The sandbox keeps sending `x-dev-secret: WM_SANDBOX_MASTER_2026`
- `admin-data` accepts the bypass before JWT validation
- The CRM loads real data without requiring a logged-in Supabase session
