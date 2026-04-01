# PRE-TEST TRUST AUDIT
**Branch:** `audit/reveal-otp-file-map`
**Date:** 2026-04-01
**Author:** Copilot — Read-Only Architectural Audit
**Status:** Complete — no production code modified

---

## 1. Executive Summary

- **Primary bug confirmed:** During the `ScanTheatrics` cliffhanger phase, the UI renders a hardcoded "Multi-page document analyzed" label from `ScanTheatrics.tsx` line ~357 regardless of `pageCount` value. Separately, a hardcoded three-item OCR validation checklist (`Document structure detected`, `Text readability confirmed`, `Quote layout identified`) is always shown — these items are static copy, not driven by real analysis state, giving the false impression that multiple structural checks have individually passed on multiple parts of the document.
- **Trust-damage class:** UI copy that overstates processed scope. Not a duplicate-event or duplicate-document-count bug at the data layer; rather, it is static theatrics copy that implies plural document structure even when only one file was uploaded.
- **Secondary contributor:** The "Multi-page document analyzed" chip in `ScanTheatrics.tsx` line 357 renders whenever `analysisData.pageCount != null` — even when `pageCount === 1`. A single-page document will still display "Multi-page document analyzed."
- **OTP pipeline integrity:** The OTP boundary is sound. `useReportAccess` returns "full" only when `isFullLoaded === true`, which is only set after `get_analysis_full` RPC returns valid data. The previous "double OTP" bug (theatrical OTP in `ScanTheatrics` that did not call Twilio) has been removed. The current version auto-sends OTP via the real pipeline, gated by `autoSendGuardRef`.
- **Funnel persistence exists:** `src/state/scanFunnel.tsx` is the authoritative state owner. It persists `phoneE164`, `phoneStatus`, and `sessionId` to `localStorage` with a 24-hour TTL. The fix must build on this layer, not replace it.
- **Step 1 can remain frontend-only:** The root cause is incorrect UI copy inside `ScanTheatrics.tsx` (the cliffhanger phase). No backend, RLS, or edge function changes are required for the trust fix.
- **Certainty level:** High (90%). The copy defects are proven directly from source. The secondary count bug requires a 1-line conditional fix. No speculative causes apply.
- **React.StrictMode:** Confirmed present in `index.html`. The `autoSendGuardRef` Set-based guard in `ScanTheatrics` is correctly designed to survive StrictMode double-invocation — ruled out as a cause.
- **No duplicate-document data:** `useScanPolling` uses a single `scanSessionId` with a poll-count guard and `TERMINAL_STATUSES` stop set. No evidence of duplicate queue items or duplicate event emission from polling.

---

## 2. Current Reveal Flow Map

### 2.1 Complete Flow Chain

