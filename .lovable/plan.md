

## Plan: Clean header badge + sync all counters to useTickerStats

### 1. LinearHeader — remove the badge

Strip the cyan "4,127 scans this month" badge entirely (lines 21-24). Keep only the WINDOWMAN.PRO wordmark on the left and an empty right side for now (future: hamburger on mobile, sign-up on desktop).

### 2. PowerToolDemo — replace hardcoded SCAN_COUNT

`PowerToolDemo.tsx` line 10 has `const SCAN_COUNT = 2432`. Replace this with `useTickerStats().total` so the "Join X+ homeowners" text stays in sync with the ticker.

### 3. ExitIntentModal — replace COUNTY_STATS.scanned with ticker total

The modal shows `stats.scanned` (312, 287, 241, or 2400 fallback). Replace the `scanned` value with `useTickerStats().total` so the "We've analyzed X quotes" number matches the ticker. Keep `overcharge` and `redFlags` as-is (those are county-specific financial stats, not scan counts).

### Files changed

| File | Change |
|------|--------|
| `LinearHeader.tsx` | Delete badge div (lines 21-24), keep header with just the wordmark |
| `PowerToolDemo.tsx` | Import `useTickerStats`, replace `SCAN_COUNT = 2432` with hook value |
| `ExitIntentModal.tsx` | Import `useTickerStats`, use `total` for the "analyzed X quotes" stat |

