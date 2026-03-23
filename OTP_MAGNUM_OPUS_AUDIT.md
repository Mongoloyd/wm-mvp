# OTP Magnum Opus Audit — Cross-Reference Analysis

## Twilio Error Context

```
Twilio VerificationCheck: { code: 20404, status: 404, message: "The requested resource was not found" }
```

Twilio 20404 means: "No active verification session exists for the phone + service SID combination you sent to `/VerificationCheck`." The SMS was received, so `send-otp` created a valid Twilio session. The question is: **why can't `verify-otp` find it?**

---

## Audit Point 1: Normalization Consistency

### send-otp path (frontend → backend)
1. User types digits → `usePhoneInput` stores `rawDigits` (max 10 digits)
2. `toE164(rawDigits)` produces `+1XXXXXXXXXX` or null
3. `usePhonePipeline.submitPhone()` calls `screenPhone(rawDigits)` → returns `screen.e164` (also via `toE164`)
4. `normalizedE164` is sent to `send-otp` as `phone_e164`
5. `send-otp` validates `/^\+1\d{10}$/` — passes
6. `send-otp` passes `phone_e164` to Twilio via `new URLSearchParams({ To: phone_e164, Channel: 'sms' })`
7. `send-otp` inserts `phone_e164` into `phone_verifications` table

**Result: `+1XXXXXXXXXX` reaches Twilio and DB. ✅ Clean.**

### verify-otp path (frontend → backend)
1. `usePhonePipeline.submitOtp(code)` uses `activePhone`
2. `activePhone = options?.externalPhoneE164 || e164`
3. In PostScanReportSwitcher: `externalPhoneE164: funnel?.phoneE164 ?? null`
4. `funnel.phoneE164` was set by `funnel.setPhone(result.e164, 'otp_sent')` during the send step
5. `result.e164` came from `submitPhone()` which returns `normalizedE164` — same value sent to `send-otp`
6. This `activePhone` is sent to `verify-otp` as `phone_e164`
7. `verify-otp` passes `phone_e164` to Twilio via `new URLSearchParams({ To: phone_e164, Code: code })`

**Result: Same `+1XXXXXXXXXX` should reach Twilio. ✅ In theory clean.**

### ⚠️ BUT: Stale localStorage Drift

`funnel.phoneE164` is persisted to localStorage with 24-hour expiry. If:
- User A enters phone, gets OTP sent, closes tab
- User A returns within 24 hours, localStorage rehydrates old `phoneE164`
- User A enters a DIFFERENT phone number in the UI
- `handleSendCode()` in PostScanReportSwitcher calls `pipeline.submitPhone()`
- `submitPhone()` has `hasExternal = !!options?.externalPhoneE164` → **TRUE** (stale localStorage value)
- So `normalizedE164 = options!.externalPhoneE164!` → **THE OLD PHONE**
- OTP is sent to the OLD phone, not the one the user just typed

This is a potential issue but NOT the primary 20404 cause because the same stale phone would be used for both send and verify (both read `activePhone` which reads `externalPhoneE164`).

### ⚠️ HOWEVER: The resend() path

`resend()` uses `activePhone` directly — same source. Consistent. ✅

---

## Audit Point 2: Backend-Authoritative Phone Usage

**Current state:** `verify-otp` trusts the `phone_e164` string passed from the frontend. It does NOT look up the phone from the DB pending row before calling Twilio.

**Risk:** If the frontend sends a slightly different string (whitespace, encoding, missing `+`), Twilio won't find the session.

**Recommendation:** After selecting the pending row, use the DB's `phone_e164` value for the Twilio call instead of the frontend value. This is a defense-in-depth fix.

---

## Audit Point 3: Double-Send Race Conditions

### Frontend protection:
- `submitPhone()` sets `phoneStatus = "sending_otp"` immediately
- `LockedOverlay` disables the CTA when `isLoading` is true (`sending_otp` or `verifying`)
- **BUT:** There is NO guard inside `submitPhone()` itself against concurrent calls
- If `submitPhone()` is called twice before the first completes (e.g., programmatic double-fire), both calls proceed

### Backend consequence:
- Each `send-otp` call creates a NEW Twilio verification session for the same phone
- Twilio's behavior: **the second session invalidates the first**
- Each `send-otp` call also inserts a NEW `phone_verifications` pending row
- User receives the SECOND SMS code
- User enters the SECOND code
- `verify-otp` checks against Twilio with the phone → **should work** because the latest session is the one Twilio remembers