```
[User lands on /]
        │
        ▼
src/pages/Index.tsx
  └─ flowMode === 'A' branch
  └─ State owned: leadCaptured, sessionId, scanSessionId, fileUploaded,
                  gradeRevealed, selectedCounty, analysisData (from useAnalysisData)
        │
        ▼ TruthGateFlow (src/components/TruthGateFlow.tsx)
  └─ User completes 4-step form (window count → project type → county → quote range)
  └─ Calls usePhonePipeline.submitPhone() → send-otp edge function → Twilio
  └─ Calls funnel.setPhone(e164, "otp_sent") via ScanFunnelContext
  └─ onLeadCaptured(sessionId) → Index sets leadCaptured=true, sessionId=sid
        │
        ▼ UploadZone (src/components/UploadZone.tsx)
  └─ Visible when: isVisible={leadCaptured}
  └─ Props: sessionId, onScanStart
  └─ Uploads file to Supabase Storage (private quotes bucket)
  └─ Creates/looks up lead via get_lead_by_session RPC
  └─ Creates scan_session row in DB
  └─ Calls: onScanStart(fileName, scanSessionId)
  └─ Index receives: setScanSessionId(ssId), setFileUploaded(true)
        │
        ▼ ScanTheatrics (src/components/ScanTheatrics.tsx)
  └─ Visible when: fileUploaded && !gradeRevealed && !isDevPreview
  └─ Props: isActive=true, selectedCounty, scanSessionId, grade (from analysisData),
            analysisData, onRevealComplete, onInvalidDocument, onNeedsBetterUpload
  └─ Internally: useScanPolling({ scanSessionId }) → polls get_scan_status RPC
  └─ Internally: usePhonePipeline("validate_and_send_otp", ...) for OTP auto-send
  └─ Phase machine: "scanning" → "cliffhanger" → "pillars" → (fires onRevealComplete)
  └─ Auto-OTP send guard: fires submitPhone once per (scanSessionId|phoneE164) key
     when scanStatus===\"preview_ready\"||\"complete\" AND funnel.phoneStatus===\"screened_valid\"
  └─ onRevealComplete → Index sets gradeRevealed=true
        │
        ▼ Index.tsx — shouldShowReport = gradeRevealed || isDevPreview
        │
        ▼ PostScanReportSwitcher (src/components/post-scan/PostScanReportSwitcher.tsx)
  └─ Props: grade, flags, pillarScores, contractorName, county, confidenceScore,
            documentType, qualityBand, hasWarranty, hasPermits, pageCount,
            lineItemCount, flagCount, flagRedCount, flagAmberCount, scanSessionId,
            onVerified (fetchFull), isFullLoaded
  └─ useReportAccess({ isFullLoaded }) → "preview" | "full"
  └─ usePhonePipeline for real OTP submit/verify
  └─ deriveGateMode(funnel.phoneStatus, funnel.phoneE164, localGateOverride) → GateMode
  └─ Renders TruthReportClassic with accessLevel + gateProps
        │
        ▼ TruthReportClassic (src/components/TruthReportClassic.tsx)
  └─ accessLevel="preview": renders LockedOverlay gateProps → user sees OTP input
  └─ OTP submitted → pipeline.submitOtp() → verify-otp edge function → Twilio
  └─ onVerified(phoneE164) → Index calls fetchFull(phoneE164)
        │
        ▼ useAnalysisData.fetchFull()
  └─ Calls get_analysis_full RPC (SECURITY DEFINER, checks phone_verifications)
  └─ On success: setIsFullLoaded(true), setData(fullData), saveVerifiedAccess()
        │
        ▼ PostScanReportSwitcher receives isFullLoaded=true
  └─ useReportAccess → "full"
  └─ TruthReportClassic renders full report (no LockedOverlay gate)
```

### 2.2 File Responsibility Map

| File | Responsibility | Inbound | Outbound |
|------|---------------|---------|----------|
| `src/pages/Index.tsx` | Orchestration; owns top-level flow state | — | Props to all children |
| `src/state/scanFunnel.tsx` | Phone/session funnel state (persisted) | Context provider | `funnel.*` consumed by children |
| `src/components/TruthGateFlow.tsx` | Lead capture + initial OTP send | `onLeadCaptured`, `onStepChange` | `sessionId` up to Index |
| `src/components/UploadZone.tsx` | File upload + scan session creation | `isVisible`, `sessionId`, `onScanStart` | `scanSessionId` up to Index |
| `src/hooks/useScanPolling.ts` | Poll scan_sessions.status via RPC | `scanSessionId` | `{status, isPolling, error}` |
| `src/hooks/useAnalysisData.ts` | Two-phase data fetch (preview + full) | `scanSessionId`, `enabled` | `{data, fetchFull, isFullLoaded, tryResume}` |
| `src/hooks/useReportAccess.ts` | Access level derivation | `{isFullLoaded}` | "preview" \| "full" |
| `src/hooks/usePhonePipeline.ts` | OTP send/verify pipeline | `mode`, `scanSessionId`, `externalPhoneE164`, `onVerified` | `{submitPhone, submitOtp, resend, ...}` |
| `src/components/ScanTheatrics.tsx` | Theatrics phase machine + OTP auto-send | `isActive`, `scanSessionId`, `grade`, `analysisData` | `onRevealComplete` |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | Post-scan OTP gate + CTA orchestration | `grade`, `flags`, `pillarScores`, `isFullLoaded`, `onVerified` | renders `TruthReportClassic` |
| `src/components/TruthReportClassic.tsx` | Full report render + access branching | `accessLevel`, `gateProps` | — |
| `src/components/LockedOverlay.tsx` | OTP UI gate | `gateProps`, `grade`, `flagCount` | `onOtpSubmit`, `onPhoneSubmit` |

---

## 3. Current State Ownership

### 3.1 State Source-of-Truth Map

