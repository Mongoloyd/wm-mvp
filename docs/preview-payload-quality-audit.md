# PREVIEW PAYLOAD QUALITY AUDIT

**Date:** 2026-04-01  
**Branch:** `copilot/audit-preview-payload-quality`  
**Auditor:** Principal Frontend Engineer / State-Management Auditor  
**Prior Art:** `docs/pre-test-trust-audit.md`  

---

## 1. Executive Summary

| Finding | Short Label | Confidence |
|---------|-------------|------------|
| The backend RPC payload is **rich and correct** — not the weak link | Payload OK | 95% |
| Several extracted fields are **never rendered** in the cliffhanger UI | Presentation gap | 90% |
| Fields that ARE rendered use **generic copy** instead of specific values | Presentation weak | 90% |
| The hardcoded 3-item checklist renders **unconditionally** and always passes | Static copy defect | 95% |
| `pageCount != null` condition causes factually wrong "Multi-page" chip on 1-page docs | Mapping defect | 95% |
| `analysisData.analysisStatus === "preview_ready"` is dead code; that value is never set | Mapping dead-branch | 90% |
| A ~0–1.5s race window exists where cliffhanger is visible before `analysisData` arrives | Timing race | 70% |
| No evidence of backend extraction weakness for the trust-signal fields inspected | Extraction sound | 90% |

**Primary root cause of weak pre-OTP trust layer:**  
**D — Presentation / render weakness**, closely seconded by **B — Mapping / normalization bugs**.  
The backend delivers sufficient signal. The frontend discards, misuses, or fails to render most of it.

**Step 1 can be 100% frontend-only.** No backend, RLS, migration, or edge function changes are needed to fix the primary weaknesses identified.

---

## 2. Current Preview Flow Map

```
[User uploads file]
        │
        ▼
UploadZone (src/components/UploadZone.tsx)
  · onScanStart(fileName, scanSessionId) → sets scanSessionId in Index state
        │
        ▼
Index.tsx (src/pages/Index.tsx:68)
  · useAnalysisData(scanSessionId, enabled) ← Phase 1 preview fetch starts here
  · state: fileUploaded=true → mounts ScanTheatrics
        │
        ▼
ScanTheatrics (src/components/ScanTheatrics.tsx)
  · Props: isActive, scanSessionId, grade?, analysisData?  (line 56)
  · useScanPolling(scanSessionId) — polls scan_sessions.status  (line 76)
  · Phase timeline:
    ├─ "scanning" (0–8s): logSteps animation, no analysisData used
    ├─ "cliffhanger" (~8s+): hardcoded checklist + optional analysisData trust signals
    ├─ "pillars" (~10s): generic pillar cards, not data-driven
    └─ "reveal" (~17s): grade circle (gradeProp), calls onRevealComplete()
        │
        ▼ onRevealComplete() → gradeRevealed=true in Index
        │
        ▼
PostScanReportSwitcher (src/components/post-scan/PostScanReportSwitcher.tsx)
  · Props: grade, flags[], pillarScores[], contractorName, confidenceScore,
           documentType, qualityBand, hasWarranty, hasPermits, pageCount,
           lineItemCount, flagCount, flagRedCount, flagAmberCount,
           isFullLoaded, onVerified  (lines 22–62)
  · useReportAccess({ isFullLoaded }) → "preview" until full data loaded  (line 65)
  · usePhonePipeline("validate_and_send_otp", ...) — OTP pipeline  (lines 143–151)
  · Renders TruthReportClassic in preview mode (accessLevel="preview")
        │
        ▼ OTP verified → onVerified(phoneE164)
        │
        ▼
Index.tsx: fetchFull(phoneE164) — Phase 2 fetch  (line 318)
  · useAnalysisData.fetchFull() calls get_analysis_full RPC  (useAnalysisData.ts:298)
  · Backend: 3-table JOIN enforces phone_verifications.lead_id → leads ← scan_sessions
  · On success: isFullLoaded=true → useReportAccess returns "full"
        │
        ▼
PostScanReportSwitcher re-renders with accessLevel="full"
  · TruthReportClassic renders full report with flags[], pillar breakdown, etc.
```

**Authoritative state owner:** `ScanFunnelContext` (`src/state/scanFunnel.tsx`) — persists `phoneE164`, `phoneStatus`, `leadId`, `sessionId`, `scanSessionId` to localStorage with 24-hour TTL.

---

