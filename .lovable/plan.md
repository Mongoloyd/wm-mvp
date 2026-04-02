

# Fix SocialProofStrip Visibility

## Current State
- **No crash exists.** Every component that uses `useTickerStats` (SocialProofStrip, ExitIntentModal, TruthGateFlow, ClosingManifesto, FlowBEntry, PowerToolDemo) imports the hook independently. Index.tsx has zero references to `total` or `today` — there is nothing to restore.
- **The real issue:** SocialProofStrip is invisible because `useInView(ref, { once: true, amount: 0.5 })` requires 50% of the element to be visible before triggering the animation from `opacity: 0` to `opacity: 1`. The strip is too short for this threshold to reliably fire.

## Plan — One change, one file

### File: `src/components/SocialProofStrip.tsx`
**Line 24** — Change `amount: 0.5` to `amount: 0.1`

This lowers the intersection threshold so the count-up animation triggers as soon as 10% of the strip scrolls into view, making it reliably visible.

No other files need changes.