| State Value | Owner | Persistence | Survives Refresh? |
|-------------|-------|-------------|-------------------|
| `phoneE164` | `ScanFunnelContext` (`src/state/scanFunnel.tsx`) | `localStorage` (`wm_funnel_phoneE164`) | Yes — 24h TTL |
| `phoneStatus` | `ScanFunnelContext` | `localStorage` (`wm_funnel_phoneStatus`) | Yes — 24h TTL |
| `sessionId` | `ScanFunnelContext` + `Index.tsx` `useState` | `localStorage` (`wm_funnel_sessionId`) + component state | Yes (LS) / No (component) |
| `leadId` | `ScanFunnelContext` (in-memory only) | None | No |
| `scanSessionId` | `Index.tsx` `useState` + `ScanFunnelContext.scanSessionId` | None | No |
| `fileUploaded` | `Index.tsx` `useState` | None | No |
| `gradeRevealed` | `Index.tsx` `useState` | None | No |
| `isFullLoaded` | `useAnalysisData` hook (internal `useState`) | `localStorage` via `verifiedAccess` helper | Resume path only |
| `analysisData` | `useAnalysisData` hook | None (in-memory) | No |
| `verifiedAccess` (resume) | `src/lib/verifiedAccess.ts` | `localStorage` | Yes |
| `localGateOverride` | `PostScanReportSwitcher` `useState` | None | No |
| `capturedPhone` | `PostScanReportSwitcher` `useState` | None | No |

### 3.2 Funnel Persistence — What Is Already There

`src/state/scanFunnel.tsx` is the **authoritative persistence layer**. It:
- Persists `phoneE164`, `phoneStatus`, `sessionId` to localStorage with keys `wm_funnel_*`
- Has a 24-hour TTL with auto-expiry
- Exposes `setPhone()`, `setPhoneStatus()`, `setSessionId()`
- Does **not** persist `scanSessionId`, `leadId`, `quoteFileId` (in-memory only)

**The fix must build on top of this layer.** The `scanSessionId` is the key gap — it is not persisted, so a page refresh during theatrics loses the scan pointer.

### 3.3 Pre-Test → OTP Handoff Path

```
TruthGateFlow
  └─ submitPhone() → funnel.setPhone(e164, "otp_sent")
                  → funnel.setSessionId(sessionId)

ScanTheatrics
  └─ autoSendGuardRef: fires when phoneStatus===\"screened_valid\" + scan ready
  └─ Sets funnel.setPhoneStatus("sending_otp") → "otp_sent" | "send_failed"

PostScanReportSwitcher
  └─ Reads funnel.phoneStatus + funnel.phoneE164
  └─ deriveGateMode() → "enter_code" when phoneStatus===\"otp_sent"
  └─ User enters OTP → pipeline.submitOtp() → verify-otp
  └─ onVerified() → funnel.setPhoneStatus("verified") → props.onVerified(phone)
  └─ Index.fetchFull(phone) → useAnalysisData.fetchFull(phone)

```

### 3.4 OTP Completion → Full Reveal Handoff

```
pipeline.submitOtp(otpValue)
  → verify-otp edge function
  → Twilio verification check
  → phone_verifications row updated: status="verified", lead_id bound
  → leads.phone_verified = true
  ← returns { status: "verified", e164 }

PostScanReportSwitcher.onVerified callback
  → funnel.setPhoneStatus("verified")
  → props.onVerified(phoneE164)

Index.tsx onVerified handler
  → fetchFull(phoneE164) (from useAnalysisData)

useAnalysisData.fetchFull(phoneE164)
  → get_analysis_full(scanSessionId, phoneE164)
  → Backend: checks phone_verifications JOIN leads JOIN scan_sessions
  → Returns: grade, flags, pillar_scores, full_json fields
  → setData(fullData) — flags array now populated
  → setIsFullLoaded(true)
  → saveVerifiedAccess(scanSessionId, phoneE164) to localStorage

PostScanReportSwitcher receives isFullLoaded=true prop
  → useReportAccess({ isFullLoaded: true }) → "full"
  → TruthReportClassic renders full report (no LockedOverlay gate)
```

---

## 4. Current Data Contracts

### 4.1 Pre-Test / Process Validation Phase

