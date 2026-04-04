

# Harden `get_analysis_full` with Access Token Binding

## The Real Security Gap

The current RPC already binds phone → lead → scan_session via joins. The actual gap is:

1. The RPC is callable by `anon` (no JWT required — correct for this anonymous flow)
2. The only credentials needed are `scan_session_id` (UUID, may leak in URLs) + `phone_e164` (10 digits)
3. An attacker who obtains both values (e.g., shoulder-surfing a URL + knowing the phone number) can call the RPC directly and receive the full report

Since this is an anonymous user flow (no Supabase auth session), we cannot bind to a JWT. Instead, we introduce a **cryptographic access token (nonce)** generated at OTP verification time.

## How It Works

```text
verify-otp succeeds
  → generate crypto-random access_token (UUID)
  → store in phone_verifications row
  → return to client alongside { verified: true }

Client stores access_token in localStorage (verifiedAccess record)

get_analysis_full(scan_session_id, phone_e164, access_token)
  → JOIN now also checks pv.access_token = p_access_token
  → Without the token, RPC returns empty even with correct phone + session
```

## Changes

### 1. Database Migration — Add `access_token` column + update RPC

- Add `access_token TEXT` column to `phone_verifications`
- Replace `get_analysis_full` RPC to require a third parameter `p_access_token TEXT`
- The authorization check adds: `AND pv.access_token = p_access_token`

### 2. Edge Function — `verify-otp/index.ts`

- After Twilio approval, generate `crypto.randomUUID()` as the access token
- Store it in the `phone_verifications` update payload
- Return it in the response: `{ verified: true, phone_e164, access_token }`

### 3. Frontend — `verifiedAccess.ts`

- Add `access_token` to the `VerifiedAccessRecord` interface
- `saveVerifiedAccess` accepts and stores the token
- `getVerifiedAccess` returns it

### 4. Frontend — `useAnalysisData.ts`

- `fetchFull` accepts `accessToken` as second parameter alongside `phoneE164`
- Passes `p_access_token` to the RPC call
- `tryResume` reads `access_token` from the localStorage record and passes it

### 5. Frontend — Callers of `fetchFull`

- Update `VerifyGate.tsx` (or wherever verify-otp response is handled) to extract `access_token` from the response and pass it through to `fetchFull`

### 6. Edge Functions using `get_analysis_full` as auth gate

- `generate-contractor-brief` and `generate-negotiation-script` both call the RPC
- Update them to accept and forward `access_token`
- `compare-quotes` also calls it — same treatment

## Security Properties After This Change

- **scan_session_id + phone alone = insufficient** (token required)
- **Token is single-use per verification** (one token per verify-otp success)
- **Token never leaves the verifying browser** (stored in localStorage, not in URLs)
- **Resume flow preserved** (token stored alongside phone in the 24h record)
- **Production RPC stays anon-callable** (correct for the anonymous upload flow)

## Files Modified

| File | Change |
|------|--------|
| Migration SQL | Add column + replace RPC |
| `supabase/functions/verify-otp/index.ts` | Generate + store + return token |
| `src/lib/verifiedAccess.ts` | Store/retrieve token |
| `src/hooks/useAnalysisData.ts` | Pass token to RPC |
| `src/components/TruthReportFindings/VerifyGate.tsx` | Forward token from verify response |
| `supabase/functions/generate-contractor-brief/index.ts` | Accept + forward token |
| `supabase/functions/generate-negotiation-script/index.ts` | Accept + forward token |
| `supabase/functions/compare-quotes/index.ts` | Accept + forward token |