## 3. Preview Data Contract

### 3.1 Backend — `get_analysis_preview` RPC

**Definition:** `supabase/migrations/20260322_redact_preview_create_gated_full.sql:13–48`

**Return columns:**

| Column | Type | Notes |
|--------|------|-------|
| `grade` | text | Letter grade (A–F) |
| `flag_count` | integer | Total flags (SQL: `jsonb_array_length`) |
| `flag_red_count` | integer | Count where severity IN ('Critical', 'High') |
| `flag_amber_count` | integer | Count where severity = 'Medium' |
| `proof_of_read` | jsonb | Object with page_count, opening_count, contractor_name, document_type, line_item_count |
| `preview_json` | jsonb | Object with grade, flag_count, opening_count_bucket, quality_band, hard_cap_applied, has_warranty, has_permits, pillar_scores |
| `confidence_score` | numeric | OCR confidence 0–100 |
| `document_type` | text | e.g. "impact_window_quote" |
| `rubric_version` | text | Scoring version |

**Gate:** `WHERE a.analysis_status = 'complete'` — RPC returns empty until scan finishes.

**Flags are NOT returned** in preview — only counts.

### 3.2 Backend — `proof_of_read` construction

**Source:** `supabase/functions/scan-quote/index.ts:1172–1180`

```js
const proofOfRead = {
  page_count:       extraction.page_count || null,
  opening_count:    extraction.opening_count || extraction.line_items.length,
  contractor_name:  extraction.contractor_name || null,
  document_type:    extraction.document_type,       // also stored as direct column
  line_item_count:  extraction.line_items.length,
};
```

### 3.3 Backend — `preview_json` construction

**Source:** `supabase/functions/scan-quote/index.ts:1181–1190` (exact)

```js
const previewJson = {
  grade: gradeResult.letterGrade,
  flag_count: flags.length,
  opening_count_bucket: openingBucket,
  quality_band: gradeResult.weightedAverage >= 70 ? "good" : gradeResult.weightedAverage >= 50 ? "fair" : "poor",
  hard_cap_applied: gradeResult.hardCapApplied,
  has_warranty: !!extraction.warranty,
  has_permits: !!extraction.permits,
  pillar_scores: buildPreviewPillarScores(gradeResult.pillarScores),
};
```

`buildPreviewPillarScores` (scan-quote/index.ts:288–298) returns **only `{status}` objects** (pass/warn/fail), with exact numeric scores intentionally withheld from preview.

### 3.4 Frontend — `AnalysisData` interface

**Source:** `src/hooks/useAnalysisData.ts:39–59`

```typescript
export interface AnalysisData {
  grade: string;
  flags: AnalysisFlag[];           // EMPTY in preview; populated after fetchFull()
  flagCount: number;
  flagRedCount: number;
  flagAmberCount: number;
  contractorName: string | null;
  confidenceScore: number | null;
  pillarScores: PillarScore[];
  documentType: string | null;
  pageCount: number | null;
  openingCount: number | null;
  lineItemCount: number | null;
  qualityBand: "good" | "fair" | "poor" | null;
  hasWarranty: boolean | null;
  hasPermits: boolean | null;
  analysisStatus: string | null;
  derivedMetrics?: Record<string, unknown> | null;  // full-phase only
}
```

### 3.5 Frontend — Phase 1 extraction (preview)

**Source:** `src/hooks/useAnalysisData.ts:256–273`

| `AnalysisData` field | Source in RPC row | Extraction code | Line |
|---|---|---|---|
| `grade` | `row.grade` | direct | 257 |
| `flags` | (none) | hardcoded `[]` | 258 |
| `flagCount` | `row.flag_count` | `?? 0` | 259 |
| `flagRedCount` | `row.flag_red_count` | `?? 0` | 260 |
| `flagAmberCount` | `row.flag_amber_count` | `?? 0` | 261 |
| `contractorName` | `proof_of_read.contractor_name` | `(as string) \|\| null` | 262 |
| `confidenceScore` | `row.confidence_score` | `?? null` | 263 |
| `pillarScores` | `row.preview_json.pillar_scores` | `extractPillarScores()` | 264 |
| `documentType` | `row.document_type` | `\|\| null` | 265 |
| `pageCount` | `proof_of_read.page_count` | `typeof === "number"` guard | 266 |
| `openingCount` | `proof_of_read.opening_count` | `typeof === "number"` guard | 267 |
| `lineItemCount` | `proof_of_read.line_item_count` | `typeof === "number"` guard | 268 |
| `qualityBand` | `preview_json.quality_band` | set-based validation | 269 |
| `hasWarranty` | `preview_json.has_warranty` | `typeof === "boolean"` guard | 270 |
| `hasPermits` | `preview_json.has_permits` | `typeof === "boolean"` guard | 271 |
| `analysisStatus` | (none) | hardcoded `"complete"` | 272 |