During theatrics (before `onRevealComplete` fires):
- **Polling data:** `useScanPolling` returns only `{ status, isPolling, error }` — single scalar status from `get_scan_status` RPC
- **Analysis data available:** `useAnalysisData` begins fetching `get_analysis_preview` as soon as `scanSessionId` exists and `enabled=true`
- **Fields available in preview:** `grade`, `flagCount`, `flagRedCount`, `flagAmberCount`, `contractorName`, `confidenceScore`, `pillarScores`, `documentType`, `pageCount`, `openingCount`, `lineItemCount`, `qualityBand`, `hasWarranty`, `hasPermits`, `analysisStatus`
- **Fields explicitly withheld:** `flags[]` array is hardcoded to `[]` in preview fetch (line 258: `flags: []`)

### 4.2 Preview / Teaser State Contract

After `onRevealComplete` fires; `PostScanReportSwitcher` mounted; `accessLevel === "preview"`:
- `grade` — visible
- `flagCount`, `flagRedCount`, `flagAmberCount` — visible (counts only)
- `contractorName` — visible
- `pillarScores` — visible (status bands)
- `flags[]` — **EMPTY**, never rendered
- `LockedOverlay` — rendered with `gateProps`
- `full_json` — never fetched, never on client

### 4.3 Full Unlock State Contract

After OTP verification; `isFullLoaded === true`; `accessLevel === "full"`:
- `flags[]` — populated with full `AnalysisFlag[]` array
- `pillarScores` — enhanced with `extractPillarScoresWithFlags()`
- `derivedMetrics` — extracted from `full_json.derived_metrics`
- `LockedOverlay` — not rendered (`gateProps` is `undefined`)
- Backend gate: `get_analysis_full` requires `phone_verifications.status = 'verified'` AND three-table JOIN `pv.lead_id → leads.id ← scan_sessions.lead_id`

### 4.4 Access Gate — Data vs. Visual

The access gate is **data-gated**, not visually-gated:
- `get_analysis_full` returns empty rows if verification fails — the full flags/data never reach the client
- `useReportAccess` returns "full" only when `isFullLoaded === true` (i.e., the RPC returned valid data)
- `gateProps` passed to `TruthReportClassic` is `undefined` in full mode — the `LockedOverlay` is conditionally not rendered
- There is no blur/CSS hiding of existing data — full data is simply never fetched until verified

**Note from `STRATEGIC_ASSESSMENT.md` (line ~36):** An older version of `useReportAccess` was a comment-flagged cosmetic-only gate. The current version (confirmed from source) correctly gates on `isFullLoaded`, which is only true after backend confirmation.

---

## 5. Trust-Bug Diagnosis

### 5.1 Root Cause Matrix

| # | Candidate Cause | Status | Evidence | Affected File | Confidence |
|---|----------------|--------|----------|--------------|------------|
| 1 | Duplicate event emission from backend progress/polling | **ruled_out** | `useScanPolling` uses a single interval, `TERMINAL_STATUSES` stop set, and poll-count guard. No array accumulation of events. | `src/hooks/useScanPolling.ts` | 95% |
| 2 | React.StrictMode double-invocation duplicating queue inserts | **ruled_out** | `autoSendGuardRef` in `ScanTheatrics` uses a `Set<string>` keyed on `scanSessionId|phoneE164`. StrictMode double-fire hits the guard on second invocation. | `src/components/ScanTheatrics.tsx` L64, L97 | 95% |
| 3 | Stale state from previous upload sessions | **plausible** | `ScanFunnelContext` does NOT persist `scanSessionId`. On refresh during theatrics, `scanSessionId` in Index becomes null. However, funnel retains `phoneE164`/`phoneStatus` from prior session. This could cause UI to show prior-session state artifacts. | `src/state/scanFunnel.tsx`, `src/pages/Index.tsx` | 60% |
| 4 | Duplicate local array pushes / reducer inserts | **ruled_out** | No array accumulation in the theatrics → preview chain. `setData()` replaces state wholesale in `useAnalysisData`. | `src/hooks/useAnalysisData.ts` | 95% |
| 5 | Chunked/streamed/retried responses interpreted as separate documents | **ruled_out** | `get_analysis_preview` is a single RPC call, not a stream. `doFetch()` uses a `previewFetchedRef` idempotency guard so it only sets data once per `scanSessionId`. | `src/hooks/useAnalysisData.ts` L196, L201 | 95% |
| 6 | **Demo/theatrics copy implying multiple documents even when state does not** | **CONFIRMED PRIMARY** | `ScanTheatrics.tsx` cliffhanger phase renders: (a) hardcoded 3-item checklist regardless of analysisData, (b) `"Multi-page document analyzed"` chip when `analysisData.pageCount != null` — even when `pageCount === 1`. This is factually incorrect and trust-damaging. | `src/components/ScanTheatrics.tsx` L321-L337, L355-L358 | 95% |
| 7 | Service worker / retry / fetch duplication | **ruled_out** | No service worker registration found in `index.html` or `vite.config.ts`. Standard Vite SPA, no PWA plugin evident. | repo root | 90% |
| 8 | Missing idempotency key or canonical manifest at UI boundary | **plausible/secondary** | `previewFetchedRef` guards the preview fetch correctly. But `doFetch` has a retry loop (up to 8 attempts × 2500ms) with no deduplication of UI side-effects during retries. Each `setData()` call during retries would replace data correctly. Not a duplicate-document issue but could cause momentary flickers. | `src/hooks/useAnalysisData.ts` L237-L245 | 40% |

