

# Plan: Simplify SocialProofStrip to Use Central Ticker Directly

## What Changes

One file: `src/components/SocialProofStrip.tsx`

### Remove
- The `useCountUp` helper function (lines 5-20)
- `useRef` and `useState` imports (no longer needed)
- `totalCount` and `todayCount` intermediate variables

### Keep
- The `useTickerStats` import (already present)
- The `useInView` from framer-motion for entry animation
- All visual styling (rings, gradients, shadows) exactly as-is

### Update
- Line 88: `{totalCount.toLocaleString()}` → `{total.toLocaleString()}`
- Line 126: `+{todayCount} Today` → `+{today} Today`

## Result
The pill displays the same values as the Testimonials stats strip, both reading from `useTickerStats`. The count-up animation is removed in favor of instant display, matching the Testimonials behavior.

