

# Edge Function Audit — Findings & Fix Plan

## Active Build Errors (Must Fix)

### 1. `sessionService.ts` — Broken comment block (line 358)
A block comment was improperly closed. Line 358 has a stray `*/` and line 360 has a stray ` * Push event...` outside any comment. The `declare global` block (lines 353-357) and the JSDoc for `pushToDataLayer` need their comment delimiters fixed. Likely a `/*` was deleted from around line 349, leaving orphaned `*/` and `*` tokens.

**Fix**: Restore proper `/**` comment opening before the `declare global` block, or restructure so the block comment and JSDoc are syntactically valid.

### 2. `admin-data/index.ts` — `error` is of type `unknown` (line 240-241)
The catch block uses `error.message` but TypeScript requires narrowing `unknown` first.

**Fix**: Change `error.message` to `error instanceof Error ? error.message : String(error)` in both locations.

---

## Code Quality & Security Improvements

### 3. `contractor-actions` — No authentication
This function handles sensitive write operations (billing, contact release) but has **zero auth checks**. Any anonymous caller can invoke any action. The comment says "operator-only" but there's no `validateAdminRequest` call.

**Fix**: Add `validateAdminRequest(req)` or `validateAdminRequestWithRole(req, ["super_admin", "operator"])` at the top.

### 4. `voice-followup` — No authentication  
Same issue. Accepts `phone_e164` and fires webhooks with no caller verification. Anyone can trigger outbound calls.

**Fix**: Either require admin auth (for admin-triggered calls) or verify the caller owns the session via phone verification check.

### 5. `capi-event` — Uses deprecated `serve` import
Uses `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"` (old version) instead of `Deno.serve()`. Also uses an older CORS header set missing the `x-supabase-client-*` headers.

**Fix**: Migrate to `Deno.serve()` and align CORS headers with the other functions.

### 6. `calculate-estimate-metrics` — Uses deprecated `serve` import
Same as above: `import { serve } from "https://deno.land/std@0.224.0/http/server.ts"`.

**Fix**: Migrate to `Deno.serve()`.

### 7. `scan-quote` — Massive 1300+ line single file
Contains duplicated metric logic (the same bucket classification, median, round helpers exist in both `scan-quote` and `calculate-estimate-metrics`). This is a maintenance risk but not a blocker. Noted as tech debt.

### 8. `send-otp` — Missing `lead_id` binding on insert
The `phone_verifications` insert doesn't bind a `lead_id`. The `verify-otp` function later tries to resolve and bind it, but if the caller knows the `scan_session_id` at send time, it could be bound earlier for better traceability.

**Minor improvement**, not a bug.

### 9. `generate-contractor-brief` — Error catch doesn't narrow `unknown`
The catch block at the end logs `err` directly. While it doesn't access `.message`, it's inconsistent with best practices.

---

## Summary of Changes

| File | Priority | Change |
|------|----------|--------|
| `src/services/sessionService.ts` | **Critical** | Fix broken comment syntax at lines 349-361 |
| `supabase/functions/admin-data/index.ts` | **Critical** | Narrow `error` from `unknown` in catch block |
| `supabase/functions/contractor-actions/index.ts` | **High** | Add admin auth validation |
| `supabase/functions/voice-followup/index.ts` | **High** | Add auth check (admin or session-owner) |
| `supabase/functions/capi-event/index.ts` | **Medium** | Migrate to `Deno.serve()`, update CORS |
| `supabase/functions/calculate-estimate-metrics/index.ts` | **Medium** | Migrate to `Deno.serve()` |