### 5.2 Primary Root Cause — Confirmed

**File:** `src/components/ScanTheatrics.tsx`
**Location:** Cliffhanger phase render, lines ~321–370

**Defect A — Hardcoded three-item checklist (lines 321–337):**
```
{ label: "Document structure detected",  done: true },
{ label: "Text readability confirmed",   done: true },
{ label: "Quote layout identified",      done: true },
```
These three items always render with green `✓` checkmarks. They are not derived from `analysisData`. They convey zero information about the actual uploaded document but appear to the user as three structural validations — implying the system has analyzed three distinct aspects or parts of a document.

**Defect B — "Multi-page document analyzed" chip (lines 355–358):**
```tsx
{analysisData.pageCount != null && (
  <span>Multi-page document analyzed</span>
)}
```
The condition is `pageCount != null`, not `pageCount > 1`. A single-page document with `pageCount = 1` will display "Multi-page document analyzed." This is factually incorrect and trust-damaging.

### 5.3 Secondary Contributing Cause

The combination of three always-true checklist items plus the "Multi-page document analyzed" chip creates an additive impression of plurality: three structural checks passed + multi-page analysis = implies a large, multi-document corpus was processed. This compounds the trust damage even if neither defect alone would be noticed.

---

## 6. Proposed File-Touch Map

### A. Files to Inspect (Read)

| File | Why Inspect |
|------|-------------|
| `src/components/ScanTheatrics.tsx` | Primary bug location |
| `src/components/UploadZone.tsx` | Upload initiation, single-file contract |
| `src/hooks/useScanPolling.ts` | Polling idempotency |
| `src/hooks/useAnalysisData.ts` | Data contract, preview/full gate |
| `src/hooks/useReportAccess.ts` | Access level derivation |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | OTP gate + handoff to full |
| `src/state/scanFunnel.tsx` | State persistence architecture |
| `src/pages/Index.tsx` | Orchestration, prop threading |
| `DOUBLE_OTP_DIAGNOSTIC_REPORT.md` | Prior diagnosis context |
| `OTP_TIMING_ANALYSIS.md` | Prior timing analysis |

### B. Files to Touch in `fix/pre-test-trust`

| File | Why Touch | Smallest Safe Change | Risk If Not Touched |
|------|-----------|---------------------|---------------------|
| `src/components/ScanTheatrics.tsx` | Contains both confirmed defects | (1) Remove or rewrite the hardcoded 3-item checklist to reflect actual analysisData fields. (2) Fix the `pageCount != null` condition to `pageCount > 1` | Users continue to see trust-damaging copy on every scan session |

**That is the only file that must be touched for Step 1.**

### C. Files Explicitly Not Touched

| File | Why Not Touched |
|------|----------------|
| `src/hooks/usePhonePipeline.ts` | OTP pipeline is sound; modifying it risks regression in the real Twilio gate |
| `src/pages/ReportClassic.tsx` | Standalone report route; unrelated to in-page theatrics bug |
| `src/components/TruthReportClassic.tsx` | Report render is not the source of the trust bug |
| `src/components/LockedOverlay.tsx` | OTP gate UI is correct; modifying it is out of scope |
| `supabase/functions/send-otp/*` | Backend; bug is frontend-only |
| `supabase/functions/verify-otp/*` | Backend; bug is frontend-only |
| `supabase/functions/scan-quote/*` | Scoring/extraction; unrelated |
| All scoring/rubric/schema files | Not implicated |
| All RLS/migrations | Not implicated |
| GTM/attribution plumbing | Not implicated |
| `src/hooks/useAnalysisData.ts` | Data contract is correct; preview correctly returns `pageCount` |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | OTP handoff is correct; not a theatrics concern |
| `src/state/scanFunnel.tsx` | Persistence architecture is sound; no change needed for this bug |

