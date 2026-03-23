# Double OTP Bug — Diagnostic Report

**Author:** Manus AI
**Date:** March 22, 2026
**Status:** Investigation complete — no code changes applied

---

## Executive Summary

The "double OTP" bug is **not a race condition**. It is a **disconnected verification pipeline**. The OTP entry inside `ScanTheatrics` is purely theatrical — it accepts any 6 digits, plays an animation, and advances the local state machine without ever calling the Twilio `verify-otp` endpoint or updating the global `ScanFunnelContext`. When the report renders downstream via `PostScanReportSwitcher`, it reads `funnel.phoneStatus` (which is still `"otp_sent"`, never `"verified"`) and correctly shows the `LockedOverlay` gate. The user must enter the OTP a second time — this time through the real pipeline — to unlock the report.

---

## Step 1: The Exact Bug Flow (File-by-File Trace)

### The Chain of Events

The bug occurs exclusively in the **in-page scan flow** (Index.tsx → ScanTheatrics → PostScanReportSwitcher). The standalone `/report/:sessionId` routes are not affected because they use `FindingsPageShell`, which has its own self-contained gate state machine.

| Step | File | Line(s) | What Happens |
|------|------|---------|--------------|
| 1 | `TruthGateFlow.tsx` | `handleSubmit()` | User submits name/email/phone. Calls `phonePipeline.submitPhone()` → Twilio sends OTP. Sets `funnel.phoneStatus = "otp_sent"`. Lead inserted into Supabase. |
| 2 | `UploadZone.tsx` | — | User uploads quote PDF. `scanSessionId` created. |
| 3 | `ScanTheatrics.tsx` | Phase: `otp` | OTP input appears. User enters 6 digits. |
| 4 | `ScanTheatrics.tsx` | `handleOtpSubmit()` | **THE BUG:** Handler does `console.log({ event: "wm_phone_verified" })` and calls `startPillars(false)`. It does **not** call `usePhonePipeline.submitOtp(code)`. It does **not** call `funnel.setPhoneStatus("verified")`. It accepts any 6 digits. |
| 5 | `ScanTheatrics.tsx` | Phase: `pillars` → `reveal` | Pillar animations play for ~7 seconds. Then `onRevealComplete()` fires. |
| 6 | `Index.tsx` | `onRevealComplete` callback | Sets `gradeRevealed = true` → `shouldShowReport` becomes `true` → `PostScanReportSwitcher` mounts. |
| 7 | `PostScanReportSwitcher.tsx` | Mount | Calls `useReportAccess()`. |
| 8 | `useReportAccess.ts` | Line 40-41 | Reads `funnel.phoneStatus`. It is still `"otp_sent"` (never updated to `"verified"`). Returns `"preview"`. |
| 9 | `TruthReportClassic.tsx` | Render | `accessLevel === "preview"` → renders `<LockedOverlay>` with OTP gate. |
| 10 | User | — | Enters OTP **a second time**. |
| 11 | `PostScanReportSwitcher.tsx` | `handleOtpSubmit()` | This time, calls `pipeline.submitOtp(otpValue)` → real Twilio verification → `onVerified` callback fires → `funnel.setPhoneStatus("verified")`. |
| 12 | `useReportAccess.ts` | Line 41 | Now reads `"verified"` → returns `"full"`. Report unlocks. |

### Why It Is NOT a Hydration Race

The initial hypothesis was that the router fires before the state hydrates. This is incorrect. `ScanFunnelProvider` initializes state **synchronously** from localStorage:

```tsx
// scanFunnel.tsx, line 118-121
const [state, setState] = useState<ScanFunnelState>(() => {
  const persisted = readPersistedState();
  return { ...DEFAULT_STATE, ...persisted };
});
```

There is no `useEffect`, no async fetch, no loading phase. The state is immediately available on the first render. The problem is not timing — the problem is that **the value was never written**.

### The Three Actors and Their Disconnection

