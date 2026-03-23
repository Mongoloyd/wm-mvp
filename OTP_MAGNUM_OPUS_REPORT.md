# OTP 20404 Debug Report — Magnum Opus Pass

**Commit:** `f7588bf`
**Push:** `270e4fc..f7588bf main → main`
**Date:** 2026-03-23
**Files changed:** 5 (4 code + 1 audit doc)

---

## 1. Root Cause Summary

The Twilio `20404` ("The requested resource was not found") error occurs because **a double-send race condition kills the first Twilio Verify session, and the user enters the code from the now-dead first SMS**.

The chain of events:

1. User clicks "Send Code" → `send-otp` fires → Twilio creates **Session A** → SMS A dispatched.
2. Before the network response returns and React re-renders the disabled button state, the user (or a programmatic re-fire) triggers `send-otp` again → Twilio creates **Session B** → **Session A is immediately invalidated** → SMS B dispatched.
3. The user sees SMS A arrive first (or only notices SMS A), enters that code.
4. `verify-otp` sends the code from SMS A to Twilio → Twilio has no active session matching that code → **20404**.

Three compounding factors made this possible:

| Factor | Location | Issue |
|---|---|---|
| No in-flight guard on `submitPhone()` | `usePhonePipeline.ts` | Concurrent calls both reach Twilio |
| No in-flight guard on `handleSendCode` | `PostScanReportSwitcher.tsx` | UI callback can fire before React disables the button |
| No pending-row cleanup on re-send | `send-otp/index.ts` | Multiple orphaned `pending` rows accumulate |

A secondary defense gap: `verify-otp` trusted the frontend-supplied phone string for the Twilio call instead of using the DB-authoritative value from the pending row, leaving the door open for encoding drift or stale localStorage values to cause a phone mismatch.

---

## 2. File-by-File Fix Blocks

### File 1: `src/hooks/usePhonePipeline.ts`

**What changed:** Added `isSendingRef` (a `useRef<boolean>`) that acts as a synchronous mutex. `submitPhone()` checks it at entry and bails if already true. It is set to `true` before the `send-otp` call and reset in a `finally` block.

```diff
+ const isSendingRef = useRef(false);

  const submitPhone = useCallback(async () => {
+   if (isSendingRef.current) {
+     console.warn("[usePhonePipeline] submitPhone blocked — send already in-flight");
+     return { status: "error", error: "Already sending. Please wait." };
+   }
    ...
    // validate_and_send_otp
+   isSendingRef.current = true;
    setPhoneStatus("sending_otp");
    try { ... }
    catch { ... }
+   finally { isSendingRef.current = false; }
  }, [...]);
```

**Why `useRef` instead of `useState`:** A ref update is synchronous and does not depend on React's render cycle. Two rapid calls within the same tick will both see the ref flip — a state variable would not update until the next render, leaving the race window open.

---

### File 2: `src/components/post-scan/PostScanReportSwitcher.tsx`

**What changed:** Added `isSendInFlight` state that guards both `handleSendCode` and `handlePhoneSubmit`. Also wired into `isLoading` so the LockedOverlay button stays disabled during the entire send round-trip.

```diff
+ const [isSendInFlight, setIsSendInFlight] = useState(false);

  const handleSendCode = useCallback(async () => {
-   if (!funnel?.phoneE164) return;
-   const result = await pipeline.submitPhone();
-   if (result.status === "otp_sent") funnel.setPhoneStatus("otp_sent");
+   if (!funnel?.phoneE164 || isSendInFlight) return;
+   setIsSendInFlight(true);
+   try {
+     const result = await pipeline.submitPhone();
+     if (result.status === "otp_sent") funnel.setPhoneStatus("otp_sent");
+   } finally { setIsSendInFlight(false); }
  }, [...]);

  // Same pattern for handlePhoneSubmit

  isLoading:
+   isSendInFlight ||
    pipeline.phoneStatus === "sending_otp" ||
    pipeline.phoneStatus === "verifying",
```

This provides a **two-layer defense**: the ref in the hook catches programmatic double-fires within the same tick, and the state in the orchestrator catches UI-level re-clicks across renders.

---

### File 3: `supabase/functions/send-otp/index.ts`

**What changed:** Before inserting a new `pending` row, all existing `pending` rows for the same phone are marked `expired`. This ensures `verify-otp` always finds exactly one pending row and prevents orphaned row accumulation.

```diff
+ // Mark any existing pending rows for this phone as expired
+ await supabase
+   .from("phone_verifications")
+   .update({ status: "expired" })
+   .eq("phone_e164", phone_e164)
+   .eq("status", "pending");

  await supabase.from("phone_verifications").insert({
    phone_e164, status: "pending",
  });
```

---

### File 4: `supabase/functions/verify-otp/index.ts`

**What changed (4 improvements):**

