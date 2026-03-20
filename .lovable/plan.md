
Goal: fix the bridge between `ScanFunnelContext` and `usePhonePipeline` before any more gate work, without changing the Classic overlay visually.

What I verified
- Your diagnosis is correct.
- `PostScanReportSwitcher` derives the right gate mode from funnel state, but it does not pass the known funnel phone into `usePhonePipeline`.
- `usePhonePipeline` currently drives `submitPhone()`, `submitOtp()`, and `resend()` from its own internal `usePhoneInput()` state.
- That means:
  1. `enter_code` can render while `submitOtp()` still has no active phone
  2. `send_code` can render while `submitPhone()` still screens an empty local input
  3. `resend()` has the same disconnect
- `TruthReportClassic` is already visually decoupled enough for this step; the blocker is the pipeline bridge.

Chosen approach
- Use Option A: make `usePhonePipeline` support an external active phone from funnel state.
- Reason: this is the cleanest architecture, keeps the overlay presentation-only, and avoids seeding local input state just to make OTP actions work.

Implementation plan
1. Update `usePhonePipeline` to accept an external phone option
- Add something like `externalPhoneE164?: string | null`
- Internally derive one active phone source:
  - external funnel phone when present
  - otherwise local phone input state
- Keep local input behavior only for the rare `enter_phone` path

2. Make pipeline actions use the active phone source
- `submitOtp(code)` should verify against the active phone, not only the local `e164`
- `resend()` should resend to the active phone
- `submitPhone()` should behave in two ways:
  - if external phone exists: skip local screening and send OTP to that known phone
  - if no external phone exists: use the current local input screening flow

3. Wire `PostScanReportSwitcher` to the shared phone source
- Pass `funnel?.phoneE164` into `usePhonePipeline`
- Keep `gateMode` derivation as-is
- Keep `TruthReportClassic` visually unchanged
- Keep overlay props presentation-only

4. Preserve the current CRO hierarchy
- Best path: known phone + OTP already sent upstream -> `enter_code`
- Fallback: known phone but OTP not sent -> `send_code`
- Rare: no phone -> `enter_phone`
- Do not add report-load auto-send in this step

5. Focused verification after the bridge fix
- `enter_code`: verify succeeds using upstream `funnel.phoneE164`
- `send_code`: “Get Your Code” sends to upstream `funnel.phoneE164`
- `enter_phone`: local entry still screens, normalizes, sends, then writes back to funnel
- `resend`: uses the same correct phone source in both known-phone and local-phone paths

Files I expect to change
- `src/hooks/usePhonePipeline.ts`
- `src/components/post-scan/PostScanReportSwitcher.tsx`
- Possibly no visual changes needed in:
  - `src/components/TruthReportClassic.tsx`
  - `src/components/LockedOverlay.tsx`

Why I’m choosing this
- It fixes the real bug at the source instead of patching individual handlers
- It preserves the strongest CRO asset you already have: the centered Classic lock overlay
- It keeps business logic shared and gate presentation per-report
- It sets up the right future funnel behavior: users who already gave a phone should land directly in code-entry mode, not phone-entry mode

What this means for CRO
- Right now the most important thing is trust + immediacy:
  - they arrive
  - they already see the grade/flags
  - the code field is ready
  - verification works on the first try against the correct number
- If the known-phone bridge is wrong, the page can look persuasive while failing at the exact conversion moment
- Fixing this first protects conversion before you invest in upstream send timing or a stronger Findings gate

What remains after this step
1. Verify all 3 gate modes visually and functionally
2. Wire upstream OTP send so most users naturally land in `enter_code`
3. Build the stronger Findings-specific lock treatment on top of the same shared mechanics

Decision point for you
- I recommend proceeding exactly with the external-phone pipeline approach above, keeping Classic visually untouched and fixing the bridge first.