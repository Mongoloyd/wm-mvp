

# Distinct Error Icons and Styling for OTP Gate

## Problem
The backend now returns specific Twilio error messages and a `twilio_code` field, but the client-side treats blocked-prefix errors (60410) as "generic" — same icon, same color as any other failure. The `VerifyGate` component has no icon/styling differentiation at all.

## Changes

### 1. Add `blocked_prefix` to ErrorType (usePhonePipeline.ts)

- Extend the `ErrorType` union to include `"blocked_prefix"`.
- In the `startPipeline` error handler (~line 188-208), after parsing the response body, detect the blocked-prefix error by checking if `body?.twilio_code === 60410` or if `parsedMsg` includes "blocked by our carrier". Classify as `"blocked_prefix"`.
- The existing "too many" detection already maps to `"rate_limit"`, which covers 60203.

### 2. Update LockedOverlay error display (~line 302-390)

Add a third icon/color branch for `blocked_prefix`:
- Icon: `ShieldOff` (from lucide-react) — communicates a carrier/security block.
- Color: `hsl(var(--color-caution))` (amber/warning tone, not red — it's recoverable by using a different number).
- Add a recovery hint below: "Try a different phone number to continue."

### 3. Update VerifyGate error display (~line 210-218)

Replace the plain `<motion.p>` error with icon-differentiated rendering matching the same pattern:
- `blocked_prefix` → `ShieldOff` icon, amber styling
- `rate_limit` → `Clock` icon, amber styling
- `network` → `WifiOff` icon, muted styling
- default → `AlertCircle` icon, red styling

Add an `errorType` state variable to VerifyGate (derived from the error message content since VerifyGate calls supabase directly rather than using the pipeline).

### Files Modified
- `src/hooks/usePhonePipeline.ts` — add `blocked_prefix` to ErrorType, classify in error handler
- `src/components/LockedOverlay.tsx` — add ShieldOff icon branch + recovery hint for `blocked_prefix`
- `src/components/TruthReportFindings/VerifyGate.tsx` — add errorType state, icon-differentiated error rendering