1. **Defensive trim + E.164 validation** — `phone_e164` is trimmed and validated against `/^\+1\d{10}$/` before any processing. Logs whether trimming changed the value.

2. **DB-authoritative phone for Twilio** — The pending row is fetched (including its `phone_e164` column) BEFORE the Twilio call. The DB value is used as `twilioPhone` for the VerificationCheck, with the frontend value as fallback only if no pending row exists.

3. **Enhanced diagnostic logging** — Every decision point logs structured JSON: raw vs trimmed phone, pending row lookup result, DB phone vs frontend phone match, Twilio encoded body, and specific 20404 context.

4. **Specific 20404 error message** — Instead of the generic "Invalid or expired code," a 20404 now returns "Verification session expired or not found. Please request a new code." so the user knows to resend.

---

## 3. What Was NOT the Cause

| Hypothesis | Verdict | Reason |
|---|---|---|
| Normalization drift (toE164 inconsistency) | **Ruled out** | Both send and verify paths use the same `toE164()` → `+1XXXXXXXXXX` consistently |
| Frontend state drift (stale localStorage) | **Ruled out as primary** | Even with stale phone, both send and verify read the same `activePhone` source |
| Whitespace / `+` encoding bug | **Ruled out** | Both functions use `URLSearchParams` which correctly encodes `+` as `%2B` |
| Twilio config mismatch | **Ruled out** | Both functions read the same 3 env vars and hit the same service SID |
| Pending-row selection bug | **Ruled out** | `ORDER BY created_at DESC LIMIT 1` correctly selects the latest row |

---

## 4. Manual Retest Checklist

Perform this test after deploying the updated `send-otp` and `verify-otp` edge functions.

### Setup
- Open a **fresh Incognito window** (clears localStorage, no stale funnel state)
- Open browser DevTools → Network tab (filter: `functions/`)
- Open browser DevTools → Console (filter: `usePhonePipeline`)

### Step 1: Send OTP (one click only)
1. Complete the TruthGateFlow with a real phone number
2. Upload a quote, wait for scan to complete
3. On the report page, click "Send Code" **exactly once**
4. **Verify in Network tab:**
   - Exactly **1** request to `send-otp`
   - Response: `200 OK`, body: `{ "success": true }`
5. **Verify in Console:**
   - `[usePhonePipeline] submitPhone → calling send-otp { phone: "+1XXXXXXXXXX" }`
   - `[usePhonePipeline] send-otp SUCCESS`
6. **Verify SMS received** on the phone

### Step 2: Verify OTP (one attempt)
1. Enter the 6-digit code from the SMS
2. Click "Verify"
3. **Verify in Network tab:**
   - Exactly **1** request to `verify-otp`
   - Request body: `{ "phone_e164": "+1XXXXXXXXXX", "code": "NNNNNN", "scan_session_id": "..." }`
   - Response: `200 OK`, body: `{ "success": true, "verified": true }`
4. **Verify in Console:**
   - `[usePhonePipeline] submitOtp → calling verify-otp { phone: "+1XXXXXXXXXX", code: "NNNNNN", ... }`
   - `[usePhonePipeline] verify-otp SUCCESS — calling onVerified`

### Step 3: Confirm values match
Compare these three values — they must be **identical**:

| Source | Where to find it |
|---|---|
| Frontend send payload | Network tab → `send-otp` request body → `phone_e164` |
| Frontend verify payload | Network tab → `verify-otp` request body → `phone_e164` |
| Supabase edge function log | Supabase Dashboard → Edge Functions → `verify-otp` logs → `twilioPhone` |

All three must show the exact same `+1XXXXXXXXXX` string.

### Step 4: Confirm double-send is blocked
1. Rapidly double-click "Send Code" (or "Submit" on the phone entry)
2. **Verify in Network tab:** Only **1** `send-otp` request fires
3. **Verify in Console:** Second click produces `[usePhonePipeline] submitPhone blocked — send already in-flight`

### Expected Supabase Logs (verify-otp)
```
[verify-otp] invoked { phone_e164_raw: "+1...", phone_e164_trimmed: "+1...", phone_match: true, ... }
[verify-otp] pending row lookup { found: true, dbPhone: "+1...", twilioPhone: "+1...", phoneMatch: true }
[verify-otp] calling Twilio VerificationCheck { twilioPhone: "+1...", encodedBody: "To=%2B1...&Code=..." }
[verify-otp] Twilio response { httpStatus: 200, verificationStatus: "approved", ... }
[verify-otp] complete — returning success
```

---

## 5. Deployment Reminder

The two edge functions (`send-otp` and `verify-otp`) are **Git-committed but not yet deployed to Supabase**. The founder must deploy them via Lovable or the Supabase CLI:

```bash
supabase functions deploy send-otp
supabase functions deploy verify-otp
```

The `get_analysis_full` SQL migration (`20260322_fix_get_analysis_full_session_binding.sql`) is also still pending deployment.