**Note:** `proof_of_read.document_type` is redundant with `row.document_type`; the frontend correctly reads the direct column (line 265). No loss here.

### 3.6 Frontend — Phase 2 (full, post-OTP)

Triggered by `fetchFull(phoneE164)` in `useAnalysisData.ts:289–346`. Calls `get_analysis_full`, which enforces the 3-table JOIN (migration `20260322_fix_get_analysis_full_session_binding.sql:37–47`). Returns `flags` (populated), `full_json` (with `derived_metrics`). Sets `isFullLoaded = true`.

### 3.7 Gate condition

`useReportAccess` (`src/hooks/useReportAccess.ts:32`):
```typescript
if (isFullLoaded) return "full";
return "preview";
```
`isFullLoaded` is only true after `fetchFull()` returns valid data. The backend is the real gate.

---

## 4. Mapping / Normalization Findings

### 4.1 Mandatory check results

#### 1. Is `document_type` returned and mapped correctly?

- **Returned:** ✅ YES — `get_analysis_preview` returns `document_type` as a direct column (migration line 22).
- **Mapped:** ✅ YES — `documentType: row.document_type || null` at `useAnalysisData.ts:265`.
- **Used in ScanTheatrics:** ⚠️ PARTIAL — `documentType` increments the `anchorCount` in `OcrQualityBadge` (ScanTheatrics.tsx:503) but is **never rendered as a visible text chip** in the cliffhanger trust signal section (lines 354–374). The user cannot see what document type was detected.

#### 2. Is `contractor_name` returned and mapped correctly?

- **Returned:** ✅ YES — inside `proof_of_read` JSONB blob (scan-quote:1175, migration:39).
- **Mapped:** ✅ YES — `contractorName: (proofOfRead?.contractor_name as string) || null` at `useAnalysisData.ts:262`. This relies on the backend contract that `contractor_name` is `string | null`; there is no additional runtime type guard here (unlike `pageCount`/`lineItemCount`).
- **Rendered:** ⚠️ WEAK — ScanTheatrics.tsx:365–368 shows only the generic copy "· Contractor information identified" when `contractorName` is truthy. The actual contractor name is **never displayed**. A trust-building opportunity (e.g. "Quote from [ContractorName]") is discarded.

#### 3. Is `page_count` returned and mapped correctly?

- **Returned:** ✅ YES — inside `proof_of_read` (scan-quote:1173, migration:39).
- **Mapped:** ✅ YES — with correct type guard at `useAnalysisData.ts:266`.
- **Rendered:** ❌ **BUG (B1)** — ScanTheatrics.tsx:355:
  ```tsx
  // CURRENT (buggy) — fires even when pageCount = 1
  {analysisData.pageCount != null && (
    <span>Multi-page document analyzed</span>
  )}
  ```
  Condition is `!= null` (i.e., truthy when 1, 2, or any number). A single-page document with `pageCount = 1` renders **"Multi-page document analyzed"** — factually incorrect.
  ```tsx
  // CORRECT — only fires when more than one page was found
  {analysisData.pageCount != null && analysisData.pageCount > 1 && (
    <span>{analysisData.pageCount}-page document analyzed</span>
  )}
  ```

#### 4. Is `line_item_count` returned and mapped correctly?

- **Returned:** ✅ YES — inside `proof_of_read` (scan-quote:1177, migration:39).
- **Mapped:** ✅ YES — with type guard at `useAnalysisData.ts:268`.
- **Rendered:** ⚠️ WEAK — ScanTheatrics.tsx:360 correctly guards with `lineItemCount > 0`, but renders only generic text "Detailed line items detected". The actual count (e.g., "14 line items detected") is available but discarded.

#### 5. Is `proof_of_read` being used meaningfully in preview?

- **Partially.** Of the 5 fields in `proof_of_read`:
  - `page_count` → extracted, but condition bug (see B1 above)
  - `opening_count` → extracted as `openingCount` (useAnalysisData.ts:267) but **never used** in ScanTheatrics
  - `contractor_name` → extracted, rendered generically
  - `document_type` → available both in blob and as direct column; uses direct column (correct)
  - `line_item_count` → extracted, count value discarded in rendering

