

## Plan: Fix Build Errors + Add Mobile CTA Button

### Build Error Fixes

**Error 1 — `VerdictHologram` missing `score` prop (line 582)**
Add the `score` prop calculated from `activeAnomalies`: `score={Math.max(0, 95 - (activeAnomalies.length * 12))}`.

**Error 2 — `WindowScanner` doesn't accept props (line 315)**
Update the function signature to accept `onScanClick?: () => void` and `onDemoClick?: () => void`. Update the Index.tsx import if needed (it's currently a default import which should work).

### Mobile CTA Addition

**Insert mobile-only button** immediately after line 412 (inside the grid, before the `lg:col-span-8` div). The button duplicates the sidebar scan button wrapped in `lg:hidden w-full mb-2 z-20 relative`.

### Files Modified
1. `src/components/OrangeScanner.tsx` — all three changes

