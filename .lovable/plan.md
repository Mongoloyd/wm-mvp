# Apply Exact OTP Shake Animation & CRO Copy Updates

Two small precision updates to match your exact specs.

## Changes

### 1. `src/index.css` — Fix shake keyframes and easing

Current implementation uses a decaying amplitude (`-8, 6, -4, 2`) with `ease-out`. Your spec uses a consistent amplitude (`-8, 8, -8, 8`) with `cubic-bezier(0.36, 0.07, 0.19, 0.97)` and the `both` fill mode. This produces a more punchy, uniform shake that feels more responsive.

**Replace lines 488-509** with your exact keyframes and class.

### 2. `src/components/TruthReportFindings/VerifyGate.tsx` — "audit" copy

Line 273: Change `"Your impact window grade is ready"` to `"Your Impact Window Audit is Ready"`.

### 3. `src/components/LockedOverlay.tsx` — "audit" copy

Lines 128-129: Change both instances of `"Your Impact Window grade is ready"` to `"Your Impact Window Audit is Ready"`.

## No other changes needed

The `shakeKey` state, auto-submit `useEffect`, auto-clear timeout, and wiring are already implemented correctly in both components from the previous round.