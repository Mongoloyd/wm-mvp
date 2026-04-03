

# Mock OTP Scratchpad Plan

## What This Is
A standalone scratchpad file (`src/dev/mockOtpGate.tsx`) containing a self-contained mock version of the Truth Gate OTP flow for local testing. It does **not** touch `TruthGateFlow.tsx`, `VerifyGate.tsx`, or any edge functions.

## File: `src/dev/mockOtpGate.tsx`

A single React component (`MockTruthGateTest`) that:

1. **Renders a mini form** with Name, Email, Phone (optional) fields
2. **Hardcodes OTP to `1234`** — no Supabase calls, no Twilio
3. **Console logs** `[TEST MODE] OTP Sent: 1234` on submit
4. **Two-tier reveal logic**:
   - **Tier 1 (Partial)**: Name + Email only → verifying `1234` shows a mock "30% teaser" card (grade letter + issue count, everything else blurred/locked)
   - **Tier 2 (Full)**: Name + Email + Phone → verifying `1234` shows a mock "100% reveal" card (all pillars, red flags, negotiation script placeholder)
5. **0.8s "Analyzing..." loading state** between OTP entry and reveal for premium feel
6. **State machine**: `idle → collecting → otp_challenge → analyzing → partial_reveal | full_reveal`

## File: `src/dev/mockOtpFixtures.ts`

Static mock data used by the test component:
- `mockPartialPayload`: grade letter, issue count, 2-3 teaser fields
- `mockFullPayload`: all 5 pillar scores, red flags array, negotiation script stub

## How to Access

Add a route in `App.tsx` only in dev: `/dev/otp-test` pointing to `MockTruthGateTest`. Or simply import it in the existing `DevPreviewPanel.tsx`.

## What It Does NOT Touch
- `TruthGateFlow.tsx` — unchanged
- `VerifyGate.tsx` — unchanged
- `send-otp` / `verify-otp` edge functions — unchanged
- No Supabase calls, no Twilio calls, no real API hits

## Technical Details

**State flow in mockOtpGate.tsx:**
```text
idle → [submit name/email/phone?] → otp_challenge
  → [enter "1234"] → analyzing (0.8s timer)
    → hasPhone? full_reveal : partial_reveal
```

**Tier detection:** `const tier = phone.trim() ? "full" : "partial"`

**OTP check:** `if (otpInput === "1234") { advance() } else { setError("Wrong code") }`