| Actor | Owns OTP UI? | Calls Twilio verify-otp? | Updates funnel.phoneStatus? |
|-------|-------------|--------------------------|----------------------------|
| `ScanTheatrics` (Step 4) | Yes — local `InputOTP` | **No** — `handleOtpSubmit` is fire-and-forget | **No** — only logs to console |
| `PostScanReportSwitcher` (Step 11) | Yes — via `LockedOverlay` | **Yes** — `pipeline.submitOtp()` | **Yes** — via `onVerified` callback |
| `FindingsPageShell` (standalone routes) | Yes — via `OtpUnlockModal` | **Yes** — via page-layer callback | **Yes** — via page-layer callback |

The root cause is that `ScanTheatrics` was built as a theatrical experience layer and was never wired to the real Twilio pipeline. It has its own local phase state machine (`upload → pillars → cliffhanger → otp → reveal`) that is completely independent of the global `ScanFunnelContext`.

---

## Step 2: Critique of Plan A

> **Plan A:** (1) Update the OTP submit handler to fully await the global state updating to `"verified"` before firing the navigation. (2) Add an `isLoading`/`isHydrating` guard to the Report route so it shows a skeleton instead of the VerifyGate if the session status is currently fetching.

### Verdict: Plan A Addresses the Wrong Problem

Plan A assumes the bug is a **timing/race condition** — that the state update and the navigation are both happening, just in the wrong order. The investigation reveals the state update **never happens at all**. There is nothing to "await" because `ScanTheatrics.handleOtpSubmit()` never calls the verification endpoint.

### Pros of Plan A (if adapted)

If we interpret Plan A generously as "wire the real Twilio call into ScanTheatrics and await it before advancing," then:

- **Pro:** It would fix the immediate symptom. The OTP entered in ScanTheatrics would actually verify against Twilio, and `funnel.phoneStatus` would be `"verified"` before `PostScanReportSwitcher` mounts.
- **Pro:** The `isHydrating` guard on the report route is a good defensive measure regardless, even though hydration is synchronous today. If we ever move to async state (e.g., server-side session lookup), it would prevent a flash of the locked state.

### Cons of Plan A

| Issue | Severity | Explanation |
|-------|----------|-------------|
| Misdiagnosis | High | Plan A treats this as a race condition. It is a missing integration. The fix needs to be "connect the wire," not "change the timing." |
| Breaks the theatrical UX | Medium | ScanTheatrics is intentionally designed as a suspense experience. Inserting a real async Twilio call (which takes 1-3 seconds) into the middle of the pillar animation would create an awkward pause or require restructuring the animation timeline. |
| Hydration guard is unnecessary | Low | `ScanFunnelProvider` hydrates synchronously. Adding an `isHydrating` guard adds complexity for a problem that does not exist today. However, it is low-risk and could be kept as a defensive measure. |
| Does not fix the standalone routes | Medium | Plan A focuses on the in-page flow. The standalone `/report/:sessionId` and `/report/classic/:sessionId` routes are not wrapped in `ScanFunnelProvider` (App.tsx has no provider wrapper around those routes), so `useScanFunnelSafe()` returns `null`. Plan A would not address this. |

---

## Step 3: Plan B — The "Single Verification, Single Gate" Architecture

### Philosophy

Instead of making ScanTheatrics perform real verification (which fights its theatrical purpose), **remove the OTP step from ScanTheatrics entirely** and let the report's own gate be the single, authoritative verification point.

### The Design

**ScanTheatrics becomes purely theatrical.** It keeps its dramatic phases (upload validation → pillar analysis → cliffhanger → grade reveal) but **skips the OTP phase entirely**. The user sees the suspense, sees the grade teased, and then lands on the report in `"preview"` mode with the `LockedOverlay` as the single, real OTP gate.

### The Changes (Conceptual — No Code Written)

| File | Change | Rationale |
|------|--------|-----------|
| `ScanTheatrics.tsx` | Remove the `otp` phase from the state machine. After `cliffhanger`, go directly to `reveal`. Remove `handleOtpSubmit`, the `InputOTP` UI, and the `skippedOtp` state. | ScanTheatrics should not own verification. Its job is suspense, not security. |
| `PostScanReportSwitcher.tsx` | No changes needed. It already has the real pipeline wired via `usePhonePipeline` and `LockedOverlay`. | This is already the correct single gate. |
| `Index.tsx` | No changes needed. The `onRevealComplete` callback already sets `gradeRevealed = true` and renders `PostScanReportSwitcher`. | The flow already works — we just need to stop showing a fake OTP before it. |
| `useReportAccess.ts` | No changes needed. It correctly reads `funnel.phoneStatus` and returns `"preview"` when unverified. | The gate logic is already correct. |

