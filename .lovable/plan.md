

## Replace SocialProofStrip with UrgencyTicker-style two-stat layout

### What changes

Replace the three fake stats in `SocialProofStrip.tsx` with two stat blocks + a live pulsing dot, adapted from the UrgencyTicker component you provided.

### Layout (left to right, centered)

```text
┌──────────────────────────────────────────────────────────┐
│  🛡  3,212  quotes scanned   │  ● +14 today             │
│  (gold)  (gold)  (slate)      │  (green dot) (gold)      │
└──────────────────────────────────────────────────────────┘
```

- Background stays `#0F1F35` (unchanged)
- Two sections divided by a subtle `rgba(255,255,255,0.15)` vertical line
- Left: Shield icon (`lucide-react`) + animated count-up total + "quotes scanned" label
- Right: Pulsing green dot (`#059669`, ping animation) + "+14 today" text
- Colors: Gold `#C8952A` for numbers, `#94A3B8` for labels (matching current scheme)
- Fonts: DM Mono for numbers, DM Sans for labels (matching current)

### Data logic (no database yet)

Create a `useTickerStats` hook:
- **Seed**: total = 3212, today = 14
- **Daily increment**: Uses a deterministic pseudo-random based on day-of-year so the number is consistent per day but increases by 7-31 each day from a fixed epoch
- **Today count**: Random 7-31 for the current day (same seed approach)
- Returns `{ total, today }`

### Files

1. **New**: `src/hooks/useTickerStats.ts` — deterministic daily-increment logic
2. **Rewrite**: `src/components/SocialProofStrip.tsx` — replace 3-stat layout with 2-stat UrgencyTicker layout, keep existing `useCountUp`, `motion`/`useInView` animation, and the `#0F1F35` background container

