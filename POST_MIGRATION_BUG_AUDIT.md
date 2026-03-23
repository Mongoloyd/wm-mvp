# Post-Migration Bug Audit — OTP Unlock Failure + Preview Count Mismatch

**Date:** 2026-03-22  
**Scope:** Classic report flow only. No UI redesign, no V2/Findings, no re-architecture.  
**Repo:** `Mongoloyd/wm-mvp` @ `c5ab720` (main)

---

## 1. Root Cause Summary

### Bug A — OTP Unlock Failure (modal stays visible after correct code)

**Root cause: `get_analysis_full` RPC silently returns empty, so `isFullLoaded` never flips to `true`.**

The full call chain is wired correctly in frontend code:

```
User enters OTP
  → handleOtpSubmit() [PostScanReportSwitcher:66]
    → pipeline.submitOtp(otpValue) [usePhonePipeline:187]
      → supabase.functions.invoke("verify-otp") → returns { verified: true }
      → setPhoneStatus("verified")
      → options.onVerified() [usePhonePipeline:213]
        → funnel.setPhoneStatus("verified") [PostScanReportSwitcher:58]
        → props.onVerified(phone) [PostScanReportSwitcher:60]
          → fetchFull(phoneE164) [Index.tsx:257]
            → supabase.rpc("get_analysis_full", { p_scan_session_id, p_phone_e164 })
```

The chain breaks at `fetchFull`. There are **two independent failure modes**, both present:

**Failure Mode 1 — `get_analysis_full` is not in `types.ts`:**
The Supabase types file (`src/integrations/supabase/types.ts`) was never regenerated after the migration. It still lists the old `get_analysis_preview` return shape (with `flags: Json` instead of `flag_count`/`flag_red_count`/`flag_amber_count`) and **does not contain `get_analysis_full` at all**. With supabase-js v2 and a typed `Database` generic, calling `.rpc("get_analysis_full", ...)` on a function not in the type definition may:
- Compile without error (TypeScript allows excess string literals in some configurations)
- But at runtime, PostgREST may reject the call if the function doesn't exist in the database

**Failure Mode 2 — `get_analysis_full` SQL has the cross-unlock exploit (no session binding):**
Even if the migration was applied, the `get_analysis_full` function checks phone verification **globally** — it only verifies that `p_phone_e164` exists in `phone_verifications` with `status = 'verified'`, but does NOT verify that the phone is bound to the specific `scan_session_id`. If the `verify-otp` edge function updates `phone_verifications` by `phone_e164` only (which it does — line: `.eq("phone_e164", phone_e164)`), and if there are **no prior `phone_verifications` rows** for that phone (e.g., the `send-otp` function creates them with `status: 'pending'` but the row might not exist yet), then the `EXISTS` check returns false and the function returns empty.

**The most likely immediate cause:** The `verify-otp` edge function updates existing `phone_verifications` rows to `verified`, but `send-otp` inserts a row with `status: 'pending'`. If `send-otp` failed to insert (e.g., RLS blocking the insert, or a unique constraint violation), there's no row to update, and `get_analysis_full` finds no verified record.

**However**, even if the verification row exists and is marked verified, `fetchFull` in `useAnalysisData.ts` has a silent failure path:

```typescript
// useAnalysisData.ts:264
if (rpcErr) { console.error("get_analysis_full error:", rpcErr); return; }
const row = Array.isArray(rows) ? rows[0] : rows;
if (!row || !row.grade) { console.error("get_analysis_full returned empty"); return; }
```

If `rpcErr` is truthy OR `row` is empty, the function **returns without setting `isFullLoaded = true`** and without setting `isLoadingFull = false` in the catch-free path. Wait — actually it does set `isLoadingFull = false` in the `finally` block. But `isFullLoaded` stays `false`, so `useReportAccess` returns `"preview"`, and the LockedOverlay continues rendering.