### ⚠️ Race condition scenario:
1. User clicks "Send Code"
2. `submitPhone()` fires → calls `send-otp` → Twilio session A created
3. Due to slow network, response hasn't returned yet
4. `handleSendCode` in PostScanReportSwitcher doesn't set `funnel.setPhoneStatus('otp_sent')` until AFTER `submitPhone()` resolves
5. `gateMode` is still `"send_code"` → button is still visible
6. User clicks again → `submitPhone()` fires again → calls `send-otp` → Twilio session B created (session A now dead)
7. User receives SMS from session B, enters code
8. `verify-otp` checks code against Twilio → **should work** (session B is active)

**This race is real but shouldn't cause 20404 by itself.** The code from the latest SMS matches the latest Twilio session.

### ⚠️ BUT: What if the user enters the code from SMS A (the first one)?
- Session A was killed by session B
- Code from SMS A is now invalid
- Twilio returns 20404 because session A no longer exists

**THIS IS A PLAUSIBLE 20404 CAUSE if double-send happens.**

---

## Audit Point 4: Pending-Row Selection Correctness

`send-otp` always inserts a new row: `{ phone_e164, status: 'pending' }`. No deduplication.

`verify-otp` selects: `WHERE phone_e164 = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 1`

**This is correct** — it picks the latest pending row. But if multiple pending rows exist (from double-sends), only the latest is updated. Older ones remain as orphaned `pending` rows forever. Not a 20404 cause, but a data hygiene issue.

---

## Audit Point 5: Whitespace / Encoding Safety — 🔴 MOST LIKELY ROOT CAUSE

### send-otp encoding:
```ts
body: new URLSearchParams({ To: phone_e164, Channel: "sms" }),
```
`URLSearchParams` correctly encodes `+1...` as `%2B1...` in the form body. ✅

### verify-otp encoding:
```ts
body: new URLSearchParams({ To: phone_e164, Code: code }),
```
Same pattern. `URLSearchParams` correctly encodes `+1...` as `%2B1...`. ✅

### Frontend → Edge Function encoding:
```ts
const { data, error } = await supabase.functions.invoke("verify-otp", {
  body: { phone_e164: activePhone, code, scan_session_id: ... },
});
```

`supabase.functions.invoke` sends the body as JSON (`Content-Type: application/json`). The edge function parses it with `await req.json()`. The `+` sign in JSON is just a `+` character — no encoding issue here. ✅

### ⚠️ BUT: What does `activePhone` actually contain at verify time?

Let me trace the exact value:

1. `submitPhone()` returns `{ status: "otp_sent", e164: normalizedE164 }`
2. `handlePhoneSubmit()` calls `funnel?.setPhone(result.e164, "otp_sent")`
3. `handleSendCode()` calls `pipeline.submitPhone()` but does NOT update `funnel.phoneE164` — it only calls `funnel.setPhoneStatus('otp_sent')`

**Wait.** Look at `handleSendCode`:
```ts
const handleSendCode = useCallback(async () => {
    if (!funnel?.phoneE164) return;
    const result = await pipeline.submitPhone();
    if (result.status === "otp_sent") funnel.setPhoneStatus("otp_sent");
}, [funnel, pipeline]);
```

This path is used when `gateMode === "send_code"` — meaning the funnel already has a phone from TruthGateFlow. It calls `submitPhone()` which uses `externalPhoneE164` (the funnel phone). The phone sent to Twilio is `funnel.phoneE164`. The phone used for verify is also `activePhone = externalPhoneE164 = funnel.phoneE164`. **Consistent.** ✅

And `handlePhoneSubmit`:
```ts
const handlePhoneSubmit = useCallback(async () => {
    const result = await pipeline.submitPhone();
    if (result.status === "otp_sent" && result.e164) funnel?.setPhone(result.e164, "otp_sent");
}, [pipeline, funnel]);
```

This path is used when `gateMode === "enter_phone"` — user typed a new phone in the overlay. `submitPhone()` uses local input (no external phone). `result.e164` is the normalized value. It's stored in funnel. Then `activePhone` for verify will read `externalPhoneE164 = funnel.phoneE164 = result.e164`. **Consistent.** ✅

### 🔴 THE ACTUAL ENCODING BUG

Wait — let me re-read the verify-otp edge function more carefully:

```ts
const { phone_e164, code, scan_session_id } = await req.json();
```

The `phone_e164` value from JSON will be `"+15551234567"` — a string with a literal `+`.

Then:
```ts
body: new URLSearchParams({ To: phone_e164, Code: code }),
```

`URLSearchParams` will encode this as `To=%2B15551234567&Code=123456`. Twilio receives `+15551234567`. ✅

**This is actually correct.** Both send and verify use the same `URLSearchParams` pattern.

### 🔴🔴🔴 RE-EXAMINING: The REAL root cause

Let me look at this from Twilio's perspective. Twilio 20404 on VerificationCheck means:
1. No verification session exists for this phone + service SID, OR
2. The verification session has expired (10 minutes default), OR
3. The verification session was already consumed (approved or max attempts reached)

