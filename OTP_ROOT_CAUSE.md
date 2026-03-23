# OTP Unlock Failure — Root Cause Analysis

## CONFIRMED: supabase.functions.invoke returns `data: null` for non-2xx responses

When `verify-otp` returns HTTP 400 (invalid/expired code), `supabase.functions.invoke` throws a `FunctionsHttpError` internally, which means:
- `data` = `null`
- `error` = `FunctionsHttpError` object (NOT the JSON body)

The frontend check at `usePhonePipeline.ts:205`:
```ts
if (error || !data?.verified) {
  const msg = data?.error || "Invalid or expired code.";
```

When the edge function returns 400:
- `error` is truthy (FunctionsHttpError) → enters error branch
- `data` is null → `data?.error` is undefined → falls back to "Invalid or expired code."
- The actual Twilio error message is LOST — it's inside `error.context.json()`, not in `data`

**This means the frontend DOES handle the error correctly** — it shows the fallback message and allows retry. The issue is NOT in the frontend error handling.

## The REAL question: Why does Twilio reject the code?

### Hypothesis 1: Double-send invalidation
- TruthGateFlow calls `send-otp` (Twilio Verify creates verification)
- If PostScanReportSwitcher's `handleSendCode` is triggered (e.g., user clicks "Send Code" button), it calls `send-otp` AGAIN
- Twilio Verify: each new verification to the same phone INVALIDATES the previous one
- User enters the code from the FIRST SMS → Twilio rejects because only the SECOND verification is active

**Verdict: UNLIKELY** — `deriveGateMode` returns `"enter_code"` when `funnelPhoneStatus === "otp_sent"`, so the user sees the OTP input directly, not the "Send Code" button. The user would have to manually click "Resend" to trigger a double-send.

### Hypothesis 2: Phone format mismatch between send and verify
- `send-otp` receives `phone_e164` from `usePhonePipeline.submitPhone()`
- `verify-otp` receives `phone_e164` from `usePhonePipeline.submitOtp()`
- Both use `activePhone` which is `options?.externalPhoneE164 || e164`
- In TruthGateFlow: `externalPhoneE164` is NOT passed (undefined), so `e164` is used
- In PostScanReportSwitcher: `externalPhoneE164: funnel?.phoneE164` is passed
- The `e164` in TruthGateFlow's pipeline is set by `screenPhone(rawDigits).e164`
- The `funnel?.phoneE164` is set by `funnel.setPhone(normalizedE164, "otp_sent")`
- `normalizedE164 = otpResult.e164 || phonePipeline.e164` — same value

**Verdict: UNLIKELY** — phone values are consistent

### Hypothesis 3: verify-otp selects wrong phone_verifications row
- `verify-otp` line 52-56: selects from `phone_verifications` WHERE `phone_e164 = phone_e164` AND `status = 'pending'` ORDER BY `created_at DESC` LIMIT 1
- Then updates that row to `status: 'verified'`
- If there are MULTIPLE pending rows for the same phone (from previous failed attempts), it picks the most recent one — which should be correct

**Verdict: UNLIKELY** — the query is correct

### Hypothesis 4: Twilio Verify Service SID mismatch
- `send-otp` uses `Deno.env.get("TWILIO_VERIFY_SERVICE_SID")`
- `verify-otp` uses `Deno.env.get("TWILIO_VERIFY_SERVICE_SID")`
- Same env var name — but are they in the same Supabase project? Edge functions share env.

**Verdict: UNLIKELY** — same env var

### Hypothesis 5: verify-otp is returning 400 because Twilio API returns non-approved status
- The user reports "Twilio OTP is received successfully" and "entering the OTP does NOT unlock the report"
- This means:
  1. `send-otp` works (Twilio sends SMS) ✅
  2. User enters correct code
  3. `verify-otp` calls Twilio VerificationCheck
  4. Twilio returns `status !== "approved"` (maybe "pending" or "canceled")
  5. `verify-otp` returns 400 with `{ error: "Invalid or expired code.", verified: false }`
  6. Frontend shows error, modal stays

### Hypothesis 6: The frontend error handling silently swallows the error
- `usePhonePipeline.submitOtp` catches the error and returns `{ status: "invalid_code" }`
- `handleOtpSubmit` in PostScanReportSwitcher calls `pipeline.submitOtp(otpValue)` but DOES NOT check the return value
- The `onVerified` callback is only called when `!error && data?.verified` — which never happens if verify-otp returns 400
- The modal stays because `isFullLoaded` never flips

**This is correct behavior IF the code is actually wrong. But the user says the code is correct.**

## MOST LIKELY ROOT CAUSE

The user says "Twilio OTP is received successfully" and "entering the OTP does NOT unlock the report or dismiss the modal."

There are two possible scenarios:

### Scenario A: verify-otp edge function is NOT deployed
If the edge function doesn't exist on Supabase, `supabase.functions.invoke("verify-otp")` returns a 404/500 error. The frontend treats this as an error and shows "Invalid or expired code." The user would see the OTP arrive (send-otp works) but verification would always fail.

### Scenario B: The code IS verified by Twilio, but the DB update + onVerified chain breaks
Looking at verify-otp lines 49-74:
1. Twilio returns `status: "approved"` ✅
2. Edge function updates `phone_verifications` row to `status: "verified"` 
3. Edge function inserts into `scan_sessions` with `lead_id` from `phone_verifications`
4. Returns `{ verified: true, scan_session_id }`

BUT: Step 3 tries to find `lead_id` from the `phone_verifications` row — which is NULL (because send-otp never sets it). If the insert into `scan_sessions` fails because of a NOT NULL constraint on `lead_id`, the entire function might throw an unhandled error, returning 500 instead of the success response.

**Wait — let me re-read verify-otp more carefully...**
