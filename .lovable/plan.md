

# Fix Plan: DB Constraint + 5 Frontend Patches

## Overview
One database migration and five frontend file changes to unblock the OTP partial/full reveal flow.

---

## Step 1: Database Migration — Fix `lead_events` constraints

**New file:** `supabase/migrations/20250407_fix_lead_events_constraints.sql`

Drop and recreate the two check constraints, preserving all existing allowed values and adding the missing ones:
- `lead_events_event_name_check`: add `crm_handoff_queued`
- `lead_events_event_source_check`: add `db_trigger`

The exact current allowed values will be pulled from the live constraint definitions (already queried). The migration will `ALTER TABLE ... DROP CONSTRAINT` then `ALTER TABLE ... ADD CONSTRAINT` with the full expanded list.

**Why:** The `trg_fire_crm_handoff` trigger inserts these values on `leads` UPDATE. Without them, the entire verify-otp transaction rolls back, leaving `phone_verified = false`.

---

## Step 2: Fix race condition — `useAnalysisData.ts`

**File:** `src/hooks/useAnalysisData.ts`

Two changes:

a) Add an `isFullLoadedRef` (a ref mirroring `isFullLoaded` state). Inside `doFetch` (the preview fetcher), before calling `setData(...)`, check `if (isFullLoadedRef.current) { setIsLoading(false); return; }`. This prevents a slow preview fetch from overwriting full data that `tryResume` already loaded.

b) Fix `mapSeverity` (line 82): move `"pass"` and `"confirmed"` from the amber return to green:
```
if (s === "low" || s === "info" || s === "pass" || s === "confirmed") return "green";
```

---

## Step 3: Fix race condition — `Index.tsx`

**File:** `src/pages/Index.tsx`

Line 89: Add `analysisLoading` guard to the resume effect, matching `ReportClassic`'s correct pattern:
```ts
if (!scanSessionId || isFullLoaded || isResuming || analysisLoading) return;
```

---

## Step 4: Auto-submit on 6th digit — `LockedOverlay.tsx`

**File:** `src/components/LockedOverlay.tsx`

Add a `useEffect` + ref guard that fires `onOtpSubmit()` when `otpValue.length === 6` in `enter_code` mode, transitioning from < 6 digits. Uses a `prevOtpLengthRef` to prevent re-firing on re-renders, and checks `!isLoading` to avoid double-submit.

---

## Step 5: Fix ReportClassic double-fetch + stale phone

**File:** `src/pages/ReportClassic.tsx`

Three changes:

a) Remove `fetchFull` from the `onVerified` callback in `usePhonePipeline` options (lines 119-124). Replace with just `funnel?.setPhoneStatus("verified")`.

b) In `handleOtpSubmit` (line 169), after `funnel.setPhone(result.e164, "verified")`, add `fetchFull(result.e164)` — using the server-canonical phone directly.

c) Guard the `useEffect` at line 127-131 with `!isLoading` and add a ref to prevent it from firing after `handleOtpSubmit` already triggered `fetchFull`:
```ts
const fullFetchTriggeredRef = useRef(false);
// In handleOtpSubmit: fullFetchTriggeredRef.current = true;
// In useEffect: if (fullFetchTriggeredRef.current) return;
```

---

## Step 6: Auto-send OTP when phone pre-filled

**File:** `src/components/post-scan/PostScanReportSwitcher.tsx`

Add a `useEffect` with a ref guard that auto-fires `handleSendCode()` when `gateMode === "send_code"` and the funnel has a phone. This handles the case where the user's phone was hydrated from the leads table on mount.

---

## Verification After Deploy

1. Upload a quote, complete scan, enter phone, receive OTP, enter code
2. Check Supabase Edge Function logs for `verify-otp` — no more `23514` constraint error
3. Confirm `lead_events` has a `crm_handoff_queued` row
4. Confirm `leads` table shows `phone_verified = true`
5. Confirm full report renders with flags populated
6. Test returning user resume (`?resume=1`) — full data should load without preview overwrite