**Net diagnosis:** The frontend chain is correct. The bug is that `get_analysis_full` returns empty (either because the migration wasn't applied, or because the phone verification row doesn't exist/isn't found). The fix must ensure the types are updated AND add console logging to surface the exact RPC error.

### Bug B — Preview Counts Show Zeros (Grade D with "0 issues identified")

**Root cause: `TruthReportClassic` derives ALL counts from the `flags` array, which is intentionally empty in preview mode.**

The data flow:

```
get_analysis_preview RPC
  → returns: { grade: "D", flag_count: 5, flag_red_count: 3, flag_amber_count: 2, ... }

useAnalysisData (preview fetch)
  → sets: { grade: "D", flags: [], flagCount: 5, flagRedCount: 3, flagAmberCount: 2, ... }
  → flags is intentionally [] — the backend no longer returns individual flags in preview

Index.tsx
  → passes to PostScanReportSwitcher:
      flags={reportFlags}          // [] — empty array
      flagCount={activeData?.flagCount}  // 5 — correct aggregate

PostScanReportSwitcher
  → spreads {...props} to TruthReportClassic
  → flagCount IS passed through (it's in the Props type)

TruthReportClassic
  → IGNORES flagCount prop entirely
  → Computes from flags array:
      const redCount = flags.filter(f => f.severity === "red").length;   // 0
      const amberCount = flags.filter(f => f.severity === "amber").length; // 0
      const greenCount = flags.filter(f => f.severity === "green").length; // 0
      const issueCount = redCount + amberCount;                           // 0
```

**Every count display in preview mode is zero** because:
1. `TruthReportClassic` interface does NOT accept `flagCount`, `flagRedCount`, or `flagAmberCount` props
2. It computes all counts from `flags.filter(...)` which is `[]` in preview
3. The LockedOverlay receives `flagCount={issueCount}` where `issueCount = 0`
4. The "Forensic Findings" header shows "0 Issues Identified"
5. The summary bar shows "0 critical, 0 caution, 0 confirmed"
6. The LockedOverlay headline reads "Your D has 0 red flags."

**The same bug exists in `ReportClassic.tsx`** (the route page) — it passes `flags={analysisData.flags}` (empty in preview) and does NOT pass any aggregate count props.

---

## 2. Exact File-by-File Fix Blocks

### Fix B1 — TruthReportClassic: Accept and use aggregate count props

**FILE:** `src/components/TruthReportClassic.tsx`  
**ACTION:** EDIT  
**WHY:** Component must use backend-provided aggregate counts in preview mode instead of deriving from empty flags array.

**Change 1 — Add props to interface (line 8-26):**

Replace:
```typescript
interface TruthReportProps {
  grade: string;
  flags: AnalysisFlag[];
  pillarScores: PillarScore[];
  contractorName: string | null;
  county: string;
  confidenceScore: number | null;
  documentType: string | null;
  accessLevel: "preview" | "full";
  qualityBand?: "good" | "fair" | "poor" | null;
  hasWarranty?: boolean | null;
  hasPermits?: boolean | null;
  pageCount?: number | null;
  lineItemCount?: number | null;
  onContractorMatchClick: () => void;
  onSecondScan: () => void;
  /** Gate props — passed through to LockedOverlay when accessLevel is "preview" */
  gateProps?: Omit<LockedOverlayProps, "grade" | "flagCount">;
}
```

With:
```typescript
interface TruthReportProps {
  grade: string;
  flags: AnalysisFlag[];
  pillarScores: PillarScore[];
  contractorName: string | null;
  county: string;
  confidenceScore: number | null;
  documentType: string | null;
  accessLevel: "preview" | "full";
  qualityBand?: "good" | "fair" | "poor" | null;
  hasWarranty?: boolean | null;
  hasPermits?: boolean | null;
  pageCount?: number | null;
  lineItemCount?: number | null;
  /** Aggregate counts from preview RPC — used when flags[] is empty */
  flagCount?: number;
  flagRedCount?: number;
  flagAmberCount?: number;
  onContractorMatchClick: () => void;
  onSecondScan: () => void;
  /** Gate props — passed through to LockedOverlay when accessLevel is "preview" */
  gateProps?: Omit<LockedOverlayProps, "grade" | "flagCount">;
}
```

**Change 2 — Destructure new props and use them as fallbacks (lines 63-89):**

Replace:
```typescript
const TruthReportClassic = ({
  grade,
  flags,
  pillarScores,
  contractorName,
  county,
  confidenceScore,
  documentType,
  accessLevel,
  qualityBand,
  hasWarranty,
  hasPermits,
  pageCount,
  lineItemCount,
  onContractorMatchClick,
  onSecondScan,
  gateProps
}: TruthReportProps) => {
  const config = gradeConfig[grade] || gradeConfig.C;
  const isFull = accessLevel === "full";
  const [copied, setCopied] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());
  const redCount = flags.filter((f) => f.severity === "red").length;
  const amberCount = flags.filter((f) => f.severity === "amber").length;
  const greenCount = flags.filter((f) => f.severity === "green").length;
  const issueCount = redCount + amberCount;
```

With:
```typescript
const TruthReportClassic = ({
  grade,
  flags,
  pillarScores,
  contractorName,
  county,
  confidenceScore,
  documentType,
  accessLevel,
  qualityBand,
  hasWarranty,
  hasPermits,
  pageCount,
  lineItemCount,
  flagCount: flagCountProp,
  flagRedCount: flagRedCountProp,
  flagAmberCount: flagAmberCountProp,
  onContractorMatchClick,
  onSecondScan,
  gateProps
}: TruthReportProps) => {
  const config = gradeConfig[grade] || gradeConfig.C;
  const isFull = accessLevel === "full";
  const [copied, setCopied] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());

  // In full mode, derive from actual flags array.
  // In preview mode, flags is [] — use aggregate props from backend.
  const flagsDerivedRed = flags.filter((f) => f.severity === "red").length;
  const flagsDerivedAmber = flags.filter((f) => f.severity === "amber").length;
  const flagsDerivedGreen = flags.filter((f) => f.severity === "green").length;

  const redCount = isFull ? flagsDerivedRed : (flagRedCountProp ?? flagsDerivedRed);
  const amberCount = isFull ? flagsDerivedAmber : (flagAmberCountProp ?? flagsDerivedAmber);
  const greenCount = isFull ? flagsDerivedGreen : Math.max(0, (flagCountProp ?? 0) - (flagRedCountProp ?? 0) - (flagAmberCountProp ?? 0));
  const issueCount = redCount + amberCount;
```

**Change 3 — Fix the summary bar to use aggregate counts in preview (line 430):**

Replace:
```typescript
<p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f7f7f7" }}>Grade {grade} · {flags.length} items reviewed</p>
```

With:
```typescript
<p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#f7f7f7" }}>Grade {grade} · {isFull ? flags.length : (flagCountProp ?? flags.length)} items reviewed</p>
```

---

### Fix B2 — PostScanReportSwitcher: Forward aggregate count props

**FILE:** `src/components/post-scan/PostScanReportSwitcher.tsx`  
**ACTION:** EDIT  
**WHY:** PostScanReportSwitcher already accepts `flagCount` but must also accept and forward `flagRedCount` and `flagAmberCount` to TruthReportClassic.

**Change 1 — Add missing props to type (around line 30):**

Replace:
```typescript
  flagCount?: number;
  onContractorMatchClick: () => void;
```

With:
```typescript
  flagCount?: number;
  flagRedCount?: number;
  flagAmberCount?: number;
  onContractorMatchClick: () => void;
```

No other changes needed — the `{...props}` spread on line 105 already forwards all props to TruthReportClassic.

---

### Fix B3 — Index.tsx: Pass flagRedCount and flagAmberCount

**FILE:** `src/pages/Index.tsx`  
**ACTION:** EDIT  
**WHY:** Index.tsx passes `flagCount` but not `flagRedCount` or `flagAmberCount` to PostScanReportSwitcher.

Find (around line 255):
```typescript
                flagCount={activeData?.flagCount}
                isFullLoaded={isFullLoaded}
```

Replace with:
```typescript
                flagCount={activeData?.flagCount}
                flagRedCount={activeData?.flagRedCount}
                flagAmberCount={activeData?.flagAmberCount}
                isFullLoaded={isFullLoaded}
```

---

### Fix B4 — ReportClassic.tsx: Pass aggregate count props

**FILE:** `src/pages/ReportClassic.tsx`  
**ACTION:** EDIT  
**WHY:** The route-based report page has the same bug — it passes `flags` (empty in preview) but no aggregate counts.

Find the `<TruthReportClassic` render block and add after `lineItemCount`:
```typescript
      flagCount={analysisData.flagCount}
      flagRedCount={analysisData.flagRedCount}
      flagAmberCount={analysisData.flagAmberCount}
```

---

### Fix A1 — useAnalysisData: Add defensive logging for fetchFull failures

**FILE:** `src/hooks/useAnalysisData.ts`  
**ACTION:** EDIT  
**WHY:** `fetchFull` silently swallows errors, making it impossible to diagnose why the modal stays. Add explicit logging.

Replace (lines 260-266):
```typescript
      const { data: rows, error: rpcErr } = await supabase.rpc(
        "get_analysis_full",
        { p_scan_session_id: scanSessionId, p_phone_e164: phoneE164 }
      );
      if (rpcErr) { console.error("get_analysis_full error:", rpcErr); return; }
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row || !row.grade) { console.error("get_analysis_full returned empty"); return; }
```

With:
```typescript
      console.log("[fetchFull] Calling get_analysis_full", { scanSessionId, phoneE164 });
      const { data: rows, error: rpcErr } = await (supabase.rpc as any)(
        "get_analysis_full",
        { p_scan_session_id: scanSessionId, p_phone_e164: phoneE164 }
      );
      if (rpcErr) {
        console.error("[fetchFull] get_analysis_full RPC error:", rpcErr);
        console.error("[fetchFull] This likely means the migration has not been applied or the function does not exist in Supabase.");
        return;
      }
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row || !row.grade) {
        console.error("[fetchFull] get_analysis_full returned empty — phone verification may have failed in DB.", { rows });
        return;
      }
      console.log("[fetchFull] Full data received, unlocking report");
```

**Note on `as any` cast:** The `supabase.rpc` call is cast to `any` because `get_analysis_full` is not in the stale `types.ts`. This is a temporary workaround until `types.ts` is regenerated.

---

### Fix A2 — Supabase types: Add get_analysis_full and update get_analysis_preview

**FILE:** `src/integrations/supabase/types.ts`  
**ACTION:** EDIT  
**WHY:** The types file is stale — `get_analysis_preview` still has `flags: Json` (old schema) and `get_analysis_full` is missing entirely. This causes TypeScript to reject the RPC call.

Find:
```typescript
      get_analysis_preview: {
        Args: { p_scan_session_id: string }
        Returns: {
          confidence_score: number
          document_type: string
          flags: Json
          grade: string
          preview_json: Json
          proof_of_read: Json
          rubric_version: string
        }[]
      }
```

Replace with:
```typescript
      get_analysis_preview: {
        Args: { p_scan_session_id: string }
        Returns: {
          grade: string
          flag_count: number
          flag_red_count: number
          flag_amber_count: number
          proof_of_read: Json
          preview_json: Json
          confidence_score: number
          document_type: string
          rubric_version: string
        }[]
      }
      get_analysis_full: {
        Args: { p_scan_session_id: string; p_phone_e164: string }
        Returns: {
          grade: string
          flags: Json
          full_json: Json
          proof_of_read: Json
          preview_json: Json
          confidence_score: number
          document_type: string
          rubric_version: string
        }[]
      }
```

---

### Fix A3 — Migration SQL: Fix cross-unlock exploit (if not yet applied)

**FILE:** `supabase/migrations/20260322_redact_preview_create_gated_full.sql`  
**ACTION:** EDIT  
**WHY:** The `get_analysis_full` function checks phone verification globally — any verified phone can unlock any session. Must bind phone → lead → scan_session.

Replace the `v_verified` check block:
```sql
  -- Check that this phone has a verified record
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status = 'verified'
  ) INTO v_verified;
```

With:
```sql
  -- Check that this phone has a verified record BOUND to this scan session
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    JOIN public.leads l ON l.id = pv.lead_id
    JOIN public.scan_sessions ss ON ss.lead_id = l.id
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status = 'verified'
      AND ss.id = p_scan_session_id
  ) INTO v_verified;
```

**IMPORTANT:** This fix requires that `phone_verifications` has a `lead_id` column. Check the schema — if `phone_verifications` does NOT have `lead_id`, the join chain must go through `phone_e164` on the `leads` table instead:

```sql
  -- Alternative if phone_verifications has no lead_id column:
  SELECT EXISTS(
    SELECT 1
    FROM public.phone_verifications pv
    JOIN public.leads l ON l.phone_e164 = pv.phone_e164
    JOIN public.scan_sessions ss ON ss.lead_id = l.id
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status = 'verified'
      AND ss.id = p_scan_session_id
  ) INTO v_verified;
```

---

## 3. Verification Checklist

After applying fixes, verify each item:

- [ ] **Preview counts match grade:** A Grade D report shows non-zero issue count (e.g., "5 Issues Identified"), non-zero critical/caution counts, and non-zero "items reviewed"
- [ ] **LockedOverlay headline is correct:** Shows "Your D has 5 red flags" (not "0 red flags")
- [ ] **Summary bar is correct:** Shows "3 critical, 2 caution, 0 confirmed across 5 pillars" (not all zeros)
- [ ] **OTP verify triggers fetchFull:** Browser console shows `[fetchFull] Calling get_analysis_full` after entering correct OTP
- [ ] **fetchFull succeeds:** Console shows `[fetchFull] Full data received, unlocking report` (not an error)
- [ ] **Modal dismisses:** After OTP verify, LockedOverlay disappears and full findings are visible
- [ ] **Full report counts match:** After unlock, counts are derived from actual flags array and match preview counts
- [ ] **Negotiation script appears:** After unlock, the "Your Word-for-Word Script" section renders with real flag data
- [ ] **Route page works too:** `/report/classic/:sessionId` shows correct preview counts and unlocks after OTP
- [ ] **No zero-count false state remains:** No visible "0 issues" or "0 items reviewed" for any grade D/F report

### Pre-flight checks before testing:
- [ ] `get_analysis_full` function exists in Supabase (run `SELECT proname FROM pg_proc WHERE proname = 'get_analysis_full';`)
- [ ] `phone_verifications` table has rows after send-otp (check for `status = 'pending'`)
- [ ] After verify-otp, the row updates to `status = 'verified'`
- [ ] The join chain (phone → lead → scan_session) has matching data

---

## Summary

| Bug | Root Cause | Fix Files | Severity |
|-----|-----------|-----------|----------|
| OTP modal stays | `get_analysis_full` not in types.ts + RPC returns empty silently | `types.ts`, `useAnalysisData.ts`, migration SQL | **P0** |
| Preview shows zeros | `TruthReportClassic` ignores aggregate count props, derives from empty `flags[]` | `TruthReportClassic.tsx`, `PostScanReportSwitcher.tsx`, `Index.tsx`, `ReportClassic.tsx` | **P0** |

**Total files to change: 6**  
**Total lines changed: ~40**  
**No UI redesign. No architecture change. No V2 touch.**