### 4.2 Additional mapping bugs

#### Bug B2 — Dead `analysisStatus` condition branch

**Source:** `ScanTheatrics.tsx:341`
```tsx
{analysisData && (analysisData.analysisStatus === "preview_ready" || analysisData.analysisStatus === "complete") && (
```

`useAnalysisData` never sets `analysisStatus = "preview_ready"`. The only values it assigns are:
- `"complete"` — after a successful `get_analysis_preview` fetch (line 272)
- A terminal status string (e.g. `"invalid_document"`) — from the pre-check path (line 224)

`"preview_ready"` is a **`useScanPolling` scan status value**, not an `analysisStatus` value. The branch `analysisData.analysisStatus === "preview_ready"` is dead code and will never fire. The trust signal block only renders when `analysisData.analysisStatus === "complete"`, which requires the preview RPC fetch to complete.

**Impact:** Not a user-visible bug on its own, but means the trust signal block is dependent on the Phase 1 fetch completing. See Section 5 for timing implications.

### 4.3 Fields extracted but discarded in ScanTheatrics

The following `AnalysisData` fields are correctly mapped by `useAnalysisData` but **never used** in the `ScanTheatrics` cliffhanger phase:

| Field | Value Example | Could Be Used For |
|-------|---------------|-------------------|
| `openingCount` | 8 | "8 window/door openings found" |
| `qualityBand` | "good" | Alternative confidence label |
| `hasWarranty` | true | "Warranty language detected" |
| `hasPermits` | true/false | "Permit handling language found/missing" |
| `flagCount` | 5 | "5 issues flagged for review" |
| `flagRedCount` | 2 | "2 critical issues found" |
| `flagAmberCount` | 3 | "3 cautions flagged" |
| `documentType` | "impact_window_quote" | "Impact window quote identified" |

These are all available in `analysisData` during the cliffhanger phase (once Phase 1 fetch completes), but none are rendered.

---

## 5. Timing / Race Findings

### 5.1 Phase timeline

| Time | Event |
|------|-------|
| T=0s | Upload complete; `scanSessionId` set; `useAnalysisData` starts fetching |
| T=0s | First `get_analysis_preview` RPC call attempt (attempt 0) |
| T=0–8s | ScanTheatrics "scanning" phase animation runs |
| T=2.5s | Retry attempt 1 (if attempt 0 returned empty) |
| T=5.0s | Retry attempt 2 |
| T=7.5s | Retry attempt 3 |
| T=8.0s | `scanningMinDone = true` (useEffect timeout, ScanTheatrics.tsx:204) |
| T=8s+ | If `scanStatus === "preview_ready" \|\| "complete"` → cliffhanger starts |
| T=10.0s | Retry attempt 4 (if earlier retries returned empty) |

### 5.2 Race window

**Transition gate** (ScanTheatrics.tsx:174):
```tsx
if ((scanStatus === "preview_ready" || scanStatus === "complete") && scanningMinDone && phase === "scanning") {
  setPhase("cliffhanger");
```

`scanStatus` comes from `useScanPolling`, which polls `scan_sessions.status` independently of `useAnalysisData`. When polling detects "preview_ready" at, say, T=8.2s, the cliffhanger starts immediately.

`useAnalysisData` uses its own retry cadence (every 2500ms). If the last retry before T=8.2s was at T=7.5s and returned empty (scan had not completed), the next retry fires at T=10.0s — meaning `analysisData` is null from T=8.2s until T=10.0s.

**Race window duration:** Typically 0–1.5 seconds. Benign in most cases because:
1. The hardcoded checklist always fills the space
2. The cliffhanger phase lasts ~2s before transitioning to pillars

### 5.3 Does ScanTheatrics render before useful preview fields are available?

**Answer:** The **hardcoded checklist** (lines 321–337) renders unconditionally the moment the cliffhanger phase starts, regardless of `analysisData` state. The **real trust signals** (lines 341–374) require `analysisData.analysisStatus === "complete"`, meaning the Phase 1 fetch must have returned successfully.

In the majority of fast-scan flows (scan completes before T=7.5s), `analysisData` is available when cliffhanger starts. In slower flows, there is a brief gap. However, the primary trust-quality problem is not this timing gap — it's that even when `analysisData` IS available, the presentation is weak.

