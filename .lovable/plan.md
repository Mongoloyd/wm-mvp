

# Frictionless OTP Component — Conversion-Optimized Verification

## What We're Changing

Two components render OTP inputs: **VerifyGate** (inline gate) and **LockedOverlay** (modal overlay). Both need the same friction-elimination upgrades. The cleanest approach is to upgrade the shared `InputOTP` wrapper and the two consumer components.

## Changes

### 1. `src/components/ui/input-otp.tsx` — Add `autoComplete="one-time-code"`
- Pass `autoComplete="one-time-code"` and `inputMode="numeric"` through to the underlying `OTPInput` component
- This enables iOS/Android SMS autofill suggestions directly above the keyboard — critical for Facebook ad traffic on mobile

### 2. `src/components/TruthReportFindings/VerifyGate.tsx` — Auto-submit + error shake + CRO copy
- **Auto-submit on 6th digit**: Add a `useEffect` watching `otpValue` — when `otpValue.length === 6` and step is `"otp"`, call `handleVerify()` automatically. Remove the manual "Verify & Unlock" button entirely.
- **Error shake + auto-clear**: On verification failure, add a CSS shake animation to the OTP container, clear the input after 600ms, and auto-focus the first slot. Use a `shakeKey` state counter to re-trigger the animation.
- **CRO micro-copy**: Replace generic "Enter the 6-digit code sent to your phone" with value-reinforcing copy: "Your impact window grade is ready. Enter the code we just texted you to unlock your counter-offer."
- **Phone input**: Add `autoComplete="tel-national"` (already present) — no change needed.

### 3. `src/components/LockedOverlay.tsx` — Auto-submit + error shake + CRO copy
- **Auto-submit on 6th digit**: The parent (`PostScanReportSwitcher`) passes `onOtpSubmit`. Add a `useEffect` inside `LockedOverlay` that calls `onOtpSubmit()` when `otpValue.length === 6` and `!isLoading`. Remove the manual "Unlock Full Report" button.
- **Error shake + auto-clear**: Same shake pattern as VerifyGate. When `errorType === "invalid_code"`, shake the OTP group, clear after 600ms, refocus.
- **CRO micro-copy**: Replace subtext for `enter_code` mode from generic instructions to: "Your impact window grade is ready. Enter the code we just texted you." Keep the masked phone visible.
- **Visual continuity**: The blurred redacted findings behind the overlay already serve as the "dimmed preview" — no change needed here.

### 4. `src/index.css` — Add shake keyframe
- Add a `@keyframes otp-shake` animation (horizontal shake, 5 frames, 400ms) and a `.otp-shake` utility class. This avoids adding Tailwind plugin complexity.

## What This Achieves
- **Auto-complete**: iOS/Android suggest the OTP code from SMS with one tap
- **Paste support**: Already handled by the `input-otp` library — it intercepts paste events and distributes digits automatically
- **Auto-submit**: Zero-click verification after entering the 6th digit
- **Error recovery**: Wrong code triggers a visual shake, auto-clears, and refocuses — user retries instantly without clicking anything
- **"Change number" hatch**: Already present in both components — no change needed
- **Resend cooldown**: Already implemented at 30 seconds — no change needed
- **Value-reinforcing copy**: Keeps the "Truth Engine" narrative alive at the friction point

## Files Modified
| File | Change |
|------|--------|
| `src/components/ui/input-otp.tsx` | Add `autoComplete="one-time-code"` + `inputMode="numeric"` |
| `src/components/TruthReportFindings/VerifyGate.tsx` | Auto-submit, error shake, CRO copy |
| `src/components/LockedOverlay.tsx` | Auto-submit, error shake, CRO copy |
| `src/index.css` | Add `otp-shake` keyframe animation |