Given that the SMS IS received, option 1 is eliminated UNLESS the phone string differs.

**Option 2: Session expiry.** Twilio Verify sessions expire after 10 minutes by default. If the user takes more than 10 minutes to enter the code, 20404 is expected. But the user reports this happens immediately — so this is unlikely for the primary case.

**Option 3: Already consumed.** If `verify-otp` is called twice (e.g., frontend retry on network timeout), the first call approves the session, the second gets 20404 because the session is already consumed. But the frontend handles errors and doesn't auto-retry.

**Option 4: Double-send killed the session.** As analyzed in Audit Point 3 — if `send-otp` fires twice, the first Twilio session is killed. If the user enters the code from the first SMS, Twilio returns 20404.

### 🔴 REVISED ROOT CAUSE HYPOTHESIS

The most likely cause is a **double-send race condition** combined with the user entering the code from the **first (now-dead) SMS**:

1. User clicks "Send Code" → `send-otp` fires → Twilio session A → SMS A sent
2. Network is slow OR component re-renders OR `resend()` fires quickly
3. `send-otp` fires again → Twilio session B → SMS B sent (session A killed)
4. User sees SMS A arrive first, enters that code
5. `verify-otp` sends code from SMS A to Twilio → 20404 (session A is dead)

**Supporting evidence:**
- `handleSendCode` has NO loading guard — it checks `!funnel?.phoneE164` but not `pipeline.phoneStatus`
- `LockedOverlay` disables the button based on `isLoading` which checks `pipeline.phoneStatus === "sending_otp"`, BUT there's a gap: `submitPhone()` sets `phoneStatus = "sending_otp"` synchronously, but `handleSendCode` is an async callback that could be invoked before React re-renders the disabled state
- The `resend()` function has a cooldown guard but the initial send does not

**ALSO: There's a second, subtler issue.** Look at `handleSendCode`:

```ts
const handleSendCode = useCallback(async () => {
    if (!funnel?.phoneE164) return;
    const result = await pipeline.submitPhone();
    if (result.status === "otp_sent") funnel.setPhoneStatus("otp_sent");
}, [funnel, pipeline]);
```

`pipeline.submitPhone()` internally calls `send-otp`. But `pipeline` was created with `externalPhoneE164: funnel?.phoneE164 ?? null`. This is captured at **hook creation time**. If `funnel.phoneE164` changes between hook creation and `submitPhone()` invocation... actually no, `options?.externalPhoneE164` is read fresh each render because it's a prop to the hook.

Actually wait — `usePhonePipeline` captures `options` in the `useCallback` dependency array for `submitPhone`:

```ts
const submitPhone = useCallback(async (): Promise<PipelineStartResult> => {
    ...
    const hasExternal = !!options?.externalPhoneE164;
    ...
}, [rawDigits, mode, options?.externalPhoneE164]);
```

The dependency is `options?.externalPhoneE164`. This means `submitPhone` is recreated when `externalPhoneE164` changes. **This is correct** — the closure captures the latest value. ✅

---

## Audit Point 6: Twilio Config Consistency

Both `send-otp` and `verify-otp` read:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

Both use the same env var names. Both use the same URL pattern:
- Send: `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`
- Verify: `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`

**Consistent.** ✅

---

## ROOT CAUSE VERDICT

**Primary cause (HIGH confidence):** Double-send race condition. The `send-otp` function can be invoked twice in rapid succession because:
1. `handleSendCode` has no in-flight guard
2. The `isLoading` UI disable depends on React re-render timing
3. Each `send-otp` call creates a new Twilio session, killing the previous one
4. User enters code from the first (now-dead) SMS → Twilio 20404

**Secondary cause (MEDIUM confidence):** Frontend trusts its own phone string for verify instead of using the DB-authoritative value. If any drift occurs (stale localStorage, encoding edge case), the phone sent to Twilio for verify won't match the send session.

**Tertiary cause (LOW confidence):** Twilio session timeout. If user takes >10 minutes to enter code, the session expires. This is expected behavior but should be handled gracefully.

---

## REQUIRED FIXES

### Fix 1: Prevent double-send at the pipeline level
Add an `isSendingRef` guard to `submitPhone()` to prevent concurrent invocations.

### Fix 2: Backend-authoritative phone for Twilio verify
After selecting the pending row in `verify-otp`, fetch the `phone_e164` from that row and use it for the Twilio call instead of the frontend value.

### Fix 3: Defensive trim on verify-otp
Trim and validate the phone string before using it.

### Fix 4: Cancel stale pending rows on new send
When `send-otp` creates a new pending row, mark all older pending rows for the same phone as `expired`.

### Fix 5: Add in-flight guard to handleSendCode
Prevent the UI callback from firing while a send is already in progress.