---

## 6. Presentation Findings

### 6.1 Hardcoded cliffhanger checklist — static, unconditional, evidence-free

**Source:** `ScanTheatrics.tsx:320–338`

```tsx
{[
  { label: "Document structure detected", done: true },
  { label: "Text readability confirmed",  done: true },
  { label: "Quote layout identified",     done: true },
].map((item, i) => (
  <motion.div ...>
    <span style={{ color: "#059669" }}>✓</span>
    <span>{item.label}</span>
  </motion.div>
))}
```

This is hardcoded. All three items always render with green ✓ checkmarks regardless of what `analysisData` contains. If OCR confidence is low or the document type is unrecognised, these checkmarks still appear, implying a successful structural validation that may not have occurred.

The three labels ("Document structure detected", "Text readability confirmed", "Quote layout identified") are plausible generic claims but are not derived from any extraction field.

### 6.2 Trust signal section — available but underused

**Source:** `ScanTheatrics.tsx:341–374`

This section correctly gates on `analysisData` presence and `analysisStatus === "complete"`. When it renders, it shows:

| Chip | Condition | Value Shown |
|------|-----------|-------------|
| "Multi-page document analyzed" | `pageCount != null` (BUG: fires for pageCount=1) | no count value |
| "· Detailed line items detected" | `lineItemCount != null && lineItemCount > 0` | no count value |
| "· Contractor information identified" | `contractorName` truthy | no actual name |
| OcrQualityBadge | always when trust signals render | "GOOD" / "GREAT" / "EXCELLENT" / "FAIR" |

Three observations:
1. **No count values** — the actual numbers (`lineItemCount`, `pageCount`) are available but not displayed
2. **Contractor name hidden** — `contractorName` is used as a boolean signal; the name itself is never shown
3. **Multiple unused fields** — `documentType`, `openingCount`, `qualityBand`, `hasWarranty`, `hasPermits`, `flagCount`, `flagRedCount`, `flagAmberCount` are all available at this point but produce no visible output

### 6.3 OcrQualityBadge — anchor count includes pageCount bug

**Source:** `ScanTheatrics.tsx:499–533`

```tsx
function OcrQualityBadge({ confidenceScore, data }) {
  let anchorCount = 0;
  if (data.documentType) anchorCount++;
  if (data.contractorName) anchorCount++;
  if (data.lineItemCount != null && data.lineItemCount > 0) anchorCount++;
  if (data.pageCount != null) anchorCount++;   // ← SAME bug: pageCount=1 increments count
```

The `pageCount != null` anchor check inflates `anchorCount` for single-page documents, potentially upgrading the quality label from "Great" to "Excellent" when the document has only one page. This is a minor severity secondary bug.

### 6.4 `analysisData` in pillars phase — zero usage

**Source:** `ScanTheatrics.tsx:390–444`

The "pillars" phase (after cliffhanger) uses only the static `pillars` array (lines 47–52):
```ts
const pillars = [
  { label: "PRICING ANALYSIS", text: "Benchmarking against {county} county market data...", ... },
  { label: "SPECIFICATION REVIEW", text: "Checking window brand, series, and glass specifications...", ... },
  { label: "WARRANTY AUDIT", text: "Reviewing labor and manufacturer warranty language...", ... },
  { label: "PERMIT & FEE SCAN", text: "Verifying permit inclusion and installation fee structure...", ... },
];
```
These are entirely static strings — county-interpolated but otherwise not driven by `analysisData`. Available data such as `hasWarranty`, `hasPermits`, `qualityBand`, pillar score status values, etc., are not used here.

---

## 7. Root Cause Ranking

| Rank | Root Cause Class | Confidence | Primary Evidence |
|------|-----------------|------------|-----------------|
| **1** | **D — Presentation / render weakness** | **90%** | Hardcoded checklist (ScanTheatrics:321–337); weak chip copy; 8+ fields available but never rendered in cliffhanger |
| **2** | **B — Frontend mapping / normalization weakness** | **75%** | `pageCount != null` bug (line 355) triggers false "Multi-page" copy; dead `analysisStatus === "preview_ready"` branch (line 341); `contractorName` displayed as boolean not string |
| **3** | **C — Timing / race-condition weakness** | 40% | 0–1.5s gap between cliffhanger start and `analysisData` arrival in slower scans |
| **4** | **A — Backend preview extraction weakness** | 10% | No evidence; payload returns grade, flag counts, contractor, page/line counts, pillar statuses, quality band — all present |