---

## 7. Step 1 Execution Plan (`fix/pre-test-trust`)

### Step 1 — Fix `pageCount` condition in `ScanTheatrics.tsx`

1. **Change:** Change the render condition for the "Multi-page document analyzed" chip from `analysisData.pageCount != null` to `analysisData.pageCount != null && analysisData.pageCount > 1`
2. **Target file:** `src/components/ScanTheatrics.tsx` (~line 355)
3. **Why this fixes the issue:** A single-page document will no longer display "Multi-page document analyzed." Only documents with confirmed `pageCount > 1` will display this label.
4. **Why this is the safest approach:** One conditional operator change on an existing null-check. Zero architectural change. Does not affect any other phase, hook, or state.
5. **What risk it avoids:** Eliminates false plurality claim for single-page PDF uploads, which are the most common case for a single contractor quote.
6. **How success will be verified:** Upload a single-page PDF; confirm "Multi-page document analyzed" chip does NOT appear during cliffhanger. Upload a known multi-page PDF; confirm the chip DOES appear.

---

### Step 2 — Replace hardcoded 3-item checklist with evidence-based dynamic content

1. **Change:** Remove the hardcoded `[{ label: "Document structure detected", done: true }, ...]` array from the cliffhanger phase. Replace with a conditional content block driven by `analysisData` fields: show only items that correspond to real extraction results (e.g., if `contractorName` exists: show "Contractor identified"; if `lineItemCount > 0`: show "Line items detected"; if `documentType` exists: show "Quote type confirmed"). If `analysisData` is not yet available, show no checklist items or a single neutral "Quote file processed" message.
2. **Target file:** `src/components/ScanTheatrics.tsx` (~lines 321–337)
3. **Why this fixes the issue:** Every checkmark now corresponds to a real extracted field. Users see only what was actually found. A user who uploaded one document sees evidence of that one document's processing — not a fabricated list of three checks.
4. **Why this is the safest approach:** The change is contained entirely to the static copy array in the cliffhanger section. It does not alter phase timing, polling logic, OTP auto-send, or any data contract. The `analysisData` prop is already passed to `ScanTheatrics` and correctly populated from `get_analysis_preview`.
5. **What risk it avoids:** Eliminates the primary trust-destruction mechanism: the appearance that multiple structural sections were validated when the user knows they uploaded one file. Eliminates the risk of a future regression reintroducing false positive copy.
6. **How success will be verified:** During a clean upload of a single PDF with one page: (a) no three-item checklist appears, (b) only evidence-based signals are shown, (c) no copy implies multiple documents.

---

### Fallback Containment Plan (if root cause is incorrect)

If Steps 1–2 do not resolve the trust perception issue (i.e., if users are still reporting "multiple documents" confusion after the copy is corrected), the next investigation target is:

- Add `console.log("[ScanTheatrics] analysisData at cliffhanger:", analysisData)` at the point where the cliffhanger block renders, capturing `pageCount`, `lineItemCount`, `documentType`, and `contractorName`.
- Add `console.log("[useAnalysisData] doFetch attempt:", attempt, "result:", row?.grade, row?.page_count)` inside the retry loop to confirm `doFetch` is not setting data multiple times.
- This telemetry would close any remaining uncertainty about whether the data layer is emitting repeated/stale values.

---

## 8. QA Plan

### QA Scenario Matrix

