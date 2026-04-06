

# OTP Double-Fire Race Condition — Audit & Fix Plan

## Phase 1: Root Cause Analysis

### The Pattern
Both OTP submission paths use the same anti-pattern: a `useEffect` that auto-submits when the 6th digit is entered, where the "am I already submitting?" guard relies on **React state** (`setState`) rather than a **synchronous ref**.

### Path A: LockedOverlay (Main Scan Flow)

**LockedOverlay.tsx, lines 111-116:**
```ts
useEffect(() => {
  if (otpValue.length === 6 && gateMode === "enter_code" && !isLoading) {
    onOtpSubmit();
  }
}, [otpValue, gateMode, isLoading, onOtpSubmit]);
```

**PostScanReportSwitcher.tsx, lines 205-216:**
```ts
const handleOtpSubmit = useCallback(async () => {
  if (otpValue.length < 6) return;
  setIsVerifyingOtp(true);  // ← async state update, NOT synchronous
  ...
}, [otpValue, pipeline]);
```

**The bug:** When the user types the 6th digit, React re-renders. `handleOtpSubmit` is recreated (because `otpValue` is in its dependency array), which causes the `useEffect` in LockedOverlay to re-fire. At this point, `isVerifyingOtp` is still `false` because `setIsVerifyingOtp(true)` hasn't propagated yet. Result: **two calls to `pipeline.submitOtp()`**.

### Path B: VerifyGate (Legacy Flow)

**VerifyGate.tsx, lines 157-162:**
```ts
useEffect(() => {
  if (otpValue.length === 6 && step === "otp") {
    handleVerify();
  }
}, [otpValue, step, handleVerify]);
```

**VerifyGate.tsx, line 122:**
```ts
const handleVerify = useCallback(async () => {
  if (otpValue.length < 6 || !e164 || step === "verifying") return;
  setStep("verifying");  // ← async state, same problem
  ...
}, [otpValue, e164, step, scanSessionId, onVerified]);
```

Same issue: `handleVerify` is recreated when `otpValue` changes, the effect re-runs, and `step` is still `"otp"` because `setStep("verifying")` hasn't rendered yet. Two calls to `verify-otp`.

### Path C: usePhonePipeline.submitOtp

**usePhonePipeline.ts, lines 239-311:**
`submitOtp` uses `setPhoneStatus("verifying")` as its guard — again, async state. No ref-based lock exists here (unlike `submitPhone` which has `isSendingRef`).

### Summary
Three layers, zero synchronous guards on the verify path. The `submitPhone` path correctly uses `isSendingRef`, but `submitOtp` was missed.

---

## Phase 2: Fix Plan

The cleanest fix is a **defense-in-depth** approach: add a ref lock at the shared pipeline level AND at each consumer level.

### File 1: `src/hooks/usePhonePipeline.ts`
Add `isVerifyingRef = useRef(false)` (mirrors the existing `isSendingRef` pattern for `submitPhone`).

**In `submitOtp` (~line 240):**
- Add guard: `if (isVerifyingRef.current) return { status: "error", error: "Already verifying." };`
- Set `isVerifyingRef.current = true` before the async call
- Reset in `finally` block: `isVerifyingRef.current = false`

This is ~5 lines added. Protects both consumers (LockedOverlay and VerifyGate paths).

### File 2: `src/components/post-scan/PostScanReportSwitcher.tsx`
Add a local `verifyLockRef = useRef(false)` in `handleOtpSubmit` as a belt-and-suspenders guard.

**In `handleOtpSubmit` (~line 205):**
- Add guard: `if (verifyLockRef.current) return;`
- Set `verifyLockRef.current = true` before calling `pipeline.submitOtp`
- Reset in `finally` block

This is ~4 lines added.

### File 3: `src/components/TruthReportFindings/VerifyGate.tsx`
Add a local `verifyLockRef = useRef(false)` in `handleVerify`.

**In `handleVerify` (~line 121):**
- Add guard: `if (verifyLockRef.current) return;`
- Set `verifyLockRef.current = true` before the Supabase call
- Reset in `finally` block (both success and error paths)

This is ~4 lines added.

### What This Does NOT Change
- No UI changes
- No edge function changes
- No database changes
- OTP auto-submit behavior is preserved (still fires on 6th digit)
- Shake animation, auto-clear, cooldown, resend — all untouched

### Total Impact
~15 lines added across 3 files. Zero risk to existing functionality. The second call is suppressed synchronously before it ever reaches Twilio.

