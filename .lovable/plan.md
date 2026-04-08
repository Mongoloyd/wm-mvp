

# Plan: Sync Ticker Stats & Testimonials

## What Changes

Two files, two edits each.

### 1. `src/hooks/useTickerStats.ts`
- Change `EPOCH` from `"2025-06-01"` to `"2026-04-07"`
- Change `SEED_TOTAL` from `3212` to `671`
- Keep the existing seeded-random daily increment loop and `today` calculation exactly as-is

Result: Today (April 8) shows ~671 + one day's increment (~7-31), so roughly 690.

### 2. `src/components/Testimonials.tsx`
- Import `useTickerStats` at the top
- Call `const { total } = useTickerStats()` inside the component
- **Line 254**: Replace hardcoded `3,847` with `{total.toLocaleString()}`
- **Line 246**: Replace hardcoded `$2.4M+` with `{`$${((total * 3800) / 1000000).toFixed(1)}M+`}`

Result: Stats strip reads ~690 quotes / ~$2.6M+ savings, growing daily in sync with the SocialProofStrip pill.

## No Other Changes
- The existing `SocialProofStrip` already calls `useTickerStats` — it will automatically reflect the new seed
- The "94% Had Hidden Red Flags" stays static
- No visual or layout changes

