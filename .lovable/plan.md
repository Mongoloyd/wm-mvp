

# Plan: Exit Intent Phone — Image-Only Popup

## What It Does

A new exit intent component (`ExitIntentPhoneModal`) that:
- Triggers on the same events (mouse leave top of viewport, tab switch)
- Shows a dark backdrop with the uploaded phone image centered
- Clicking the image fires the same `onCTAClick` (scroll to top + open lead modal)
- Clicking the backdrop dismisses it
- Same session guard (`wm_exit_shown`) so it only fires once
- Same `leadCaptured` check to suppress if lead already captured

## Files

| File | Change |
|------|--------|
| `src/assets/exit-intent-phone.avif` | Copy uploaded image |
| `src/components/ExitIntentPhoneModal.tsx` | New component — same trigger logic as `ExitIntentModal`, but renders only the image as a clickable element with backdrop |
| `src/pages/Index.tsx` | Swap `ExitIntentModal` import → `ExitIntentPhoneModal` (keep old import commented or removed) |

## ExitIntentPhoneModal Details

- Same props interface as `ExitIntentModal` (so it's a drop-in swap)
- Same `useCallback` show logic with `sessionStorage` guard
- Same `mouseleave` + `visibilitychange` listeners
- Render: `AnimatePresence` → backdrop `motion.div` → `motion.img` (fade-in + slight scale-up) with `cursor-pointer` and `onClick={handleCTA}`
- Small X close button in top-right corner of the image
- Image sizing: `max-w-[90vw] max-h-[80vh] object-contain` so it looks great on all screens

## Original ExitIntentModal

Kept as-is in `src/components/ExitIntentModal.tsx` — available to swap back anytime.

