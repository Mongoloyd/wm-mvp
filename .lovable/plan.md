

## Restore InteractiveDemoScan.tsx from Progress Bar Project

I found the working file in the [Progress Bar](/projects/e31485cd-5e41-4503-9ad5-2dcb5c98d9dd) project. It's significantly richer than the current minified version — it includes:

- A proper `MockDocument` sub-component with skeleton contract lines, a table mock, and animated scanning overlays (cyan tint, laser line, progress HUD with "AI Engine Active" label)
- A second masked flag card ("Upload yours to unlock →") that acts as a clickable CTA
- A "Scan My Quote" mini-CTA during the reveal phase
- A "Sample" badge on the results view
- Enhanced box-shadow on the container

### What the plan covers

**Single file change: `src/components/InteractiveDemoScan.tsx`** — full overwrite with the Progress Bar version.

### Re-apply check (both already satisfied in the source)

1. **No hover-to-pause logic** — the Progress Bar version has no `onMouseEnter`/`onMouseLeave`/`onTouchStart`/`onTouchEnd` handlers. The animation loops endlessly. Hook phase is already 6000ms. No changes needed.

2. **CTA scroll wiring** — `handleCtaClick` already calls `onScanClick()` when provided, and `Index.tsx` already passes `onScanClick={() => triggerTruthGate('demo_scan')}`. No changes needed.

### No other files modified.

