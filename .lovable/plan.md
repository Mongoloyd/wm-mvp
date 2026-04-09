

## Problem Explanation

There are **two errors** compounding here:

1. **`getClaims` is not a function** (line 79): The `esm.sh/@supabase/supabase-js@2.49.1` version used in this Edge Function does not expose `auth.getClaims()`. That method was added in a later SDK version and is only available with the signing-keys system. Since the function imports an older SDK pinned at `2.49.1`, the call throws a `TypeError` at runtime.

2. **`Deno.core.runMicrotasks() is not supported`**: This is a cascading error. The Stripe SDK imported via `esm.sh/stripe@17.7.0?target=deno` pulls in Node.js compatibility shims from `deno.land/std@0.177.1/node/`, which call `Deno.core.runMicrotasks()` — an API not available in the Supabase Edge Runtime. This means the Stripe import itself is incompatible.

**In summary**: Both the auth call and the Stripe import are broken due to version/environment mismatches.

---

## Fix Plan

### File: `supabase/functions/create-checkout-session/index.ts`

**Change 1 — Fix auth (line 79-85)**

Replace `anonClient.auth.getClaims(token)` with `anonClient.auth.getUser()`. The `getUser()` method works reliably in all Supabase JS versions inside Edge Functions when the Authorization header is forwarded via the client constructor.

```typescript
const { data: userData, error: userErr } = await anonClient.auth.getUser();
if (userErr || !userData?.user?.id) {
  return json({ error: "unauthenticated", message: "Invalid auth token." }, 401);
}
const authUserId = userData.user.id;
```

**Change 2 — Fix Stripe import (line 12)**

Replace the `esm.sh` Stripe import with the `npm:` specifier, which is natively supported by the Supabase Edge Runtime and avoids the Node.js shim incompatibility:

```typescript
import Stripe from "npm:stripe@17.7.0";
```

Remove the `?target=deno` esm.sh URL entirely.

**Change 3 — Optionally update Supabase SDK import (line 11)**

For consistency and to ensure `getUser()` works correctly:

```typescript
import { createClient } from "npm:@supabase/supabase-js@2";
```

No other files are modified. Deploy the function after the edit.

---

## What Comes Next (Prompts 2 and 3)

**Prompt 2 — Fix `stripe-webhook/index.ts` with the same import pattern.** The webhook function also imports Stripe via `esm.sh` and will hit the same `Deno.core.runMicrotasks()` crash when Stripe sends an event. That function needs the identical `npm:stripe` import fix, plus the Supabase SDK import update.

**Prompt 3 — End-to-end test of the full credit purchase flow.** Log into the partner portal, click "Add Credits," complete a test payment with Stripe test card `4242 4242 4242 4242`, verify the success toast appears, and confirm the `contractor_credit_purchases` row transitions from `pending` → `paid` → `fulfilled` and the `contractor_credits.balance` increments correctly.

