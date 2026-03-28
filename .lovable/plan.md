

# Fix: Build Crash + Report Scroll Alignment

## 1. Fix build crash — missing `trackEvent` import (CRITICAL)

**File:** `src/components/InteractiveDemoScan.tsx`

Line 81 calls `trackEvent({ event_name: event })` but nothing is imported. There is no `trackGtmEvent` in this project — the user's external agent suggested that name but it doesn't exist. The project's tracker is `trackEvent` from `@/lib/trackEvent.ts`.

**Fix:** Add `import { trackEvent } from "@/lib/trackEvent";` after line 2.

This is the only build-breaking error.

## 2. Improve report scroll targeting

**File:** `src/pages/Index.tsx`, line 243

Currently: `window.scrollTo({ top: 0, behavior: "smooth" })` — scrolls to absolute page top (the hero), not the report.

**Fix:** Replace with a targeted scroll to the report container. Add a ref or DOM ID to the report wrapper (around line 250), then scroll to it with a short delay so the DOM has rendered:

```ts
onRevealComplete={() => {
  setGradeRevealed(true);
  setTimeout(() => {
    document.getElementById("truth-report-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}}
```

And add `id="truth-report-top"` to the report container `<div>` at line 252.

No rogue `scrollIntoView` calls were found inside `TruthReportFindings` or report sub-components that auto-snap to findings — the only `scrollIntoView` in `TruthReportFindings.tsx` is a user-triggered `scrollToGate` on click, not on mount.

## 3. Fix `fetchPriority` warning

**File:** `src/components/AuditHero.tsx`, line 34

The last diff changed `fetchpriority` → `fetchPriority`, but React's DOM warns on non-standard casing. Change back to lowercase `fetchpriority="high"`.

## Summary

| File | Change |
|---|---|
| `src/components/InteractiveDemoScan.tsx` | Add missing `trackEvent` import (fixes build crash) |
| `src/pages/Index.tsx` | Scroll to report container instead of page top; add `id="truth-report-top"` |
| `src/components/AuditHero.tsx` | Revert `fetchPriority` → `fetchpriority` |

