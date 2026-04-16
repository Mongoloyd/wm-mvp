

## Performance Optimization Plan — Mobile FCP 3.0s → <1.8s, LCP 4.6s → <2.5s

### Diagnosis Summary

From the Lighthouse data and codebase audit:

```text
Issue                           Impact    Root Cause
─────────────────────────────── ──────── ──────────────────────────────────────
LCP 4.6s (hero mascot image)    HIGH     2.4s "resource load delay" — browser
                                         discovers image late because it's in
                                         a React component, not raw HTML
FCP 3.0s                        HIGH     188KB index bundle + 98KB fbevents.js
                                         block the main thread
300KB unused JS                 HIGH     fbevents.js (98KB), Supabase (37KB),
                                         UI lib (32KB), index bundle (93KB)
25KB unused CSS                 MED      Tailwind not purging aggressively
Forced reflows (25ms+)          MED      framer-motion animate on LCP image
No width/height on LCP image    LOW      Causes CLS on hero
```

### Phase 1: Asset Delivery & LCP Fix (index.html)

**Problem**: The LCP image (`MASCOT_URL` CloudFront avif) is already preloaded in `index.html` line 30-34, but Lighthouse says `fetchpriority=high` is missing from the preload hint. The `<link rel="preload">` lacks `fetchpriority="high"`.

**Fixes**:
1. Add `fetchpriority="high"` to the existing `<link rel="preload" as="image">` for the mascot
2. Add explicit `width` and `height` attributes to the mascot `<img>` in `AuditHero.tsx` (line 106-112) to eliminate CLS
3. Remove `framer-motion` float animation wrapper from the LCP image — the `animate={{ y: [-8, 0, -8] }}` forces reflows on the LCP element itself, delaying paint. Replace with a CSS animation that doesn't trigger layout

### Phase 2: Defer Facebook Pixel (biggest JS win)

**Problem**: `initMetaPixel()` in `FacebookConversionProvider.tsx` line 54 runs on mount and synchronously injects `fbevents.js` (98KB). This blocks FCP.

**Fix**: Defer pixel initialization until after the page becomes interactive:
- Wrap `initMetaPixel()` in `requestIdleCallback` (with a 3-second `setTimeout` fallback)
- This alone saves ~750ms FCP per Lighthouse estimate

### Phase 3: Lazy-load Below-Fold Components

**Problem**: `Index.tsx` eagerly imports ~20 components. Many are below the fold:
- `ForensicChecklist`, `QuoteWatcher`, `IndustryTruth`, `ProcessSteps`, `NarrativeProof`, `ClosingManifesto`, `Testimonials`, `MarketMakerManifesto`, `OrangeScanner`, `ScamConcernImage`, `QuoteSpreadShowcase`, `Footer`

**Fix**: Convert below-fold imports to `React.lazy()` with the existing `LazySection` wrapper pattern. Keep above-fold components (`LinearHeader`, `AuditHero`, `UploadZone`, `TruthGateFlow`) as static imports. This reduces the initial index bundle from ~188KB to roughly ~80-90KB.

### Phase 4: Optimize scan_ocr_hero.png

**Problem**: `scan_ocr_hero.png` is 323KB and imported into `AuditHero`. Lighthouse shows it cached at 0 TTL.

**Fix**: 
- The image uses `loading="lazy"` already (it's below the mascot), so this is secondary
- Convert to AVIF/WebP at build time if possible, or replace the import with an optimized CDN URL

### Phase 5: CSS Purge Verification

**Problem**: 25KB of 32KB CSS is unused on initial load (79%).

**Fix**: Verify `tailwind.config.ts` content paths cover all files (already fixed to include jsx). The contractors3 scoped CSS variables add weight — wrap them in a `@layer` to allow better tree-shaking. No high-effort change needed here; the JS fixes dominate.

### What We Do NOT Touch
- Font stack stays as-is (Barlow Condensed + DM Sans with `font-display: optional` and metric fallbacks is already best-practice)
- Code-splitting in `vite.config.ts` stays as-is (vendor/ui/state/supabase chunks are good)
- Route-level lazy loading in `App.tsx` is already implemented

### Expected Impact

| Metric | Before | After (est.) |
|--------|--------|-------------|
| FCP    | 3.0s   | ~1.6-1.8s   |
| LCP    | 4.6s   | ~2.2-2.5s   |
| Unused JS | 300KB | ~170KB (fbevents deferred, index bundle halved) |

### Files Modified
1. `index.html` — add `fetchpriority` to preload
2. `src/components/AuditHero.tsx` — add width/height to LCP image, replace motion float with CSS
3. `src/components/FacebookConversionProvider.tsx` — defer `initMetaPixel()` with `requestIdleCallback`
4. `src/pages/Index.tsx` — convert ~12 below-fold imports to `React.lazy()`
5. `src/index.css` — add CSS keyframe for mascot float (replacing JS-driven animation)

