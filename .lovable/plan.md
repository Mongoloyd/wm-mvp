

# Root Cause: "Report loading failed" on name+email-only submission

## What's happening

1. User previously completed a scan with phone ending in 7938. The funnel persists `phoneE164` and `phoneStatus` to localStorage (24hr TTL).
2. User starts a **new** scan, enters only name + email (no phone). TruthGateFlow inserts a lead with `phone_e164: null`.
3. PostScanReportSwitcher mounts. The funnel context reads back the **stale** phone from localStorage. `gateMode` resolves to `"send_code"`.
4. The auto-send effect fires, sending OTP to the old phone number.
5. User enters the OTP code. `verify-otp` succeeds (Twilio verifies the phone), but the `phone_verifications` record is linked to the **old** lead, not the new scan session's lead.
6. `fetchFull` calls `get_analysis_full(new_scan_session, old_phone)`. The RPC joins `phone_verifications → leads → scan_sessions` and finds no match → returns `__UNAUTHORIZED__`.
7. `fullFetchError` is set to "Verification failed" but PostScanReportSwitcher **never reads it**. Instead, the blunt 5-second stall timer fires → "Report loading failed."

## Two bugs to fix

### Bug A: Stale funnel phone leaks across sessions

**File:** `src/components/TruthGateFlow.tsx` (around line 409-415)

When a new lead is created without a phone, the old funnel phone must be cleared. Currently the code only sets the phone if `phoneE164` is truthy. Add an else branch:

```ts
if (phoneE164) {
  funnel.setPhone(phoneE164, "screened_valid");
} else {
  // Clear stale phone from previous session so LockedOverlay
  // shows enter_phone instead of auto-sending to old number
  funnel.setPhone("", "none");
}
```

This ensures a no-phone submission clears any leftover phone from localStorage, so the gate correctly shows "enter_phone" mode.

### Bug B: Surface `fullFetchError` in PostScanReportSwitcher

**File:** `src/components/post-scan/PostScanReportSwitcher.tsx`

The component receives `isFullLoaded` from props but has no visibility into `fullFetchError`. The stall timer is a workaround that can't distinguish "still loading" from "failed."

1. Add `fullFetchError?: string | null` to the `Props` type.
2. Pass it from `Index.tsx` where `fullFetchError` is already destructured from `useAnalysisData`.
3. In the stall detection `useEffect`, also trigger `setFetchStalled(true)` immediately when `fullFetchError` is set (no 5-second wait needed — the fetch already failed).
4. Display `fullFetchError` as the error message in the stalled UI instead of the generic "Report loading failed" text.

**File:** `src/pages/Index.tsx`

Pass `fullFetchError` to `PostScanReportSwitcher`:
```ts
<PostScanReportSwitcher
  ...
  fullFetchError={fullFetchError}
/>
```

## Impact

- Bug A is the **primary fix**: prevents the wrong phone from ever being used, eliminating the `__UNAUTHORIZED__` failure entirely for no-phone submissions.
- Bug B is a **resilience improvement**: ensures that when `fetchFull` fails for any reason, the user sees the actual error message immediately instead of waiting 5 seconds for a generic message.

## Files changed
- `src/components/TruthGateFlow.tsx` — clear stale phone on no-phone submit
- `src/components/post-scan/PostScanReportSwitcher.tsx` — add `fullFetchError` prop, use it in stall detection
- `src/pages/Index.tsx` — pass `fullFetchError` prop

