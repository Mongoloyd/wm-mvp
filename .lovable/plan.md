

# ScamConcernImage — Premium Rotating Carousel

## Summary
Convert the static image into a cycling carousel with fade+scale transitions, preloading, layout-shift prevention, and memoized children.

## Changes — `src/components/ScamConcernImage.tsx`

### 1. Add asset + image array
- Copy uploaded file to `src/assets/background_1.avif`
- Import both images; define `forensicImages` array at module level

### 2. Layout-shift prevention
- Replace the `<img>` with a container div using Tailwind `aspect-video md:aspect-video` (16/9) with `relative overflow-hidden` and the border-radius style
- On mobile, use `aspect-[4/3]` for more breathing room: `className="relative overflow-hidden aspect-[4/3] md:aspect-video"` with `borderRadius: "var(--radius-card)"`

### 3. Cycling state + preloader
- `useState(0)` for index, `useEffect` with 3.5s `setInterval`
- Hidden preloader `<img>` for next index to prevent black flash:
  ```
  <img src={forensicImages[(idx + 1) % forensicImages.length]} className="hidden" alt="" />
  ```

### 4. Premium fade + scale transition
- `AnimatePresence mode="wait"` wrapping a `motion.img` with:
  - `initial={{ opacity: 0, scale: 1.02 }}`
  - `animate={{ opacity: 1, scale: 1 }}`
  - `exit={{ opacity: 0, scale: 0.98 }}`
  - `transition={{ duration: 0.8, ease: "circOut" }}`
  - `loading="eager"`, `className="absolute inset-0 w-full h-full object-cover"`

### 5. Memoized CTA
- Extract the `<figcaption>` button into a `React.memo`-wrapped component so it doesn't re-render on every 3.5s image swap

## Files changed
- `src/assets/background_1.avif` — new asset from upload
- `src/components/ScamConcernImage.tsx` — rewritten with carousel logic

