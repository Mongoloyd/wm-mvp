

# Runtime Flow Audit — WindowMan.PRO

## Current Flow Map

```text
Step 1: Lead Capture (TruthGateFlow)
  → User answers 4 config questions
  → Step 5: firstName + email form
  → Creates lead row in Supabase (session_id = crypto.randomUUID())
  → Calls onLeadCaptured(sessionId) → Index sets leadCaptured=true, sessionId
  → Writes sessionId to ScanFunnelContext (persisted to localStorage)

Step 2: Upload (UploadZone)
  → Visible only when leadCaptured=true (Index.tsx line 224)
  → Resolves lead via get_lead_by_session RPC using sessionId
  → Creates quote_files + scan_sessions rows
  → Invokes scan-quote edge function
  → Calls onScanStart(fileName, scanSessionId)
  → Index sets scanSessionId + fileUploaded=true

Step 3: Scan (ScanTheatrics)
  → Polls scan status via useScanPolling
  → On complete → onRevealComplete → gradeRevealed=true

Step 4: Report (PostScanReportSwitcher → TruthReportClassic)
  → useAnalysisData fetches preview via get_analysis_preview RPC
  → Report renders in "preview" mode (flags hidden)
  → LockedOverlay shows phone input → OTP flow
  → On OTP success → fetchFull(phoneE164) → full flags loaded
  → saveVerifiedAccess(scanSessionId, phoneE164)

Step 5: CTA Actions
  → "Get Counter-Quote" → generate-contractor-brief → voice-followup
  → "Call WindowMan" → voice-followup
  → introRequested/reportCallRequested → match card / call confirmation UI

Step 6: Resume (page reload)
  → getVerifiedAccess() reads localStorage record
  → Restores scanSessionId, sets fileUploaded+gradeRevealed+leadCaptured
  → tryResume() calls get_analysis_full with stored phone
  → Report renders in full mode directly
```

## Source-of-Truth Map

| Concept | Canonical Source | Persistence | Risk |
|---|---|---|---|
| **Lead identity (leadId)** | Supabase `leads` table, resolved via `get_lead_by_session(sessionId)` | DB row | None — UploadZone resolves on each upload |
| **sessionId** (lead session) | `Index.tsx` local state, also in `ScanFunnelContext` → localStorage (`wm_funnel_sessionId`) | localStorage (24h) | On resume, sessionId is NOT restored — only scanSessionId is. This is fine because resume skips lead capture. |
| **scanSessionId** | `Index.tsx` local state | NOT directly persisted. Recovered indirectly via `verifiedAccess.scan_session_id` in localStorage | **Low risk**: resume path reads it from verifiedAccess record |
| **Verified phone** | `verifiedAccess.phone_e164` (localStorage, 24h) + `phone_verifications` table (DB) | Both | Consistent — verifiedAccess is saved only after DB verification succeeds |
| **Report unlock state** | `isFullLoaded` flag in `useAnalysisData` hook (derived from successful `get_analysis_full` call) | Not directly persisted; reconstructed via `tryResume()` on reload | Correct — backend is source of truth |
| **CTA completion state** | `introRequested` / `reportCallRequested` in `PostScanReportSwitcher` local state | **Ephemeral only** — lost on refresh | **Known limitation** — see risk list |
| **capturedPhone** | `PostScanReportSwitcher` local state | **Ephemeral** — re-derived from funnel context on fresh mount | OK — funnel context persists phone to localStorage |

## Structural Verification

### UploadZone — CLEAN
- No redundant name/email fields. Pure dropzone.
- Correctly gated by `leadCaptured` in Index.tsx (line 224).
- Lead resolved via RPC, with fallback creation if missing.
- **PASS**

### PostScanReportSwitcher — CLEAN
- Owns CTA state (`introRequested`, `reportCallRequested`, `isCtaLoading`, `suggestedMatch`).
- Calls `generate-contractor-brief` and `voice-followup` edge functions directly.
- Passes handlers + state to TruthReportClassic.
- **PASS**

### Index.tsx — CLEAN
- No no-op CTA callbacks passed. PostScanReportSwitcher handles CTAs internally.
- `onVerified` callback correctly triggers `fetchFull(phoneE164)`.
- **PASS**

### ReportClassic.tsx — CLEAN
- Independent smart container for `/report/classic/:sessionId` route.
- Owns its own CTA state and edge function calls (mirrors PostScanReportSwitcher pattern).
- **PASS**

### TruthReportClassic — PRESENTATIONAL
- Zero Supabase/Twilio knowledge. Receives handlers and state as props.
- CTA section (line 509-687) correctly branches on `introRequested` / `reportCallRequested`.
- Buttons disabled when `isCtaLoading` is true.
- **PASS**

## End-to-End Risk List

