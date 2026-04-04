

# Add Forensic Logging to send-otp and verify-otp

No logic changes — instrumentation only.

## Changes

### 1. `supabase/functions/send-otp/index.ts`

**Before the insert (line ~166):** Add `[SEND_OTP_FORENSIC_START]` log with phone (masked), expire result, and timestamp.

**After failed insert (line ~170-171):** Replace generic error log with `[SEND_OTP_DB_ERROR]` that captures the full PostgREST error object (code, message, details, hint).

```typescript
// Before insert
console.log("[SEND_OTP_FORENSIC_START]", JSON.stringify({
  phone_masked: "xxx-xxx-" + phone_e164.slice(-4),
  expireResult: expireErr ? { code: expireErr.code, message: expireErr.message } : "ok",
  timestamp: new Date().toISOString(),
}));

// On insert failure
console.error("[SEND_OTP_DB_ERROR]", JSON.stringify({
  code: insertErr.code,
  message: insertErr.message,
  details: insertErr.details,
  hint: insertErr.hint,
  phone_masked: "xxx-xxx-" + phone_e164.slice(-4),
}));
```

### 2. `supabase/functions/verify-otp/index.ts`

**After the pending row query (line ~50):** Add `[VERIFY_OTP_FORENSIC]` log showing whether a row was found.

```typescript
console.log("[VERIFY_OTP_FORENSIC]", JSON.stringify({
  phone_masked: "xxx-xxx-" + phone_e164.slice(-4),
  pendingRowFound: !!pendingRow,
  pendingRowId: pendingRow?.id ?? null,
  timestamp: new Date().toISOString(),
}));
```

## Impact
- Zero logic changes
- 3 log statements added total
- Next real OTP attempt will produce a clear audit trail in Supabase Edge Function logs