### Why Plan B Is Better

| Dimension | Plan A (Wire Twilio into ScanTheatrics) | Plan B (Remove OTP from ScanTheatrics) |
|-----------|----------------------------------------|----------------------------------------|
| **Lines of code** | ~30-50 added (async handler, error states, loading UI) | ~40-60 removed (OTP phase, handler, UI) |
| **Single source of truth** | Two OTP gates exist (ScanTheatrics + LockedOverlay) | One OTP gate exists (LockedOverlay only) |
| **Theatrical UX** | Compromised — real async call disrupts animation flow | Preserved — ScanTheatrics stays pure suspense |
| **Error handling** | Must handle Twilio errors in ScanTheatrics (new failure mode) | No new failure modes — LockedOverlay already handles all error states |
| **Future maintenance** | Two verification paths to keep in sync | One verification path |
| **User psychology** | User enters OTP during the "excitement" phase (may feel like friction) | User enters OTP when they can see the blurred report (maximum motivation — Zeigarnik Effect) |
| **Conversion impact** | Neutral — same number of steps | Potentially positive — OTP is now framed as "unlock your results" rather than "prove your identity" |

### The UX Flow Under Plan B

1. User submits lead info → OTP sent via Twilio → `funnel.phoneStatus = "otp_sent"`
2. User uploads quote → ScanTheatrics plays (upload → pillars → cliffhanger → **reveal**)
3. Report renders in `"preview"` mode → user sees grade, blurred findings, and `LockedOverlay`
4. User enters OTP in `LockedOverlay` → real Twilio verification → `funnel.phoneStatus = "verified"` → report unlocks
5. **Zero double-OTP. Zero race conditions. One gate.**

### Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Users confused by missing OTP in ScanTheatrics | Low | The OTP was never explained in ScanTheatrics — it just appeared. Removing it makes the flow shorter and smoother. |
| Users abandon before reaching LockedOverlay | Low | The grade reveal (visible in preview mode) is the strongest hook. Users who see their grade will want the details. |
| Regression in standalone routes | None | Standalone routes (`Report.tsx`, `ReportClassic.tsx`) already use `FindingsPageShell` with its own gate. They are unaffected. |

---

## Appendix: The Standalone Route Provider Gap

During investigation, a secondary issue was identified. The standalone report routes in `App.tsx` are **not wrapped in `ScanFunnelProvider`**:

```tsx
// App.tsx, lines 24-25
<Route path="/report/:sessionId" element={<Report />} />
<Route path="/report/classic/:sessionId" element={<ReportClassic />} />
```

This means `useScanFunnelSafe()` returns `null` on these routes, and `useReportAccess` falls through to the `isPhoneVerified` option (which defaults to `false`). This is currently not a bug because:

- `Report.tsx` uses `FindingsPageShell`, which has its own `gateState` and does not depend on `ScanFunnelContext`.
- `ReportClassic.tsx` uses `useReportAccess` but also builds its own `gateProps` from `usePhonePipeline`.

However, if we ever want the standalone routes to recognize a user who already verified in the in-page flow (e.g., they refresh the page), we would need to either:
1. Wrap the routes in `ScanFunnelProvider` in `App.tsx`, or
2. Have the standalone routes read `phoneStatus` directly from localStorage (bypassing the context).

This is a separate concern from the double-OTP bug and can be addressed independently.

---

## Recommendation

**Implement Plan B.** Remove the theatrical OTP phase from `ScanTheatrics` and let `LockedOverlay` (via `PostScanReportSwitcher`) be the single, authoritative verification gate. This eliminates the bug by removing the duplicate gate rather than trying to synchronize two independent verification paths.

The fix is a net deletion of code, preserves the theatrical UX, and aligns with the "single source of truth" principle that already governs the rest of the architecture.
