

# Remaining Fix: ReportClassic.tsx — Two Changes

All other bugs (1, 2, 3, 5, 6) are confirmed implemented correctly. Only Bug 4 has two incomplete items in `src/pages/ReportClassic.tsx`.

## Change A: Remove `onVerified` from pipeline options (lines 118-125)

Replace the current pipeline init with:
```ts
const pipeline = usePhonePipeline("validate_and_send_otp", {
  scanSessionId: sessionId ?? null,
  externalPhoneE164: funnel?.phoneE164 ?? null,
});
```

The `onVerified` callback is redundant — `handleOtpSubmit` (line 171) already handles the post-verify handoff with `fetchFull(result.e164)` and `funnel.setPhone(result.e164, "verified")`.

## Change B: Delete the auto-fetch `useEffect` (lines 127-133)

Delete this entire block:
```ts
useEffect(() => {
  if (fullFetchTriggeredRef.current) return;
  if (funnel?.phoneStatus === "verified" && !isFullLoaded && !isLoadingFull && !isLoading && funnel?.phoneE164) {
    fetchFull(funnel.phoneE164);
  }
}, [funnel?.phoneStatus, funnel?.phoneE164, isFullLoaded, isLoadingFull, isLoading, fetchFull]);
```

This effect fires on the same React render that `funnel.setPhone(result.e164, "verified")` triggers from `handleOtpSubmit`, creating a duplicate `get_analysis_full` RPC. The returning-user case is already handled by `tryResume` (line 104-107). The fresh-verify case is owned by `handleOtpSubmit` (line 182-183).

## Files touched
- `src/pages/ReportClassic.tsx` — two deletions, no new code

