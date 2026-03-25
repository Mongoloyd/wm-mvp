

# Replace Carousel with Static Image

## Understanding
`ScamConcernImageCarousel` cycles through 4 images with Framer Motion `AnimatePresence` and shows them out of order. You want to revert to showing only the single `scam-concern.avif` image — the original `ScamConcernImage` component already does exactly this.

## Plan

### 1. Swap the import in `Index.tsx` (2 lines)
- Change the import from `ScamConcernImageCarousel` → `ScamConcernImage`
- Replace both usages (lines 201 and 216) with `<ScamConcernImage />`

### 2. No other files change
`ScamConcernImage.tsx` already exists with the correct single-image implementation: lazy loaded, optimized (`avif`, `decoding="async"`, `fetchPriority="low"`, `aspectRatio`), fade-in on scroll via `useInView`, and the same CTA caption.

### 3. Optional cleanup
Delete `ScamConcernImageCarousel.tsx` since it will no longer be used.

