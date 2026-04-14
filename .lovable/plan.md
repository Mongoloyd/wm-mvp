

## Plan: Cinematic Parallax Image Divider

### What
Create a full-width cinematic image divider between `MarketTruthSection` and `CompetitorQuoteSection` with parallax scrolling, lazy-load fade-in, and vertical gradient blending on all four edges.

### Changes

**1. Copy uploaded image to project**
- Copy `user-uploads://abcdf.avif` to `public/images/contractors-divider.avif`

**2. Create `src/components/sections/CinematicDivider.tsx`**
- Full-width `<section>` with `overflow-hidden`, no vertical padding — acts as a visual break
- `<img>` with `loading="lazy"` for native lazy loading
- Framer Motion `whileInView` animation: fades from `opacity: 0` to `opacity: 1` over ~1.2s
- **Parallax**: Use Framer Motion's `useScroll` + `useTransform` to translate the image Y position at a slower rate than scroll (e.g., `translateY` mapped from `-15%` to `15%`), giving the depth effect. Image is slightly oversized (`scale-110` or `h-[120%]`) so parallax movement doesn't reveal edges
- **Gradient overlays**: Four gradient divs layered on top:
  - Top: `bg-gradient-to-b from-[hsl(216,43%,7%)] to-transparent` (matches page dark bg)
  - Bottom: `bg-gradient-to-t from-[hsl(216,43%,7%)] to-transparent`
  - Left: `bg-gradient-to-r from-[hsl(216,43%,7%)] to-transparent`
  - Right: `bg-gradient-to-l from-[hsl(216,43%,7%)] to-transparent`
- Image height: ~`h-[400px] md:h-[500px]` with `object-cover`

**3. Update `src/pages/Contractors2.tsx`**
- Import `CinematicDivider`
- Insert `<CinematicDivider />` between `<MarketTruthSection />` and `<CompetitorQuoteSection />`

### Section order after change
1. HeroSection
2. MarketTruthSection
3. **CinematicDivider** ← new
4. CompetitorQuoteSection
5. ...rest

