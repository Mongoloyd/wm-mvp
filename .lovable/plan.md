

# Robust Shared Phone Normalizer for OTP Edge Functions (Revised)

## Problem
Current `send-otp` and `verify-otp` lack robust phone parsing. They cannot handle `%2B` encoding, formatted numbers like `(561) 468-5571`, or bare 10-digit numbers. The normalizer logic is duplicated rather than shared.

## Design Notes
- **American spelling**: `normalizePhone` everywhere — no British variants.
- **US-only**: This normalizer is intentionally US-only for the current WindowMan market and only accepts numbers that can canonicalize to `+1XXXXXXXXXX`.
- **Sanitizing, not pass-through**: Even already-valid E.164 input is reconstructed from extracted digits to produce a sanitized canonical value.

## Expected `normalizePhone` outputs

```text
"+15614685571"           -> "+15614685571"
" +15614685571 "         -> "+15614685571"
"%2B15614685571"         -> "+15614685571"
"(561) 468-5571"         -> "+15614685571"
"561-468-5571"           -> "+15614685571"
"5614685571"             -> "+15614685571"
"15614685571"            -> "+15614685571"
"561.468.5571"           -> "+15614685571"
""                       -> ""
"abc"                    -> ""
"+44..."                 -> ""
```

## Plan

### Step 1: Create shared normalizer
Create `supabase/functions/_shared/normalizePhone.ts`:
- `decodeURIComponent` with try/catch fallback
- Trim, extract digits, detect leading `+`
- 10-digit → `+1XXXXXXXXXX`, 11-digit starting with `1` → `+1XXXXXXXXXX`
- Accepts already-valid US E.164 input and returns a sanitized canonical `+1XXXXXXXXXX` value
- Returns `""` for anything invalid (including non-US numbers)

### Step 2: Update `send-otp/index.ts`
- Import `normalizePhone` from `../_shared/normalizePhone.ts`
- Replace destructure with `normalizePhone(body.phone_e164)`
- Keep the strict `^\+1\d{10}$` validation after normalization as a belt-and-suspenders guard

### Step 3: Update `verify-otp/index.ts`
- Import same shared `normalizePhone`
- Replace manual trim with `normalizePhone(body.phone_e164)`
- On success, return canonical `phone_e164` in the response body

### Step 4: Frontend — use server-canonical phone
In `usePhonePipeline.ts`, after successful verify-otp, use the server-returned `phone_e164` for `saveVerifiedAccess` instead of the locally-held value.

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/_shared/normalizePhone.ts` | New — shared US-only normalizer |
| `supabase/functions/send-otp/index.ts` | Import shared normalizer, replace inline parsing |
| `supabase/functions/verify-otp/index.ts` | Import shared normalizer, return canonical phone on success |
| `src/hooks/usePhonePipeline.ts` | Use server-returned `phone_e164` from verify response |