**Answers to the four core questions:**

- **A. Preview payload missing or weak?** No. The `get_analysis_preview` RPC and `proof_of_read` / `preview_json` blobs provide a rich set of pre-OTP signals. The backend is the strongest part of the stack.
- **B. Frontend reading payload incorrectly?** Partially. The `pageCount != null` bug creates incorrect "Multi-page" copy. The dead `preview_ready` branch wastes a condition check. `contractorName` is treated as a boolean. Overall: minor bugs, not the primary cause.
- **C. Frontend receiving payload too late?** Marginally. The race window is real but short (0–1.5s) and does not cause a blank screen (hardcoded checklist fills the gap). Not the primary cause of trust weakness.
- **D. UI not presenting available data well?** Yes — this is the primary cause. Eight or more available fields are discarded silently. Fields that are displayed use generic copy instead of specific values.

---

## 8. Proposed File-Touch Map For Next Step

### A. Files to Inspect (already read, no further action needed)

| File | Reason Inspected |
|------|-----------------|
| `src/hooks/useAnalysisData.ts` | Phase 1/2 fetch, AnalysisData interface |
| `src/components/ScanTheatrics.tsx` | Theatrics phases, trust signals, OTP auto-send |
| `src/components/post-scan/PostScanReportSwitcher.tsx` | OTP pipeline, gate logic |
| `src/hooks/useReportAccess.ts` | Access level decision |
| `src/pages/Index.tsx` | Top-level orchestration |
| `src/state/scanFunnel.tsx` | Authoritative persisted state |
| `supabase/migrations/20260322_redact_preview_create_gated_full.sql` | RPC contract |
| `supabase/migrations/20260322_fix_get_analysis_full_session_binding.sql` | Full gate security |
| `supabase/functions/scan-quote/index.ts` | proof_of_read / preview_json construction |

### B. Files to Touch in Next Fix Branch

**Only one file requires changes:**

| File | Changes Required | Risk of Touching | Risk of Not Touching |
|------|-----------------|-----------------|---------------------|
| `src/components/ScanTheatrics.tsx` | Fix `pageCount != null` → `pageCount > 1`; Remove hardcoded checklist; Render available fields as evidence-based trust signals; Optionally display contractor name and counts | Low — single component, UI-only | Trust-damaging false claims ("Multi-page") persist; rich preview payload remains invisible to users |

**No other files need modification:**

- `useAnalysisData.ts` — Extraction is correct. The mapping is sound for all fields except the `pageCount` rendering (which is in ScanTheatrics, not this hook).
- `PostScanReportSwitcher.tsx` — Correctly receives and passes all preview fields; OTP pipeline is sound.
- `useReportAccess.ts` — Minimal and correct; should not be changed.
- Any Supabase function or migration — Backend payload is sufficient; no changes needed.

### C. Files Explicitly Not Touched

| File | Why Excluded |
|------|--------------|
| `src/hooks/usePhonePipeline.ts` | OTP pipeline is sound; out of scope |
| `src/pages/ReportClassic.tsx` | Alternate report route; not in preview path |
| `src/components/TruthReportClassic.tsx` | Renders after OTP, not pre-OTP |
| `src/components/LockedOverlay.tsx` | Post-preview presentation only |
| `supabase/functions/send-otp/*` | OTP pipeline is sound |
| `supabase/functions/verify-otp/*` | OTP pipeline is sound |
| `supabase/functions/scan-quote/*` | Extraction and payload are correct |
| All scoring / rubric files | Out of scope |
| All RLS / migration files | Backend gate is sound |
| `src/state/scanFunnel.tsx` | Authoritative state; no changes needed |
| `src/hooks/useAnalysisData.ts` | Extraction is correct; no changes needed |

---

## 9. Recommended Next Step

**Branch name:** `fix/preview-payload-presentation`  
**Target file:** `src/components/ScanTheatrics.tsx` only

### Step 1 — Fix the `pageCount` condition (1-line change)

**Change:**  
`ScanTheatrics.tsx:355` — `analysisData.pageCount != null` → `analysisData.pageCount != null && analysisData.pageCount > 1`

**Why:** A single-page document (`pageCount = 1`) currently renders "Multi-page document analyzed" — factually wrong. This is the clearest factual defect in the preview layer.

