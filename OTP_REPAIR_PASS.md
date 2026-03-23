# OTP / Dev-Surface / Lead-Binding Repair Pass

**Date:** 2026-03-22
**Repo:** `Mongoloyd/wm-mvp`

---

## 1. Simple Root Cause Summary

### Why OTP currently feels broken

The Twilio OTP integration is structurally wired correctly — `send-otp` creates a Twilio Verification, `verify-otp` checks it, and the frontend callback chain fires `onVerified → fetchFull`. But failures are **completely invisible**:

- When `supabase.functions.invoke` receives a non-2xx response, it puts the response body in the `error` object, NOT in `data`. The frontend was checking `data?.error` which is always `undefined` for non-2xx — the actual Twilio error message was permanently lost.
- `fetchFull` (in `useAnalysisData.ts`) had zero console output, so if `get_analysis_full` RPC returned empty or errored, the modal stayed up with no explanation.
- The most likely live scenario: Twilio verification succeeds → `onVerified` fires → `fetchFull` calls `get_analysis_full` → RPC returns empty (because `phone_verifications.lead_id` is NULL) → `isFullLoaded` never flips → modal stays. User perceives "OTP didn't work."

### Why the dev toggle is still visible

`IS_DEV_MODE` was hardcoded to `true` on line 36 of `src/pages/Index.tsx`. This caused the DevPreviewPanel (with Classic/Findings toggle, fixture preview states, and rubric comparison) to render in production builds.

### Why full unlock cannot reliably work until lead_id binding is fixed

The corrected `get_analysis_full` RPC requires a three-table JOIN:

```
phone_verifications.lead_id → leads.id ← scan_sessions.lead_id = p_scan_session_id
```

But `send-otp` inserts `phone_verifications` with only `phone_e164` and `status = 'pending'` — `lead_id` is always NULL. The JOIN finds no matching rows, so the RPC returns empty even when the phone IS legitimately verified.

**Timing constraint:** At `send-otp` time (during TruthGateFlow form submission), `scan_session_id` does not exist yet — the user hasn't uploaded a file. The `scan_sessions` row is only created later in UploadZone. Therefore, the binding must happen at `verify-otp` time, when `scan_session_id` IS available (passed from PostScanReportSwitcher).

---

## 2. Frontend Fix Blocks (APPLIED)

All frontend fixes have been applied directly to the repo and compile with 0 TypeScript errors.

### Fix F1 — OTP diagnostics

```
FILE: src/hooks/usePhonePipeline.ts
ACTION: EDIT
WHY: Parse error.context.json() for non-2xx responses and add console logging at every decision point in both submitPhone and submitOtp.
```

**Changes applied:**

In `submitPhone`:
- Added `console.log("[usePhonePipeline] submitPhone → calling send-otp", { phone })` before the call
- Split the `if (error || !data?.success)` check into two branches:
  - `if (error)`: parses `error.context.json()` for the actual Twilio error message
  - `if (!data?.success)`: logs the response body
- Added `console.log("[usePhonePipeline] send-otp SUCCESS")` on success
- Added `console.error("[usePhonePipeline] send-otp network exception:", err)` in catch

In `submitOtp`:
- Added `console.log("[usePhonePipeline] submitOtp → calling verify-otp", { phone, code, scanSessionId })` before the call
- Split the `if (error || !data?.verified)` check into two branches:
  - `if (error)`: parses `error.context.json()` for the actual Twilio error message
  - `if (!data?.verified)`: logs the response body
- Added `console.log("[usePhonePipeline] verify-otp SUCCESS — calling onVerified")` on success
- Added `console.error("[usePhonePipeline] verify-otp network exception:", err)` in catch

### Fix F2 — Dev-only UI gating

```
FILE: src/pages/Index.tsx
ACTION: EDIT
WHY: Replace hardcoded IS_DEV_MODE = true with import.meta.env.DEV so DevPreviewPanel, Classic/Findings toggle, and all dev preview controls are hidden in production builds.
```

**Change:**
```diff
-  const IS_DEV_MODE = true;
+  const IS_DEV_MODE = import.meta.env.DEV;
```

### Fix F3 — AnalysisViewModeProvider conditional wrapping

```
FILE: src/main.tsx
ACTION: EDIT
WHY: Only wrap the app in AnalysisViewModeProvider during dev builds, preventing the provider from loading in production where it serves no purpose.
```

