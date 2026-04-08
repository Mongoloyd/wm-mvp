

## Investigation Summary

**Root cause of "Invalid or expired code"**: The network logs show `send-otp` was called **twice** simultaneously (both at 11:55:24Z, both returned 200). The second call expired the first pending `phone_verifications` row and created a new one, which also triggered a **second Twilio Verify session**. When the user entered the code from the first SMS, it failed against the second Twilio verification — hence "Invalid or expired code."

This is a **duplicate-send race condition**, not a rate-limit issue. However, loosening limits is also a reasonable change.

**"Report loading failed"**: The `scanSessionId` is `null` in the verify-otp call (visible in console logs). Without a session ID, even a successful verification can't bind to a lead or fetch the full report. This is a separate upstream issue (the dev OTP gate dropdown doesn't have a scan session context).

---

## Plan

### 1. Loosen send-otp rate limits (send-otp/index.ts)
- Change `MAX_SENDS_PER_WINDOW` from `3` → `5`
- Keep cooldown at 30s and IP limit at 10 (these are fine)

### 2. Fix duplicate send-otp race (PostScanReportSwitcher.tsx)
- The auto-send logic is firing twice. Add a ref guard (`hasSentRef`) so `handleSendCode()` only fires once per gate-mode transition, preventing the double-send that invalidates the first Twilio code.

### 3. No changes to verify-otp
- The verify-otp function itself has no rate limiting — it just forwards to Twilio. The 400 error is Twilio rejecting a stale code due to the double-send. Fixing step 2 resolves this.

---

### Technical Details

**File changes:**

| File | Change |
|------|--------|
| `supabase/functions/send-otp/index.ts` | `MAX_SENDS_PER_WINDOW = 3` → `5` |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | Add `hasSentRef` guard around auto-send to prevent duplicate calls |