**Risk:** Zero. One conditional operator; no data path changes.

**Verify:** Upload a 1-page quote → "Multi-page document analyzed" chip must not appear.

### Step 2 — Fix the `OcrQualityBadge` anchor count (same bug, different location)

**Change:**  
`ScanTheatrics.tsx:506` — `if (data.pageCount != null) anchorCount++;` → `if (data.pageCount != null && data.pageCount > 1) anchorCount++;`

**Why:** Same incorrect `!= null` logic inflates the anchor count and can promote the badge from "Great" to "Excellent" on a 1-page doc.

**Risk:** Zero. One conditional operator.

### Step 3 — Replace hardcoded 3-item checklist with evidence-based content

**Change:**  
`ScanTheatrics.tsx:321–337` — Remove the static `[{ done: true }, ...]` array. Replace with chips derived from actual `analysisData` fields. Show content only if `analysisData` is available; fall back to a minimal neutral state if it is not.

**Guiding principle:** Only show a check if the extraction produced the relevant field.

Examples of evidence-based substitutes (for reference, not prescriptive):
- `documentType` present → "Impact window quote identified"  
- `contractorName` present → "Quote from [contractorName] identified"  
- `lineItemCount > 0` → "[N] line items detected"  
- `pageCount > 1` → "[N]-page document analyzed"  
- `confidenceScore` available → drives OcrQualityBadge as-is  
- If `analysisData` is null → show a single neutral message or a loading indicator

**Why:** The current hardcoded list implies false structural validation. Replacing it with `analysisData`-driven content makes the proof-of-read phase honest.

**Risk:** Low — UI-only. Does not change data flow, state, or OTP path. If `analysisData` is null (timing race), the block can safely render nothing or a spinner.

**Must-not-do:** Do not display any individual flag details or flag content in the theatrics phase. Aggregate counts (for example, a total "issues found" count) are safe to show, but specific flag detail must remain gated behind OTP.

### Step 4 — Optionally add `documentType` as a visible chip

**Change:**  
`ScanTheatrics.tsx` — In the trust signals section, add a chip for `documentType` when present (e.g. "Document type: Impact window quote").

**Why:** `documentType` is extracted, mapped, and available; it's the most direct proof-of-read signal but is currently invisible.

**Risk:** Low. Presence-based only — shows if `documentType` is non-null.

---

## 10. QA / Validation Plan

### Mandatory scenarios

| # | Scenario | Pass Criterion |
|---|----------|----------------|
| 1 | Single-page PDF upload (clean session) | "Multi-page document analyzed" chip does NOT appear |
| 2 | Multi-page PDF upload (3+ pages) | "Multi-page document analyzed" chip DOES appear |
| 3 | Upload with a named contractor in the quote | Chip shows contractor name (or "Contractor identified"), not hidden |
| 4 | Upload with many line items (>5) | Actual count displayed (or "Detailed line items detected") |
| 5 | Upload with low confidence score (<55) | OcrQualityBadge shows "FAIR", not inflated by false pageCount anchor |
| 6 | Upload from clean session with no `analysisData` at cliffhanger start | No hardcoded green checkmarks appear; neutral/loading state renders instead |
| 7 | Upload after a previous session (stale funnel state cleared) | No phantom contractor name or line item count from previous session |
| 8 | Mobile background/return during theatrics | No stale trust signal chips appear; correct `analysisData` used |
| 9 | React dev mode / StrictMode | No duplicate trust-signal chip sets visible; side effects remain correct under StrictMode re-renders |
| 10 | OTP gate reached after preview | Full report unlocks; trust signal chips not visible after reveal |
| 11 | Slow scan (>10s backend processing) | Cliffhanger shows neutral state initially; updates when `analysisData` arrives |
| 12 | `document_type` is "unrelated_document" | `invalid_document` path fires; theatrics do not progress to cliffhanger |

### Regression scenarios (must not break)

| # | Scenario | Pass Criterion |
|---|----------|----------------|
| R1 | OTP pipeline fires once per session | One `send-otp` request in Network tab; `autoSendGuardRef` still guards |
| R2 | Full report only accessible after OTP | `isFullLoaded` remains false until `fetchFull()` called; `useReportAccess` returns "preview" |
| R3 | Returning verified user resume | `tryResume()` still works; `?resume=1` param still routes correctly |
| R4 | Backend RLS / gate unchanged | `get_analysis_full` still requires 3-table JOIN; no preview data includes flags |
