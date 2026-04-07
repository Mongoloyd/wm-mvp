

## Partial Reveal Failure — Current State Audit & Fix Plan

### What's Already Fixed (from previous implementation)

**Fix 1 (Bug 3) — DONE.** `PostScanReportSwitcher.handleOtpSubmit` now calls `props.onVerified(result.e164)` only after `submitOtp` returns. The `pipeline.onVerified` callback no longer triggers `fetchFull`. This is correct.

**Fix 3 (Preview Preservation) — PARTIALLY DONE.** `useAnalysisData` now has `fullFetchError` separate from `error`. `fetchFull` sets `fullFetchError` on auth/empty failures without overwriting preview data. Index.tsx condition at line 297 is `!analysisData` (not `analysisError || !analysisData`). This is correct.

**Fix 2 (Integrity Guard) — DONE.** `verify-otp` returns 500 if `resolvedLeadId` is null when `scan_session_id` is provided.

### What's Still Broken — Confirmed Bugs

**The PRIMARY blocker is the database constraint.** The edge function logs confirm that every `verify-otp` call fails at step 6 (leads update) because the `trg_fire_crm_handoff` trigger inserts `crm_handoff_queued` into `lead_events`, which violates `lead_events_event_name_check`. The entire transaction rolls back, leaving `phone_verified = false`, causing `get_analysis_full` to return `__UNAUTHORIZED__`.

Beyond that constraint fix, here are the remaining code-level bugs ordered by severity:

---

### BUG 1 — Race: tryResume vs doFetch (Index.tsx)

**Status: UNFIXED.**

When a returning user loads with `?resume=1`, both the preview fetch (`doFetch`) and `tryResume` run concurrently. If `tryResume` completes first (setting full data + `isFullLoaded = true`), then `doFetch` completes second and overwrites `data` with preview data (empty flags array). The report renders in "full" mode with zero findings.

**Index.tsx line 89** is missing `analysisLoading` guard:
```
if (!scanSessionId || isFullLoaded || isResuming) return;  // missing: || analysisLoading
```

**useAnalysisData `doFetch`** has no guard against overwriting full data:
```
// doFetch can overwrite setData after tryResume already set full data
// because isFullLoaded is not checked inside doFetch
```

**Fix:** Two changes:
1. Index.tsx resume effect: add `analysisLoading` to the guard
2. useAnalysisData `doFetch`: add an `isFullLoadedRef` check before `setData` to prevent stale preview from overwriting full data

---

### BUG 2 — No Auto-Submit on 6th Digit (LockedOverlay.tsx)

**Status: UNFIXED.**

`LockedOverlay` has no `useEffect` that triggers `onOtpSubmit` when the 6th digit is entered. The user must manually find and click "Verify →". On mobile, this is a significant friction point causing abandonment.

**Fix:** Add a `useEffect` that calls `onOtpSubmit()` when `otpValue.length === 6` and `gateMode === "enter_code"` and `!isLoading`, with a ref guard to prevent re-firing.

---

### BUG 3 — ReportClassic: Double fetchFull on OTP Verify

**Status: UNFIXED.**

`ReportClassic.tsx` still has TWO paths that call `fetchFull` after OTP success:
- Line 122: `pipeline.onVerified` callback calls `fetchFull(phone)` directly
- Line 128-131: `useEffect` watching `funnel?.phoneStatus === "verified"` also calls `fetchFull`

Unlike `PostScanReportSwitcher` (which was fixed), `ReportClassic` was NOT updated. The `onVerified` callback still uses `funnel?.phoneE164 || pipeline.e164` (stale local state, not server-canonical).

**Fix:** Apply the same pattern as PostScanReportSwitcher:
1. Remove `fetchFull` from `pipeline.onVerified` callback
2. Move canonical handoff to `handleOtpSubmit` using `result.e164`
3. Remove or guard the duplicate `useEffect`

---

### BUG 4 — OTP Never Auto-Sends When Phone Pre-Filled

**Status: UNFIXED.**

When a user provides their phone in TruthGateFlow, `deriveGateMode` correctly returns `"send_code"`. But nothing auto-triggers the OTP send. The user must click "Get Your Code →" manually — unnecessary friction since the phone is already validated.

**Fix:** Add a `useEffect` in `PostScanReportSwitcher` that auto-fires `handleSendCode()` when `gateMode === "send_code"` and the phone is available, with a ref guard to prevent re-firing.

---

### BUG 5 — mapSeverity("pass") Returns "amber" (useAnalysisData.ts)

**Status: UNFIXED.**

Line 82: `"pass"` and `"confirmed"` are mapped to `"amber"` instead of `"green"`. This inflates the issue count and shows confirmed-good items as warnings.

**Fix:** Move `"pass"` and `"confirmed"` to the green branch.

---

### BUG 6 — Database Constraint (lead_events_event_name_check)

**Status: UNFIXED — This is the primary blocker.**

The `lead_events` CHECK constraint does not include `crm_handoff_queued` or `db_trigger` as allowed values. Every OTP verification that succeeds at the Twilio level fails at the database level, rolling back `phone_verified = true`.

**Fix:** Migration to ALTER the constraint, adding:
- `'crm_handoff_queued'` to `lead_events_event_name_check`
- `'db_trigger'` to `lead_events_event_source_check`

---

## Recommended Implementation Order

1. **Database constraint fix** (Bug 6) — unblocks everything
2. **LockedOverlay auto-submit** (Bug 2) — highest UX impact
3. **ReportClassic double-fetch fix** (Bug 3) — prevents data corruption
4. **Index.tsx race condition** (Bug 1) — prevents returning-user regression
5. **Auto-send OTP** (Bug 4) — reduces friction
6. **mapSeverity fix** (Bug 5) — cosmetic but affects trust

## Files to Change

| File | Bug(s) |
|------|--------|
| Migration (new) | 6 |
| `src/components/LockedOverlay.tsx` | 2 |
| `src/pages/ReportClassic.tsx` | 3 |
| `src/pages/Index.tsx` | 1 |
| `src/hooks/useAnalysisData.ts` | 1, 5 |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | 4 |

## What This Does NOT Change

- `verify-otp/index.ts` — integrity guard already deployed, no further changes
- `send-otp/index.ts` — working correctly
- `get_analysis_full` RPC — no changes
- Trigger functions — no changes
- RLS policies — no changes
- Front-gate flow — no changes

