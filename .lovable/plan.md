

# Fix: Redundant Name/Email Fields + Dead CTA Buttons

## Problem Summary

Two distinct bugs:

1. **Redundant name/email collection**: TruthGateFlow (step 5) collects first name + email and creates a lead. Then UploadZone asks for name + email AGAIN with its own gate. The UploadZone gate was added based on a misunderstanding — the user was testing in a logged-in sandbox and thought the gate was bypassable. In reality, TruthGateFlow already gates the flow. UploadZone only becomes visible AFTER `leadCaptured` is true (Index.tsx line 224), meaning the user has already provided name+email.

2. **Dead CTA buttons**: In `PostScanReportSwitcher.tsx`, the `onContractorMatchClick` and `onReportHelpCall` props are passed straight through to `TruthReportClassic` — but `Index.tsx` passes them as empty no-ops (`() => {}`). There is no logic anywhere that calls `generate-contractor-brief` or `voice-followup` edge functions from the report rendered on the Index page. The CTA section in TruthReportClassic has post-click UI (match card, call confirmation) driven by `introRequested` and `reportCallRequested` props, but those are never set to true.

## Plan

### Step 1: Remove redundant name/email from UploadZone

Strip out the firstName, email, gateWarning state, the two input fields, the gate warning UI, and the locked-dropzone logic from `UploadZone.tsx`. The dropzone should always be active when the component is visible (it's already gated by `leadCaptured` in Index.tsx). Remove the `isValidEmail`/`isValidName` import.

Keep the lead-update logic in `handleScan` but source name+email from the existing lead record (already created by TruthGateFlow) rather than from local inputs. Since the lead is already created with name+email by TruthGateFlow, UploadZone just needs to link the file to that lead via `sessionId` — which it already does.

**Files**: `src/components/UploadZone.tsx`

### Step 2: Wire CTA logic into PostScanReportSwitcher

PostScanReportSwitcher is the "smart container" that should own CTA state. Add:

- `introRequested`, `reportCallRequested`, `isCtaLoading`, `suggestedMatch` state
- `handleContractorMatchClick`: calls `generate-contractor-brief` edge function, sets `introRequested=true`, parses response for match data
- `handleReportHelpCall`: calls `voice-followup` edge function, sets `reportCallRequested=true`
- Both need the phone from `capturedPhone || funnel?.phoneE164 || pipeline.e164` and the `scanSessionId`
- Pass these as props to TruthReportClassic instead of the current no-ops

This ensures clicking either CTA button actually fires the edge function AND updates the UI to show the match card or call confirmation.

**Files**: `src/components/post-scan/PostScanReportSwitcher.tsx`

### Step 3: Remove no-op callbacks from Index.tsx

Update `PostScanReportSwitcher` usage in Index.tsx: remove the `onContractorMatchClick={() => {}}` and `onReportHelpCall={() => {}}` props since the smart container now owns them internally.

**Files**: `src/pages/Index.tsx`

### Step 4: Same fix for ReportClassic.tsx (if applicable)

Check if `ReportClassic.tsx` also passes no-op CTA handlers and apply the same pattern.

**Files**: `src/pages/ReportClassic.tsx`

## Technical Details

```text
Current flow:
  TruthGateFlow (name+email) → leadCaptured=true → UploadZone (name+email AGAIN) → scan

Fixed flow:
  TruthGateFlow (name+email) → leadCaptured=true → UploadZone (just file upload) → scan

Current CTA flow:
  Index passes onContractorMatchClick={() => {}} → button click does nothing

Fixed CTA flow:
  PostScanReportSwitcher owns CTA state internally
  → calls generate-contractor-brief / voice-followup
  → sets introRequested/reportCallRequested → match card renders
```

## Files Changed

| File | Change |
|---|---|
| `src/components/UploadZone.tsx` | Remove name/email fields, gate logic, restore simple dropzone |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | Add CTA state + edge function calls, pass to TruthReportClassic |
| `src/pages/Index.tsx` | Remove no-op CTA callback props |
| `src/pages/ReportClassic.tsx` | Check/fix same pattern if applicable |

