

## The Problem

The homepage has inconsistent background "bands" that create jarring visual seams between sections:

```text
Section                     Background
─────────────────────────── ──────────────────────────────
LinearHeader                (fixed)
AuditHero                   bg-background (hsl 214 35% 95%)
SocialProofStrip            .wm-bridge-strip (blue-tinted gradient #f9fbff → #f3f8ff + borders)
ScamConcernImage            .wm-bridge-strip (same blue-tinted band)
InteractiveDemoScan         bg-background + border-t/b
TruthGateFlow               (unknown, likely bg-background)
UploadZone                  (unknown)
ProcessSteps                bg-background
SocialProofStrip (2nd)      .wm-bridge-strip
── bridge strip div ──      .wm-bridge-strip py-3
IndustryTruth               bg-background section-recessed
── bridge strip div ──      .wm-bridge-strip py-3
MarketMakerManifesto        bg-card (white) + border-t + section-recessed
── bridge strip div ──      .wm-bridge-strip py-3
NarrativeProof              bg-background
ClosingManifesto            bg-background
── bridge strip div ──      .wm-bridge-strip py-3
Testimonials                bg-background
Footer                      bg-card
```

The `.wm-bridge-strip` creates visible blue-gray horizontal seams. Additionally, alternating between `bg-background` (light blue-gray) and `bg-card` (white) with borders creates choppy transitions.

## The Plan

### 1. Create a `HomepageBackdrop` component (new file)

A fixed, full-viewport background layer (behind all content, `z-0`, `pointer-events-none`) containing:

- **Base**: solid `bg-background`
- **3-4 large, soft gradient blobs** positioned at different vertical offsets using CSS:
  - A blue blob (primary color, ~5-8% opacity) drifting upper-left
  - An orange/amber blob (~5-8% opacity) drifting center-right
  - A second blue blob lower down
  - A subtle orange glow near the bottom
- Blobs use `position: absolute` with large `border-radius: 50%`, `filter: blur(120px)`, and a slow CSS animation (gentle translate drift, 20-30s cycle)
- No canvas, no JS particles — pure CSS for performance

### 2. Remove all `.wm-bridge-strip` usage from the homepage

In `src/pages/Index.tsx`:
- Remove the 3 standalone `<div className="wm-bridge-strip py-3" />` dividers (lines 352, 355, 358)
- Remove `wm-bridge-strip` class from `SocialProofStrip` and `ScamConcernImage`

In `src/components/SocialProofStrip.tsx`:
- Remove `wm-bridge-strip` from the wrapper className

In `src/components/ScamConcernImage.tsx`:
- Remove `wm-bridge-strip` from the section className

### 3. Unify section backgrounds

Make all content sections use transparent or `bg-transparent` so the backdrop blobs show through:
- `IndustryTruth`: remove `section-recessed`, keep `bg-background` → change to `bg-transparent`
- `MarketMakerManifesto`: remove `bg-card border-t border-border section-recessed` → `bg-transparent`
- `InteractiveDemoScan`: remove `border-t border-b border-border` → just `bg-transparent`
- All other sections already on `bg-background` → change to `bg-transparent`
- Cards within sections keep their `bg-card` white backgrounds (unchanged)

### 4. Wire the backdrop into Index.tsx

Add `<HomepageBackdrop />` as the first child inside the main `<div>`, behind all content. All section content sits on top via normal flow (no z-index changes needed since backdrop is `fixed z-0`).

### Technical Details

- Blob CSS animation uses `@keyframes blob-drift` with subtle `translate()` movements
- Colors derived from design tokens: `hsl(var(--primary) / 0.06)` for blue, `hsl(var(--color-vivid-orange) / 0.05)` for orange
- `filter: blur(100px)` or higher for soft edges
- `will-change: transform` for GPU compositing
- `prefers-reduced-motion` media query disables animation

### Files touched
1. **New**: `src/components/HomepageBackdrop.tsx`
2. **Edit**: `src/pages/Index.tsx` — add backdrop, remove bridge strips
3. **Edit**: `src/components/SocialProofStrip.tsx` — remove `wm-bridge-strip`
4. **Edit**: `src/components/ScamConcernImage.tsx` — remove `wm-bridge-strip`
5. **Edit**: `src/components/IndustryTruth.tsx` — transparent bg
6. **Edit**: `src/components/MarketMakerManifesto.tsx` — transparent bg
7. **Edit**: `src/components/InteractiveDemoScan.tsx` — remove borders
8. **Edit**: `tailwind.config.ts` — add `blob-drift` keyframe + animation

