

# Plan: Cross-Session Identity Isolation Test + Provider Fix

## Critical Architecture Issue Found

The test expects `ReportClassic` to clear stale localStorage on session mismatch (assertion #3: `wm_funnel_phoneE164 === null`). However, `ScanFunnelProvider` only wraps `Index.tsx` — not the `/report/classic/:sessionId` route. This means:

- `useScanFunnelSafe()` returns `null` in `ReportClassic` on direct navigation
- The cleanup effect (line 173) checks `funnel?.scanSessionId` which is `null?.scanSessionId` — **skips entirely**
- localStorage retains stale phone/session keys indefinitely
- The UI is correctly gated (phone input empty), but the storage is dirty

**The test will fail on assertion #3 without an application fix.**

## Changes Required

### 1. Wrap ReportClassic in ScanFunnelProvider (App.tsx)

Move `ScanFunnelProvider` up to wrap the `ReportClassic` route so the cleanup effect in `ReportClassic` can actually call `funnel.resetFunnel()`.

```
// App.tsx line 99
<Route path="/report/classic/:sessionId"
  element={<ScanFunnelProvider><ReportClassic /></ScanFunnelProvider>} />
```

This is the minimal fix. The provider will rehydrate from localStorage, `useScanFunnelSafe()` will return a real context, `isSessionMatch` will detect the mismatch, and the cleanup effect will clear stale keys.

### 2. Create tests/session-isolation.spec.ts

Use the user's provided test code verbatim. Two test cases:

- **Ghost test**: Seeds Session A credentials, navigates to A, then navigates to B without clearing storage. Asserts phone input is empty, OTP UI hidden, localStorage purged, and correct grade rendered.
- **Persistence test**: Seeds Session A, navigates away and back to A. Asserts credentials survive (session ID matches).

### 3. Verify `addInitScript` timing

The test uses `addInitScript` to seed localStorage before JS hydration. On the second `page.goto` (Session B), the `addInitScript` from context creation still runs — but it seeded Session A's values. The React app loads, `ScanFunnelProvider` reads those values, `ReportClassic` detects mismatch, calls `resetFunnel()`, which clears them. This flow is correct **only if** the provider wraps the route.

## Risk Assessment

- **Low risk**: Adding `ScanFunnelProvider` around `ReportClassic` is additive — it enables cleanup that was previously impossible, doesn't change any existing behavior for Index.tsx
- **No regression**: `isSessionMatch` still gates phone data; the only new behavior is that stale localStorage keys get cleaned up

## Files to modify

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap ReportClassic route in `ScanFunnelProvider` |
| `tests/session-isolation.spec.ts` | Create new file with both test cases |