**Change:**
```diff
-createRoot(document.getElementById("root")!).render(
-  <AnalysisViewModeProvider>
-    <App />
-  </AnalysisViewModeProvider>
-);
+createRoot(document.getElementById("root")!).render(
+  import.meta.env.DEV ? (
+    <AnalysisViewModeProvider>
+      <App />
+    </AnalysisViewModeProvider>
+  ) : (
+    <App />
+  )
+);
```

### Fix F4 — fetchFull diagnostics (previously applied)

```
FILE: src/hooks/useAnalysisData.ts
ACTION: EDIT (already applied in prior commit a26732e)
WHY: Add console logging at every decision point in fetchFull so RPC failures are visible.
```

Already applied — logs at entry, skip, RPC call, RPC response, success, and exception.

---

## 3. Edge Function / Backend Fix Blocks (FOR MANUAL APPLICATION)

### Fix B1 — verify-otp: backfill lead_id on phone_verifications

```
FILE: supabase/functions/verify-otp/index.ts
ACTION: EDIT
WHY: After successful Twilio verification, resolve lead_id from scan_sessions and update the phone_verifications row so get_analysis_full's three-table JOIN can find it.
```

**Current code (lines 43-68):**
```typescript
    if (!twilioRes.ok || twilioData.status !== "approved") {
      return new Response(JSON.stringify({ verified: false, error: "Invalid or expired code." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. Mark phone_verifications row as verified ──────────
    await supabaseAdmin
      .from("phone_verifications")
      .update({ status: "verified", verified_at: new Date().toISOString() })
      .eq("phone_e164", phone_e164)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    // ── 5. If scan_session_id provided, update lead.phone_verified ──
    if (scan_session_id) {
      const { data: session } = await supabaseAdmin
        .from("scan_sessions")
        .select("lead_id")
        .eq("id", scan_session_id)
        .single();

      if (session?.lead_id) {
        await supabaseAdmin
          .from("leads")
          .update({ phone_verified: true })
          .eq("id", session.lead_id);
      }
    }
```

**Replace with:**
```typescript
    if (!twilioRes.ok || twilioData.status !== "approved") {
      return new Response(JSON.stringify({ verified: false, error: "Invalid or expired code." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 4. Resolve lead_id from scan_sessions (if provided) ──
    let resolvedLeadId: string | null = null;
    if (scan_session_id) {
      const { data: session } = await supabaseAdmin
        .from("scan_sessions")
        .select("lead_id")
        .eq("id", scan_session_id)
        .single();
      resolvedLeadId = session?.lead_id || null;
    }

    // ── 5. Mark phone_verifications row as verified + bind lead_id ──
    const updatePayload: Record<string, unknown> = {
      status: "verified",
      verified_at: new Date().toISOString(),
    };
    if (resolvedLeadId) {
      updatePayload.lead_id = resolvedLeadId;
    }

    await supabaseAdmin
      .from("phone_verifications")
      .update(updatePayload)
      .eq("phone_e164", phone_e164)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    // ── 6. If lead found, also mark lead.phone_verified ──
    if (resolvedLeadId) {
      await supabaseAdmin
        .from("leads")
        .update({ phone_verified: true })
        .eq("id", resolvedLeadId);
    }
```

**Why this works:**
- At `verify-otp` time, `scan_session_id` IS available (passed from PostScanReportSwitcher via usePhonePipeline)
- `scan_sessions.lead_id` was set by UploadZone when it created the scan session (via `get_lead_by_session` RPC)
- The `phone_verifications` row now has `lead_id` set, so `get_analysis_full`'s three-table JOIN succeeds:
  ```
  phone_verifications.lead_id → leads.id ← scan_sessions.lead_id = p_scan_session_id
  ```

### Fix B2 — get_analysis_full SQL: corrected authorization

```
SQL CHANGE:
WHY: Replace the global phone check with a session-bound three-table JOIN so a verified phone can only unlock the report for the lead it was verified against.
```

**Drop and recreate:**
```sql
DROP FUNCTION IF EXISTS get_analysis_full(uuid, text);

CREATE OR REPLACE FUNCTION get_analysis_full(
  p_scan_session_id uuid,
  p_phone_e164    text
)
RETURNS TABLE (
  grade              text,
  flags              jsonb,
  pillar_scores      jsonb,
  contractor_name    text,
  county             text,
  confidence_score   numeric,
  document_type      text,
  quality_band       text,
  has_warranty       boolean,
  has_permits        boolean,
  page_count         integer,
  line_item_count    integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify phone is verified AND bound to the same lead as this scan session
  IF NOT EXISTS (
    SELECT 1
    FROM phone_verifications pv
    JOIN leads l ON l.id = pv.lead_id
    JOIN scan_sessions ss ON ss.lead_id = l.id
    WHERE pv.phone_e164 = p_phone_e164
      AND pv.status = 'verified'
      AND ss.id = p_scan_session_id
  ) THEN
    RETURN;  -- empty result set = unauthorized
  END IF;

  RETURN QUERY
  SELECT
    a.grade,
    a.flags,
    a.pillar_scores,
    a.contractor_name,
    a.county,
    a.confidence_score,
    a.document_type,
    a.quality_band,
    a.has_warranty,
    a.has_permits,
    a.page_count,
    a.line_item_count
  FROM analyses a
  WHERE a.scan_session_id = p_scan_session_id
  ORDER BY a.created_at DESC
  LIMIT 1;
END;
$$;
```

