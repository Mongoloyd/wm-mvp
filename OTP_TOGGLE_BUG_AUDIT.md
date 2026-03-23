# Post-Migration Bug Audit: OTP Unlock Failure & Classic/Findings Toggle

**Date:** 2026-03-22
**Scope:** Classic report flow only. No UI redesign. No V2/Findings-first.

---

## 1. Root Cause Summary

### Task A — OTP Unlock Failure

**Root cause: `supabase.functions.invoke` returns `data: null` for non-2xx responses, AND the frontend has no diagnostic visibility into WHY verification fails.**

The Twilio API integration is structurally correct — `send-otp` calls `Verifications` (create), `verify-otp` calls `VerificationCheck` (check), both use the same `TWILIO_VERIFY_SERVICE_SID` env var, and the phone E.164 value is consistent across the entire chain. The code is not being rejected due to a frontend bug.

The actual failure point depends on which of these scenarios is occurring in production:

| Scenario | Likelihood | Evidence |
|----------|-----------|----------|
| **A1: `verify-otp` edge function not deployed** | HIGH | If the function doesn't exist, `supabase.functions.invoke` returns a `FunctionsRelayError` or `FunctionsHttpError`. The frontend treats this as `error` truthy → shows "Invalid or expired code." The user sees the OTP arrive (send-otp works) but verification always fails. |
| **A2: Twilio VerificationCheck returns non-approved** | MEDIUM | Possible if the Twilio Verify Service SID is misconfigured, the verification expired (10-min window, but user flow takes ~30s), or there's a Twilio account issue. |
| **A3: Edge function returns 200 but `data` is not parsed as JSON** | LOW | supabase-js v2.99.3 auto-parses JSON responses. The edge function sets `Content-Type: application/json`. This should work. |
| **A4: `onVerified` callback fires but `fetchFull` fails silently** | MEDIUM | Even if OTP verifies, `fetchFull` calls `get_analysis_full` RPC which may not exist yet (migration not applied). If the RPC errors, `isFullLoaded` stays false, modal stays. |

**The most likely combined scenario:** Twilio verification succeeds (A1/A2 are not the issue), `onVerified` fires, but `fetchFull` fails because `get_analysis_full` RPC doesn't exist yet or returns empty. The modal stays because `isFullLoaded` never flips. The user perceives this as "OTP didn't work" when actually the OTP DID work but the report unlock failed.

**Critical gap:** The frontend has ZERO diagnostic logging in the OTP → unlock chain. When `fetchFull` fails, it returns silently with no console output. When `submitOtp` gets an error, the actual Twilio error message is lost inside `error.context.json()` (a supabase-js v2 quirk where non-2xx response bodies are only accessible via `error.context.json()`, not via `data`).

### Task B — Classic/Findings Toggle Visible in Production

**Root cause: `IS_DEV_MODE` is hardcoded to `true` on line 36 of `src/pages/Index.tsx`.**

The `AnalysisViewModeToggle` component renders only inside `DevPreviewPanel`, which is gated behind `IS_DEV_MODE`. Since `IS_DEV_MODE = true`, the entire dev panel (including the Classic/Findings toggle, grade preview buttons, and DevQuoteGenerator) is visible to all users.

The toggle itself is functionally inert — no production component reads `useAnalysisViewMode()`. But it exposes internal dev tooling to end users, which is a UX and trust issue.

---

## 2. Exact File-by-File Fix Blocks

### Fix A1 — Add diagnostic logging to `submitOtp` in `usePhonePipeline.ts`

**FILE:** `src/hooks/usePhonePipeline.ts`
**ACTION:** EDIT
**WHY:** The current error handling discards the actual Twilio error message. When `verify-otp` returns non-2xx, `supabase.functions.invoke` puts the response in `error.context`, not `data`. We need to extract it and log it.

```typescript
// REPLACE lines 196-210 with:

      try {
        console.log("[submitOtp] calling verify-otp", {
          phone_e164: activePhone,
          scan_session_id: options?.scanSessionId,
          codeLength: code.length,
        });

        const { data, error } = await supabase.functions.invoke("verify-otp", {
          body: {
            phone_e164: activePhone,
            code,
            scan_session_id: options?.scanSessionId || undefined,
          },
        });

        console.log("[submitOtp] response", { data, error: error?.message });

        // supabase-js v2: non-2xx responses put body in error.context, not data
        if (error) {
          let serverMsg = "Invalid or expired code.";
          try {
            const ctx = await (error as any).context?.json?.();
            if (ctx?.error) serverMsg = ctx.error;
            console.error("[submitOtp] edge function error detail:", ctx);
          } catch {
            console.error("[submitOtp] could not parse error context:", error.message);
          }
          setPhoneStatus("otp_sent"); // allow retry
          setErrorMsg(serverMsg);
          return { status: "invalid_code", error: serverMsg };
        }

        if (!data?.verified) {
          const msg = data?.error || "Verification failed. Please try again.";
          console.warn("[submitOtp] data.verified is falsy:", data);
          setPhoneStatus("otp_sent");
          setErrorMsg(msg);
          return { status: "invalid_code", error: msg };
        }

        console.log("[submitOtp] SUCCESS — verified, calling onVerified");
        setPhoneStatus("verified");
        options?.onVerified?.();
        return { status: "verified" };
```

### Fix A2 — Add diagnostic logging to `submitPhone` (send-otp) error path