| # | Scenario | Expected Behavior After Fix | Pass Condition |
|---|----------|---------------------------|----------------|
| 1 | Single PDF upload from clean session (1 page) | Cliffhanger shows: no "Multi-page" chip, dynamic evidence-based content only, no 3-item hardcoded checklist | No plural-document language; only truth-signal copy visible |
| 2 | Single image upload (JPG/PNG) from clean session | Same as scenario 1 | Same |
| 3 | Upload after previous session exists (stale funnel state) | Prior `phoneE164`/`phoneStatus` from localStorage may pre-fill OTP gate; scan theatrics starts fresh with new `scanSessionId` | No stale session data visible in theatrics copy; OTP gate pre-fills phone correctly |
| 4 | Mobile background/return during theatrics | Page returns to theatrics state; `isActive` prop still true; phase machine resumes | No phantom document claims appear on resume |
| 5 | React dev mode / StrictMode double-render check | `autoSendGuardRef.current.has(guardKey)` blocks second invocation; OTP sent exactly once | Network tab shows exactly one call to `send-otp` |
| 6 | Polling / retry path (scan takes >8s) | Phase machine stays in "scanning" until both min time AND `scanStatus === preview_ready`; cliffhanger only appears after real data | No "Multi-page" chip until `analysisData.pageCount > 1` confirmed |
| 7 | Failed upload followed by retry | `onInvalidDocument` / `onNeedsBetterUpload` callbacks fire; `setFileUploaded(false)`, `setScanSessionId(null)` reset state; new upload starts fresh | No stale theatrics content from failed attempt |
| 8 | Preview reached with one document only | `PostScanReportSwitcher` receives `pageCount`, `lineItemCount` etc. from the single uploaded document | Report preview does not claim multiple documents |
| 9 | OTP gate reached after preview | `deriveGateMode(funnel.phoneStatus, funnel.phoneE164, null)` returns "enter_code" when `phoneStatus === "otp_sent"` | OTP input shown; no phone re-entry required; one OTP submit call to backend |
| 10 | No UI copy implies multiple documents unless state truly contains multiple documents | All copy in ScanTheatrics cliffhanger phase is derived from `analysisData` fields; no hardcoded "plural" strings | Zero instances of "multi-page", "multiple documents", "documents analyzed" unless `pageCount > 1` |

### Manual Verification Steps

1. Open browser DevTools Network tab before uploading
2. Upload a single 1-page PDF
3. During cliffhanger: confirm Network tab shows exactly one call to `send-otp` (if `phoneStatus === "screened_valid"`)
4. Verify cliffhanger copy: no three-item checklist, no "Multi-page document analyzed" chip
5. Verify OTP entry: one OTP input field; after code entry, exactly one call to `verify-otp`
6. Verify full report unlocks: `isFullLoaded` transitions from false to true; full flags visible
7. Reload page mid-theatrics: scan theatrics resets (no `scanSessionId` in LS); landing page shown

---

## 9. Open Questions / Uncertainties

### Resolved by audit
- The "double OTP" bug described in `DOUBLE_OTP_DIAGNOSTIC_REPORT.md` has been fixed. The current `ScanTheatrics.tsx` no longer contains a theatrical OTP step or `handleOtpSubmit()` that calls nothing. The auto-send guard replaces it correctly.
- `useReportAccess` is data-gated (not cosmetic). Confirmed from source at `src/hooks/useReportAccess.ts`.
- `previewFetchedRef` prevents duplicate preview fetches per `scanSessionId`. Confirmed.

### Genuinely unresolved
1. **`scanSessionId` survives page refresh?** — Currently no. `Index.tsx` holds `scanSessionId` in local `useState`; `ScanFunnelContext` has `setScanSessionId` but does not persist it to `localStorage`. If the user backgrounds the app during theatrics on mobile and the page is killed, the scan session ID is lost. The fix for this is out of scope for `fix/pre-test-trust` but is a known gap.
2. **`analysisData` during cliffhanger timing** — The cliffhanger phase block at line 341 only renders the `analysisData`-based content when `analysisData.analysisStatus === "preview_ready" || "complete"`. However, `useAnalysisData` sets `analysisStatus: "complete"` on every successful preview fetch (line 272). This is a naming inconsistency — `analysisStatus: "complete"` in the `AnalysisData` struct is set independently of `scanStatus`. This should not cause a functional bug in the fix but is worth noting as a labeling inconsistency.
3. **`doFetch` retry loop and `setData` during retries** — `doFetch` retries up to 8 times at 2500ms intervals. If a prior attempt set `data` but the UI then re-renders from a new `enabled` change, `previewFetchedRef.current === scanSessionId` will short-circuit correctly. However, if a retry fires after unmount and `cancelled = true`, the `finally` block correctly guards `setIsLoading(false)`. This is sound but is a complex retry path worth a regression test.

   **Fastest instrumentation to close this gap:** Add `console.log("[useAnalysisData] setData called, attempt:", attempt)` inside `doFetch` before `setData(...)`. If this fires more than once for the same `scanSessionId`, it would indicate a new class of bug. Currently there is no evidence this fires more than once.

---

*Audit complete. No production code was modified. All conclusions are traceable to repository source files as cited above.*