### Fix B3 — No changes needed to send-otp

```
FILE: supabase/functions/send-otp/index.ts
ACTION: NO CHANGE
WHY: send-otp is called before scan_session_id exists (during TruthGateFlow form submission). The lead_id binding is correctly deferred to verify-otp time. No changes needed.
```

---

## 4. Manual Verification Checklist

After applying the backend fixes (B1 verify-otp + B2 SQL), test the following:

### Pre-test: Confirm deployment
- [ ] `verify-otp` edge function is redeployed with the lead_id backfill code
- [ ] `get_analysis_full` SQL function is recreated with the session-bound JOIN
- [ ] Frontend is deployed with the latest commit (includes F1-F4 fixes)

### Test: Full OTP flow
1. [ ] Open the homepage, complete TruthGateFlow (4 questions + lead capture)
2. [ ] Receive Twilio OTP on your phone
3. [ ] Upload a quote file → ScanTheatrics plays → report renders
4. [ ] Open browser DevTools console
5. [ ] Enter the OTP code in the LockedOverlay gate
6. [ ] **Console should show:**
   - `[usePhonePipeline] submitOtp → calling verify-otp { phone: "+1...", code: "123456", scanSessionId: "..." }`
   - `[usePhonePipeline] verify-otp SUCCESS — calling onVerified`
   - `[fetchFull] called { scanSessionId: "...", phoneE164: "+1...", isFullLoaded: false }`
   - `[fetchFull] calling get_analysis_full RPC...`
   - `[fetchFull] RPC response { ... }`
   - `[fetchFull] SUCCESS — isFullLoaded set to true, modal should dismiss`
7. [ ] **LockedOverlay modal dismisses**
8. [ ] **Full report renders with all findings visible (not blurred)**

### Test: Preview counts
9. [ ] Before entering OTP, verify the preview report shows non-zero counts:
   - "X Issues Identified" (not 0)
   - "X critical · Y caution · Z confirmed" (not all zeros)
   - "Your [grade] has X red flags" in the LockedOverlay headline

### Test: Dev surfaces hidden
10. [ ] In a production build (`npm run build && npx serve dist`), verify:
    - No DEV button in bottom-left corner
    - No Classic/Findings toggle visible
    - No DevPreviewPanel or fixture preview controls

### Test: Cross-unlock protection
11. [ ] Verify phone A for session AAA
12. [ ] Try calling `get_analysis_full('BBB', phone_A)` directly via Supabase dashboard
13. [ ] Should return empty (no rows) — phone A is only bound to session AAA's lead

### Failure diagnosis
If step 6 shows errors instead of success:
- `verify-otp non-2xx response body: { error: "..." }` → Twilio rejected the code (expired, wrong, or service issue)
- `fetchFull RPC error: { ... }` → `get_analysis_full` SQL is not deployed or has a syntax error
- `fetchFull returned empty` → `phone_verifications.lead_id` is still NULL (verify-otp backfill didn't run)

---

## 5. Data Flow Diagram (Post-Fix)

```
TruthGateFlow                    UploadZone                   PostScanReportSwitcher
─────────────                    ──────────                   ──────────────────────
1. User enters phone             3. User uploads file         5. User enters OTP code
2. send-otp called               4. scan_sessions created     6. verify-otp called
   → phone_verifications            with lead_id                 → resolves lead_id from
     inserted (lead_id=NULL)                                       scan_sessions
   → Twilio Verification                                        → updates phone_verifications
     created                                                       with lead_id
                                                               → marks lead.phone_verified
   funnel stores:                funnel stores:
   - phoneE164                   - scanSessionId              7. onVerified fires
   - phoneStatus=otp_sent                                     8. fetchFull calls
                                                                  get_analysis_full
                                                               → three-table JOIN succeeds
                                                               → full report returned
                                                               → isFullLoaded = true
                                                               → modal dismisses
```
