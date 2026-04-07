

# Safety Rollback: Restore Manual OTP Submit

## Problem
The auto-submit effect (fires `onOtpSubmit` when 6th digit is entered) combined with the one-shot guard (`lastAutoSubmittedOtpRef`) has created a deadlock: if `onOtpSubmit` fails silently, the guard blocks all future attempts. The user is stuck with 6 digits entered, no spinner, no error, no network request.

## What The Previous Patch Introduced (to be removed)
All in `src/components/LockedOverlay.tsx`, lines 99-131:
1. `lastAutoSubmittedOtpRef` ref (line 100)
2. Auto-submit `useEffect` that calls `onOtpSubmit()` when `otpValue.length === 6` (lines 113-124)
3. Reset `useEffect` that clears the ref (lines 126-131)

## Files to Revert

**`src/components/LockedOverlay.tsx`** — sole file.

### Changes to Remove
- Delete `lastAutoSubmittedOtpRef` declaration (line 99-100)
- Delete auto-submit `useEffect` (lines 113-124)
- Delete reset `useEffect` (lines 126-131)

### Change to Add
- Restore a manual "Verify" button in the `enter_code` section (after the OTP input, around line 487), enabled when `otpValue.length === 6 && !isLoading`
- Remove the comment on line 489 that says "auto-submit removes the button"

## Restored Behavior
- User types 6 digits → nothing fires automatically
- User taps "Verify →" button → calls `onOtpSubmit()`
- Button shows spinner + "Verifying..." when `isLoading` is true
- Button disabled when code is incomplete or loading
- Shake animation on invalid code still works (the existing `useEffect` on `errorType` is untouched)
- Auto-clear on error still works (same effect, untouched)

## What Is NOT Touched
- `PostScanReportSwitcher.tsx` — no changes
- `usePhonePipeline.ts` — no changes
- `VerifyGate.tsx` — not in the active path, no changes
- Edge Functions — no changes
- Shake/auto-clear effect — preserved (lines 102-111)

## Manual Validation Plan
1. Upload a quote, enter phone, receive SMS
2. Type 6 digits — confirm NO network request fires automatically
3. Tap "Verify →" — confirm exactly ONE `verify-otp` request in Network tab
4. Wrong code: confirm shake, auto-clear, re-enter new code, tap Verify again — works
5. Resend: tap resend, enter new code, tap Verify — works
6. Confirm the button is disabled during loading

