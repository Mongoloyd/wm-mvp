

# Remove Duplicate Stats Bar

The screenshot shows two stats bars stacked — the upper one (lines 238-252 in Index.tsx) is the plain inline stats bar I just added, and the lower one is the original `SocialProofStrip` component with the card-style design (white background, rounded, divider, pulsing dot).

## What I'll do

**File: `src/pages/Index.tsx`**
- Delete lines 237-252 (the `{/* Stats Bar */}` div with the inline `total` / `today` display)
- Keep the `<SocialProofStrip />` on line 253 as-is
- Remove the `useTickerStats` import and `const { total, today }` destructure since they're no longer used in this file

One file, three small deletions. The original card-style SocialProofStrip stays exactly where it is.