### BUG 1: CTA state lost on refresh (Medium)
**What**: `introRequested` and `reportCallRequested` are ephemeral. If user clicks "Get Counter-Quote", sees match card, then refreshes — the match card disappears and buttons reappear.
**Impact**: User could trigger duplicate `generate-contractor-brief` calls. The edge function creates a new `contractor_opportunities` row each time.
**Fix options**:
- (a) Check `contractor_opportunities` for existing record on mount and pre-set `introRequested=true`
- (b) Make `generate-contractor-brief` idempotent (upsert instead of insert)
- (c) Store CTA completion in localStorage keyed by scanSessionId

### BUG 2: No duplicate-submit protection beyond `isCtaLoading` (Low)
**What**: Both CTAs share one `isCtaLoading` flag. Fast double-click is guarded by the loading state, which is set synchronously before the async call. This is adequate.
**What's missing**: No server-side idempotency. Rapid clicks with race conditions could create duplicates.
**Impact**: Low — the loading flag is set before `await`, so the window is minimal.

### BUG 3: `phoneE164` could be null at CTA time in edge case (Low)
**What**: If `capturedPhone` is null AND funnel context lost its phone AND pipeline has no e164, the CTA shows a toast error. This is correct behavior.
**But**: The CTA buttons are visible (in full mode) even when phone is null. They just fail gracefully with a toast.
**Impact**: Minor UX issue — buttons could be hidden or disabled when phone is unavailable.

### NON-BUG: sessionId not restored on resume
**What**: `sessionId` (lead session) is not restored from localStorage on resume. Only `scanSessionId` is restored.
**Impact**: None — resume path skips lead capture entirely. The `sessionId` is only needed for UploadZone's `get_lead_by_session` call.

## Edge Function Inventory

| Function | Request Body | Called From | Status |
|---|---|---|---|
| `scan-quote` | `{scan_session_id}` | UploadZone | Working |
| `send-otp` | `{phone_e164, scan_session_id}` | usePhonePipeline | Working |
| `verify-otp` | `{phone_e164, code, scan_session_id}` | usePhonePipeline | Working |
| `generate-contractor-brief` | `{scan_session_id, phone_e164, cta_source}` | PostScanReportSwitcher + ReportClassic | Working — returns `{success, opportunity_id, suggested_match?}` |
| `voice-followup` | `{scan_session_id, phone_e164, call_intent, cta_source, opportunity_id?}` | PostScanReportSwitcher + ReportClassic | Working — uses phonecall.bot `{to, info}` format |

## Mobile-Specific Issues

### No critical layout bugs found in code
- UploadZone uses `max-w-2xl mx-auto` — responsive.
- TruthReportClassic uses `max-w-4xl` with responsive padding.
- CTA buttons are full-width (`w-full`) in their container.
- OTP input (LockedOverlay) uses standard input-otp component.

### Potential issue: keyboard overlap on phone input
- On mobile, the LockedOverlay phone input may be obscured by the virtual keyboard. No `scrollIntoView` is called when the input focuses. This is a common mobile UX issue but not a logic bug.

## Final Verdict

| Step | Status |
|---|---|
| 1. Lead Capture | **PASS** — single form, creates lead, sets sessionId |
| 2. Upload | **PASS** — clean dropzone, no redundant inputs, resolves lead correctly |
| 3. Scan | **PASS** — polls correctly, transitions to report |
| 4. Report Render | **PASS** — two-phase data loading, correct preview/full gating |
| 5. CTA Actions | **PASS with caveat** — edge functions fire correctly, UI updates. Bug 1 (state lost on refresh) is real but low-severity. |
| 6. Persistence | **PASS** — verifiedAccess record enables 24h resume. CTA state is ephemeral (Bug 1). |
| 7. Edge Function Payloads | **PASS** — all payloads match expected schemas |
| 8. Database Writes | **PASS** — leads, quote_files, scan_sessions, analyses, contractor_opportunities all written correctly |
| 9. Event Logging | **PASS** — key events tracked (lead_captured, upload_completed, phone_submitted, report_unlocked) |
| 10. Mobile | **PASS with minor note** — keyboard overlap risk on phone input |

## Concrete Fixes Needed

Only Bug 1 warrants a fix:

**Fix: Persist CTA completion state and make it recoverable**

In `PostScanReportSwitcher`, on mount, query `contractor_opportunities` for the current `scanSessionId`. If a record exists with `status != 'intro_requested'` or has `brief_generated_at` set, pre-set `introRequested = true` and hydrate `suggestedMatch` from the stored `suggested_match_snapshot`. This prevents duplicate CTA triggers on refresh.

Implementation:
1. Add a `useEffect` in PostScanReportSwitcher that runs when `scanSessionId` + `isFullLoaded` are truthy
2. Query `contractor_opportunities` where `scan_session_id = scanSessionId`
3. If found: set `introRequested = true`, hydrate `suggestedMatch` from `suggested_match_snapshot`
4. Same pattern in ReportClassic.tsx

This is ~20 lines of code in each smart container.