**FILE:** `src/hooks/usePhonePipeline.ts`
**ACTION:** EDIT
**WHY:** Same issue — `send-otp` errors are also swallowed. Add context extraction.

```typescript
// REPLACE lines 162-172 with:

    setPhoneStatus("sending_otp");
    try {
      console.log("[submitPhone] calling send-otp", { phone_e164: normalizedE164 });

      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone_e164: normalizedE164 },
      });

      console.log("[submitPhone] response", { data, error: error?.message });

      if (error) {
        let serverMsg = "Failed to send verification code.";
        try {
          const ctx = await (error as any).context?.json?.();
          if (ctx?.error) serverMsg = ctx.error;
          console.error("[submitPhone] edge function error detail:", ctx);
        } catch {
          console.error("[submitPhone] could not parse error context:", error.message);
        }
        setPhoneStatus("otp_failed");
        setErrorMsg(serverMsg);
        return { status: "error", error: serverMsg };
      }

      if (!data?.success) {
        const msg = data?.error || "Failed to send verification code.";
        setPhoneStatus("otp_failed");
        setErrorMsg(msg);
        return { status: "error", error: msg };
      }
```

### Fix B1 — Set `IS_DEV_MODE` to `false` for production

**FILE:** `src/pages/Index.tsx`
**ACTION:** EDIT
**WHY:** `IS_DEV_MODE = true` exposes DevPreviewPanel (including Classic/Findings toggle, grade preview buttons, and DevQuoteGenerator) to all users.

```typescript
// REPLACE line 36:
  const IS_DEV_MODE = true;

// WITH:
  const IS_DEV_MODE = import.meta.env.DEV;
```

This uses Vite's built-in `import.meta.env.DEV` which is `true` in development and `false` in production builds. The DevPreviewPanel, DevQuoteGenerator, and all dev tooling will be hidden in production while remaining available during local development.

### Fix B2 — Remove AnalysisViewModeProvider from production bundle (optional cleanup)

**FILE:** `src/main.tsx`
**ACTION:** EDIT (optional)
**WHY:** The `AnalysisViewModeProvider` wraps the entire app but is only consumed by `DevPreviewPanel`. Removing it from the production tree reduces bundle size and eliminates the localStorage key `wm:analysisViewMode` from being set on user devices.

```typescript
// REPLACE lines 29-31:
  <AnalysisViewModeProvider>
    <App />
  </AnalysisViewModeProvider>

// WITH (conditional wrapping):
  {import.meta.env.DEV ? (
    <AnalysisViewModeProvider>
      <App />
    </AnalysisViewModeProvider>
  ) : (
    <App />
  )}
```

Note: This is a cleanup optimization. Fix B1 alone is sufficient to hide the toggle.

---

## 3. Verification Checklist

After applying fixes, verify:

### OTP Diagnostic Logging (Fix A1 + A2)
- [ ] Open browser DevTools console
- [ ] Submit a real phone number through TruthGateFlow
- [ ] Confirm console shows `[submitPhone] calling send-otp { phone_e164: "+1..." }`
- [ ] Confirm console shows `[submitPhone] response { data: { success: true }, error: null }`
- [ ] After entering OTP code, confirm console shows `[submitOtp] calling verify-otp { phone_e164: "+1...", scan_session_id: "...", codeLength: 6 }`
- [ ] If verification succeeds: confirm `[submitOtp] SUCCESS — verified, calling onVerified`
- [ ] If verification fails: confirm `[submitOtp] edge function error detail: { error: "..." }` with the actual Twilio error message (not just "Invalid or expired code")
- [ ] Confirm `[fetchFull]` logs from previous fix show whether the RPC call succeeds or fails

### Classic/Findings Toggle (Fix B1)
- [ ] Run `npm run build` — confirm no TypeScript errors
- [ ] Serve the production build (`npx serve dist`)
- [ ] Confirm DevPreviewPanel is NOT visible at the bottom of the page
- [ ] Confirm no "DEV" button appears
- [ ] Confirm no Classic/Findings toggle appears
- [ ] Run `npm run dev` — confirm DevPreviewPanel IS visible in development mode

### Combined End-to-End
- [ ] Production build: user sees only the homepage, TruthGateFlow, ScanTheatrics, and report
- [ ] No dev tooling leaks to production
- [ ] Console logs provide clear diagnostic trail for any OTP issues
- [ ] If `get_analysis_full` RPC is deployed: OTP verify → fetchFull → isFullLoaded → modal dismisses → full report renders
- [ ] If `get_analysis_full` RPC is NOT deployed: console clearly shows `[fetchFull] RPC error: ...` explaining why unlock failed

---

## 4. Remaining Blockers (Not Frontend Fixes)

These items cannot be fixed in frontend code and require Supabase dashboard action:

| Blocker | Required Action |
|---------|----------------|
| `get_analysis_full` RPC may not exist | Apply the corrected SQL migration from `SUPABASE_MIGRATION_AUDIT.md` |
| `phone_verifications.lead_id` is always NULL | `send-otp` inserts with no `lead_id`. The corrected `get_analysis_full` SQL requires `lead_id` for session binding. Either: (a) update `send-otp` to accept and store `lead_id`, or (b) use a simpler phone-only check in the RPC |
| `verify-otp` may not be deployed | Verify edge function deployment in Supabase dashboard → Edge Functions |
| Twilio Verify Service SID | Confirm `TWILIO_VERIFY_SERVICE_SID` is set correctly in Supabase edge function secrets |
